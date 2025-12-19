/**
 * JSON utilities for validation, flattening, and manipulation
 */

/**
 * Validate JSON string
 * @param json - JSON string to validate
 * @returns Object with valid flag and optional error message
 */
export function validateJSON(json: string): { valid: boolean; error?: string; data?: any } {
  if (!json || !json.trim()) {
    return { valid: false, error: 'JSON string is empty' }
  }

  try {
    const parsed = JSON.parse(json)
    return { valid: true, data: parsed }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON'
    // Try to extract line number from error message if available
    const lineMatch = errorMessage.match(/position (\d+)/)
    if (lineMatch) {
      const position = parseInt(lineMatch[1])
      const lines = json.substring(0, position).split('\n')
      const lineNumber = lines.length
      const column = lines[lines.length - 1].length + 1
      return {
        valid: false,
        error: `Invalid JSON at line ${lineNumber}, column ${column}: ${errorMessage}`,
      }
    }
    return { valid: false, error: errorMessage }
  }
}

/**
 * Flatten nested JSON object with path notation
 * @param obj - Object to flatten
 * @param prefix - Prefix for nested keys (used recursively)
 * @param separator - Separator for nested keys (default: '.')
 * @returns Flattened object with dot notation keys
 */
export function flattenJSON(
  obj: any,
  prefix: string = '',
  separator: string = '.'
): Record<string, any> {
  const flattened: Record<string, any> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key
      const value = obj[key]

      if (value === null || value === undefined) {
        flattened[newKey] = value
      } else if (Array.isArray(value)) {
        // Handle arrays by indexing
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            Object.assign(flattened, flattenJSON(item, `${newKey}[${index}]`, separator))
          } else {
            flattened[`${newKey}[${index}]`] = item
          }
        })
      } else if (typeof value === 'object') {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenJSON(value, newKey, separator))
      } else {
        flattened[newKey] = value
      }
    }
  }

  return flattened
}

/**
 * Unflatten JSON object (reverse of flattenJSON)
 * @param flat - Flattened object with dot notation keys
 * @param separator - Separator used in keys (default: '.')
 * @returns Unflattened nested object
 */
export function unflattenJSON(flat: Record<string, any>, separator: string = '.'): any {
  const result: any = {}

  for (const key in flat) {
    if (Object.prototype.hasOwnProperty.call(flat, key)) {
      const keys = key.split(separator)
      let current = result

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]
        // Handle array indices like "items[0]"
        const arrayMatch = k.match(/^(.+)\[(\d+)\]$/)
        if (arrayMatch) {
          const arrayKey = arrayMatch[1]
          const arrayIndex = parseInt(arrayMatch[2])
          if (!current[arrayKey]) {
            current[arrayKey] = []
          }
          if (!current[arrayKey][arrayIndex]) {
            current[arrayKey][arrayIndex] = {}
          }
          current = current[arrayKey][arrayIndex]
        } else {
          if (!current[k]) {
            current[k] = {}
          }
          current = current[k]
        }
      }

      const lastKey = keys[keys.length - 1]
      const arrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/)
      if (arrayMatch) {
        const arrayKey = arrayMatch[1]
        const arrayIndex = parseInt(arrayMatch[2])
        if (!current[arrayKey]) {
          current[arrayKey] = []
        }
        current[arrayKey][arrayIndex] = flat[key]
      } else {
        current[lastKey] = flat[key]
      }
    }
  }

  return result
}

/**
 * Get JSON size in bytes
 * @param json - JSON string or object
 * @returns Size in bytes
 */
export function getJSONSize(json: string | object): number {
  const jsonString = typeof json === 'string' ? json : JSON.stringify(json)
  return new Blob([jsonString]).size
}

/**
 * Format JSON with custom indentation
 * @param json - JSON string or object
 * @param indent - Number of spaces for indentation (default: 2)
 * @returns Formatted JSON string
 */
export function formatJSON(json: string | object, indent: number = 2): string {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json
    return JSON.stringify(obj, null, indent)
  } catch (error) {
    throw new Error('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

/**
 * Minify JSON (remove whitespace)
 * @param json - JSON string or object
 * @returns Minified JSON string
 */
export function minifyJSON(json: string | object): string {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json
    return JSON.stringify(obj)
  } catch (error) {
    throw new Error('Invalid JSON: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

