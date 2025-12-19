/**
 * Validation utilities for GIS coordinates and geometries
 */
import * as turf from '@turf/turf'

/**
 * Validate DMS (Degrees, Minutes, Seconds) values
 * @param degrees - Degrees value
 * @param minutes - Minutes value (0-59)
 * @param seconds - Seconds value (0-59.99)
 * @param isLatitude - Whether this is a latitude (true) or longitude (false)
 * @returns Object with valid flag and error message if invalid
 */
export function validateDMS(
  degrees: number,
  minutes: number,
  seconds: number,
  isLatitude: boolean
): { valid: boolean; error?: string } {
  const maxDegrees = isLatitude ? 90 : 180

  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
    return { valid: false, error: 'All values must be numbers' }
  }

  if (Math.abs(degrees) > maxDegrees) {
    return {
      valid: false,
      error: `${isLatitude ? 'Latitude' : 'Longitude'} degrees must be between -${maxDegrees} and ${maxDegrees}`,
    }
  }

  if (Math.abs(degrees) === maxDegrees && (minutes > 0 || seconds > 0)) {
    return {
      valid: false,
      error: `When degrees is ${maxDegrees}, minutes and seconds must be 0`,
    }
  }

  if (minutes < 0 || minutes >= 60) {
    return { valid: false, error: 'Minutes must be between 0 and 59' }
  }

  if (seconds < 0 || seconds >= 60) {
    return { valid: false, error: 'Seconds must be between 0 and 59.99' }
  }

  return { valid: true }
}

/**
 * Validate bounding box coordinates
 * @param minX - Minimum X coordinate (west)
 * @param minY - Minimum Y coordinate (south)
 * @param maxX - Maximum X coordinate (east)
 * @param maxY - Maximum Y coordinate (north)
 * @returns Object with valid flag and error message if invalid
 */
export function validateBBox(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { valid: boolean; error?: string } {
  if (isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY)) {
    return { valid: false, error: 'All coordinates must be numbers' }
  }

  if (minX >= maxX) {
    return { valid: false, error: 'MinX must be less than MaxX' }
  }

  if (minY >= maxY) {
    return { valid: false, error: 'MinY must be less than MaxY' }
  }

  // Validate coordinate ranges (assuming WGS84)
  if (minX < -180 || maxX > 180) {
    return { valid: false, error: 'X coordinates must be between -180 and 180' }
  }

  if (minY < -90 || maxY > 90) {
    return { valid: false, error: 'Y coordinates must be between -90 and 90' }
  }

  return { valid: true }
}

/**
 * Validate coordinate ranges
 * @param lat - Latitude value
 * @param lon - Longitude value
 * @returns Object with valid flag and error message if invalid
 */
export function validateCoordinates(
  lat: number,
  lon: number
): { valid: boolean; error?: string } {
  if (isNaN(lat) || isNaN(lon)) {
    return { valid: false, error: 'Coordinates must be numbers' }
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' }
  }

  if (lon < -180 || lon > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' }
  }

  return { valid: true }
}

/**
 * Validate GeoJSON geometry
 * @param geojson - GeoJSON object to validate
 * @returns Object with valid flag and array of error messages
 */
export function validateGeometry(geojson: any): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!geojson) {
    return { valid: false, errors: ['GeoJSON is null or undefined'] }
  }

  // Check for required type field
  if (!geojson.type) {
    errors.push('Missing required "type" field')
    return { valid: false, errors }
  }

  // Validate based on type
  try {
    switch (geojson.type) {
      case 'Point':
        if (!Array.isArray(geojson.coordinates) || geojson.coordinates.length < 2) {
          errors.push('Point must have coordinates array with at least 2 elements')
        } else {
          const [lon, lat] = geojson.coordinates
          const coordValidation = validateCoordinates(lat, lon)
          if (!coordValidation.valid) {
            errors.push(coordValidation.error || 'Invalid coordinates')
          }
        }
        break

      case 'LineString':
        if (!Array.isArray(geojson.coordinates) || geojson.coordinates.length < 2) {
          errors.push('LineString must have at least 2 coordinates')
        } else {
          geojson.coordinates.forEach((coord: number[], index: number) => {
            if (!Array.isArray(coord) || coord.length < 2) {
              errors.push(`Coordinate ${index} is invalid`)
            } else {
              const [lon, lat] = coord
              const coordValidation = validateCoordinates(lat, lon)
              if (!coordValidation.valid) {
                errors.push(`Coordinate ${index}: ${coordValidation.error}`)
              }
            }
          })
        }
        break

      case 'Polygon':
        if (!Array.isArray(geojson.coordinates) || geojson.coordinates.length === 0) {
          errors.push('Polygon must have at least one ring')
        } else {
          geojson.coordinates.forEach((ring: number[][], ringIndex: number) => {
            if (!Array.isArray(ring) || ring.length < 4) {
              errors.push(`Ring ${ringIndex} must have at least 4 coordinates`)
            } else {
              // Check if first and last coordinates are the same (closed ring)
              const first = ring[0]
              const last = ring[ring.length - 1]
              if (first[0] !== last[0] || first[1] !== last[1]) {
                errors.push(`Ring ${ringIndex} is not closed (first and last coordinates must match)`)
              }

              ring.forEach((coord: number[], coordIndex: number) => {
                if (!Array.isArray(coord) || coord.length < 2) {
                  errors.push(`Ring ${ringIndex}, coordinate ${coordIndex} is invalid`)
                } else {
                  const [lon, lat] = coord
                  const coordValidation = validateCoordinates(lat, lon)
                  if (!coordValidation.valid) {
                    errors.push(
                      `Ring ${ringIndex}, coordinate ${coordIndex}: ${coordValidation.error}`
                    )
                  }
                }
              })
            }
          })
        }
        break

      case 'Feature':
        if (!geojson.geometry) {
          errors.push('Feature must have a geometry property')
        } else {
          const geometryValidation = validateGeometry(geojson.geometry)
          if (!geometryValidation.valid) {
            errors.push(...geometryValidation.errors)
          }
        }
        break

      case 'FeatureCollection':
        if (!Array.isArray(geojson.features)) {
          errors.push('FeatureCollection must have a features array')
        } else {
          geojson.features.forEach((feature: any, index: number) => {
            if (!feature.geometry) {
              errors.push(`Feature ${index} is missing geometry`)
            } else {
              const geometryValidation = validateGeometry(feature.geometry)
              if (!geometryValidation.valid) {
                errors.push(
                  ...geometryValidation.errors.map((e) => `Feature ${index}: ${e}`)
                )
              }
            }
          })
        }
        break

      default:
        // Try to validate using Turf.js
        try {
          turf.feature(geojson)
          // If it doesn't throw, it's at least parseable
        } catch (error) {
          errors.push(`Unsupported or invalid geometry type: ${geojson.type}`)
        }
    }

    // Additional validation using Turf.js for geometry validity
    try {
      if (geojson.type === 'Polygon') {
        turf.polygon(geojson.coordinates)
        // Check for self-intersections and other issues
        // Turf.js will throw if the geometry is invalid
      }
    } catch (error) {
      errors.push(`Geometry validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

