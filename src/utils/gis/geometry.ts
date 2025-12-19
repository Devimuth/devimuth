/**
 * Extended geometry utilities for WKT and GeoJSON conversion
 * Supports MultiPoint, MultiLineString, MultiPolygon, GeometryCollection
 */

/**
 * Convert WKT to GeoJSON (extended support)
 * @param wkt - Well-Known Text string
 * @returns GeoJSON geometry object
 */
export function wktToGeoJSONExtended(wkt: string): any {
  try {
    const trimmed = wkt.trim()

    // Point
    if (trimmed.match(/^POINT\s*\(/i)) {
      const coords = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
      if (coords) {
        return {
          type: 'Point',
          coordinates: [parseFloat(coords[2]), parseFloat(coords[1])],
        }
      }
    }

    // LineString
    if (trimmed.match(/^LINESTRING\s*\(/i)) {
      const coords = trimmed.match(/LINESTRING\s*\((.*?)\)/i)
      if (coords) {
        const points = coords[1].split(',').map((p) => {
          const [x, y] = p.trim().split(/\s+/)
          return [parseFloat(y), parseFloat(x)]
        })
        return {
          type: 'LineString',
          coordinates: points,
        }
      }
    }

    // Polygon
    if (trimmed.match(/^POLYGON\s*\(/i)) {
      const coords = trimmed.match(/POLYGON\s*\((.*?)\)/i)
      if (coords) {
        const rings = coords[1].split(/\),\s*\(/).map((ring) => {
          const cleanRing = ring.replace(/[()]/g, '')
          const points = cleanRing.split(',').map((p) => {
            const [x, y] = p.trim().split(/\s+/)
            return [parseFloat(y), parseFloat(x)]
          })
          return points
        })
        return {
          type: 'Polygon',
          coordinates: rings,
        }
      }
    }

    // MultiPoint
    if (trimmed.match(/^MULTIPOINT\s*\(/i)) {
      const coords = trimmed.match(/MULTIPOINT\s*\((.*?)\)/i)
      if (coords) {
        // Handle both formats: MULTIPOINT((x y), (x y)) and MULTIPOINT(x y, x y)
        const points = coords[1]
          .split(/\),\s*\(|,\s*(?=\d)/)
          .map((p) => {
            const clean = p.replace(/[()]/g, '').trim()
            const [x, y] = clean.split(/\s+/)
            return [parseFloat(y), parseFloat(x)]
          })
        return {
          type: 'MultiPoint',
          coordinates: points,
        }
      }
    }

    // MultiLineString
    if (trimmed.match(/^MULTILINESTRING\s*\(/i)) {
      const coords = trimmed.match(/MULTILINESTRING\s*\((.*?)\)/i)
      if (coords) {
        const lineStrings = coords[1].split(/\),\s*\(/).map((lineString) => {
          const clean = lineString.replace(/[()]/g, '')
          const points = clean.split(',').map((p) => {
            const [x, y] = p.trim().split(/\s+/)
            return [parseFloat(y), parseFloat(x)]
          })
          return points
        })
        return {
          type: 'MultiLineString',
          coordinates: lineStrings,
        }
      }
    }

    // MultiPolygon
    if (trimmed.match(/^MULTIPOLYGON\s*\(/i)) {
      const coords = trimmed.match(/MULTIPOLYGON\s*\((.*?)\)/i)
      if (coords) {
        // Split by )), ( to separate polygons
        const polygons = coords[1].split(/\)\),\s*\(\(/).map((polygon) => {
          const clean = polygon.replace(/^\(|\)$/g, '')
          const rings = clean.split(/\),\s*\(/).map((ring) => {
            const cleanRing = ring.replace(/[()]/g, '')
            const points = cleanRing.split(',').map((p) => {
              const [x, y] = p.trim().split(/\s+/)
              return [parseFloat(y), parseFloat(x)]
            })
            return points
          })
          return rings
        })
        return {
          type: 'MultiPolygon',
          coordinates: polygons,
        }
      }
    }

    // GeometryCollection
    if (trimmed.match(/^GEOMETRYCOLLECTION\s*\(/i)) {
      const geometries = trimmed.match(/GEOMETRYCOLLECTION\s*\((.*?)\)/i)
      if (geometries) {
        // Parse nested geometries (simplified - may need more robust parsing)
        const geoms: any[] = []
        let depth = 0
        let current = ''

        for (let i = geometries[1].length - 1; i >= 0; i--) {
          const char = geometries[1][i]
          if (char === ')') depth++
          if (char === '(') depth--
          current = char + current

          if (depth === 0 && current.trim()) {
            try {
              const geom = wktToGeoJSONExtended(current.trim())
              if (geom) geoms.unshift(geom)
            } catch (e) {
              // Skip invalid geometries
            }
            current = ''
          }
        }

        return {
          type: 'GeometryCollection',
          geometries: geoms,
        }
      }
    }

    throw new Error('Unsupported WKT geometry type or invalid format')
  } catch (error) {
    throw new Error(`Invalid WKT format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Convert GeoJSON to WKT (extended support)
 * @param geojson - GeoJSON geometry object
 * @returns WKT string
 */
export function geoJSONToWKTExtended(geojson: any): string {
  try {
    switch (geojson.type) {
      case 'Point':
        const [lon, lat] = geojson.coordinates
        return `POINT(${lon} ${lat})`

      case 'LineString':
        const coords = geojson.coordinates
          .map(([lon, lat]: [number, number]) => `${lon} ${lat}`)
          .join(', ')
        return `LINESTRING(${coords})`

      case 'Polygon':
        const rings = geojson.coordinates.map((ring: number[][]) => {
          const coords = ring.map(([lon, lat]) => `${lon} ${lat}`).join(', ')
          return `(${coords})`
        })
        return `POLYGON(${rings.join(', ')})`

      case 'MultiPoint':
        const points = geojson.coordinates
          .map(([lon, lat]: [number, number]) => `${lon} ${lat}`)
          .join(', ')
        return `MULTIPOINT(${points})`

      case 'MultiLineString':
        const lineStrings = geojson.coordinates.map((lineString: number[][]) => {
          const coords = lineString.map(([lon, lat]) => `${lon} ${lat}`).join(', ')
          return `(${coords})`
        })
        return `MULTILINESTRING(${lineStrings.join(', ')})`

      case 'MultiPolygon':
        const polygons = geojson.coordinates.map((polygon: number[][][]) => {
          const rings = polygon.map((ring: number[][]) => {
            const coords = ring.map(([lon, lat]) => `${lon} ${lat}`).join(', ')
            return `(${coords})`
          })
          return `(${rings.join(', ')})`
        })
        return `MULTIPOLYGON(${polygons.join(', ')})`

      case 'GeometryCollection':
        const geometries = geojson.geometries
          .map((geom: any) => geoJSONToWKTExtended(geom))
          .join(', ')
        return `GEOMETRYCOLLECTION(${geometries})`

      default:
        throw new Error(`Unsupported GeoJSON geometry type: ${geojson.type}`)
    }
  } catch (error) {
    throw new Error(`Invalid GeoJSON format: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

