/**
 * Export utilities for GIS data formats (GeoJSON, KML)
 */
import * as turf from '@turf/turf'

/**
 * Export GeoJSON data as a downloadable file
 * @param data - GeoJSON object or string
 * @param filename - Name of the file (without extension)
 */
export function exportGeoJSON(data: any, filename: string = 'geojson-export'): void {
  try {
    const jsonString =
      typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.geojson`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting GeoJSON:', error)
    throw new Error('Failed to export GeoJSON')
  }
}

/**
 * Export KML data as a downloadable file
 * @param data - GeoJSON object
 * @param filename - Name of the file (without extension)
 */
export function exportKML(data: any, filename: string = 'kml-export'): void {
  try {
    const kmlString = geojsonToKML(data)
    const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.kml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting KML:', error)
    throw new Error('Failed to export KML')
  }
}

/**
 * Convert GeoJSON to KML format
 * @param geojson - GeoJSON object
 * @returns KML string
 */
export function geojsonToKML(geojson: any): string {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
`

  // Handle different GeoJSON types
  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features.forEach((feature: any, index: number) => {
      kml += convertFeatureToKML(feature, `Feature_${index}`)
    })
  } else if (geojson.type === 'Feature') {
    kml += convertFeatureToKML(geojson, 'Feature')
  } else {
    // Treat as geometry
    const feature = turf.feature(geojson)
    kml += convertFeatureToKML(feature, 'Geometry')
  }

  kml += `  </Document>
</kml>`

  return kml
}

/**
 * Convert a GeoJSON feature to KML Placemark
 * @param feature - GeoJSON feature
 * @param name - Name for the placemark
 * @returns KML Placemark string
 */
function convertFeatureToKML(feature: any, name: string): string {
  const geometry = feature.geometry || feature
  let kml = `    <Placemark>
      <name>${escapeXML(name)}</name>
`

  if (feature.properties) {
    if (feature.properties.name) {
      kml += `      <name>${escapeXML(feature.properties.name)}</name>
`
    }
    if (feature.properties.description) {
      kml += `      <description>${escapeXML(feature.properties.description)}</description>
`
    }
  }

  kml += `      ${convertGeometryToKML(geometry)}
    </Placemark>
`

  return kml
}

/**
 * Convert GeoJSON geometry to KML geometry
 * @param geometry - GeoJSON geometry
 * @returns KML geometry string
 */
function convertGeometryToKML(geometry: any): string {
  switch (geometry.type) {
    case 'Point':
      return `<Point>
        <coordinates>${geometry.coordinates[0]},${geometry.coordinates[1]}</coordinates>
      </Point>`

    case 'LineString':
      const lineCoords = geometry.coordinates
        .map((coord: number[]) => `${coord[0]},${coord[1]}`)
        .join(' ')
      return `<LineString>
        <coordinates>${lineCoords}</coordinates>
      </LineString>`

    case 'Polygon':
      let polygonKML = '<Polygon>'
      geometry.coordinates.forEach((ring: number[][], index: number) => {
        const ringCoords = ring.map((coord: number[]) => `${coord[0]},${coord[1]}`).join(' ')
        if (index === 0) {
          polygonKML += `
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${ringCoords}</coordinates>
          </LinearRing>
        </outerBoundaryIs>`
        } else {
          polygonKML += `
        <innerBoundaryIs>
          <LinearRing>
            <coordinates>${ringCoords}</coordinates>
          </LinearRing>
        </innerBoundaryIs>`
        }
      })
      polygonKML += `
      </Polygon>`
      return polygonKML

    case 'MultiPoint':
      return `<MultiGeometry>
${geometry.coordinates
  .map(
    (coord: number[]) =>
      `        <Point>
          <coordinates>${coord[0]},${coord[1]}</coordinates>
        </Point>`
  )
  .join('\n')}
      </MultiGeometry>`

    case 'MultiLineString':
      return `<MultiGeometry>
${geometry.coordinates
  .map(
    (lineString: number[][]) =>
      `        <LineString>
          <coordinates>${lineString.map((c: number[]) => `${c[0]},${c[1]}`).join(' ')}</coordinates>
        </LineString>`
  )
  .join('\n')}
      </MultiGeometry>`

    case 'MultiPolygon':
      return `<MultiGeometry>
${geometry.coordinates
  .map((polygon: number[][][]) => {
    let polyKML = '        <Polygon>'
    polygon.forEach((ring: number[][], ringIndex: number) => {
      const ringCoords = ring.map((c: number[]) => `${c[0]},${c[1]}`).join(' ')
      if (ringIndex === 0) {
        polyKML += `
          <outerBoundaryIs>
            <LinearRing>
              <coordinates>${ringCoords}</coordinates>
            </LinearRing>
          </outerBoundaryIs>`
      } else {
        polyKML += `
          <innerBoundaryIs>
            <LinearRing>
              <coordinates>${ringCoords}</coordinates>
            </LinearRing>
          </innerBoundaryIs>`
      }
    })
    polyKML += `
        </Polygon>`
    return polyKML
  })
  .join('\n')}
      </MultiGeometry>`

    default:
      return '<Point><coordinates>0,0</coordinates></Point>'
  }
}

/**
 * Escape XML special characters
 * @param str - String to escape
 * @returns Escaped string
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

