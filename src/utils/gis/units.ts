/**
 * Unit conversion utilities for distance and area measurements
 */

// Distance conversion constants (to meters)
const DISTANCE_TO_METERS: Record<string, number> = {
  m: 1,
  km: 1000,
  mi: 1609.344, // 1 mile = 1609.344 meters
  ft: 0.3048, // 1 foot = 0.3048 meters
}

// Area conversion constants (to square meters)
const AREA_TO_M2: Record<string, number> = {
  m2: 1,
  km2: 1000000, // 1 km² = 1,000,000 m²
  acres: 4046.8564224, // 1 acre = 4046.8564224 m²
}

export type DistanceUnit = 'm' | 'km' | 'mi' | 'ft'
export type AreaUnit = 'm2' | 'km2' | 'acres'

/**
 * Convert distance from one unit to another
 * @param value - The distance value to convert
 * @param from - Source unit
 * @param to - Target unit
 * @returns Converted distance value
 */
export function convertDistance(
  value: number,
  from: DistanceUnit,
  to: DistanceUnit
): number {
  if (from === to) return value
  if (value === 0) return 0

  // Convert to meters first, then to target unit
  const meters = value * DISTANCE_TO_METERS[from]
  return meters / DISTANCE_TO_METERS[to]
}

/**
 * Convert area from one unit to another
 * @param value - The area value to convert
 * @param from - Source unit
 * @param to - Target unit
 * @returns Converted area value
 */
export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  if (from === to) return value
  if (value === 0) return 0

  // Convert to square meters first, then to target unit
  const m2 = value * AREA_TO_M2[from]
  return m2 / AREA_TO_M2[to]
}

/**
 * Format distance with unit label
 * @param value - Distance value
 * @param unit - Unit of measurement
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export function formatDistance(
  value: number,
  unit: DistanceUnit,
  decimals: number = 4
): string {
  const unitLabels: Record<DistanceUnit, string> = {
    m: 'm',
    km: 'km',
    mi: 'mi',
    ft: 'ft',
  }
  return `${value.toFixed(decimals)} ${unitLabels[unit]}`
}

/**
 * Format area with unit label
 * @param value - Area value
 * @param unit - Unit of measurement
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted string
 */
export function formatArea(value: number, unit: AreaUnit, decimals: number = 4): string {
  const unitLabels: Record<AreaUnit, string> = {
    m2: 'm²',
    km2: 'km²',
    acres: 'acres',
  }
  return `${value.toFixed(decimals)} ${unitLabels[unit]}`
}

