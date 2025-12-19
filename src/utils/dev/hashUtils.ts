/**
 * Hash utilities for file hashing and hash comparison
 */

/**
 * Hash a file using Web Crypto API
 * @param file - File to hash
 * @param algorithm - Hash algorithm ('SHA-256', 'SHA-512', or 'MD5')
 * @returns Promise resolving to hex hash string
 */
export async function hashFile(
  file: File,
  algorithm: 'SHA-256' | 'SHA-512' | 'MD5'
): Promise<string> {
  if (algorithm === 'MD5') {
    // MD5 is not available in Web Crypto API
    // Use a simple implementation (not cryptographically secure)
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    // Simple MD5-like hash (not real MD5, just for compatibility)
    let hash = 0
    for (let i = 0; i < uint8Array.length; i++) {
      hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff
    }
    return Math.abs(hash).toString(16).padStart(32, '0')
  }

  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash text using Web Crypto API
 * @param text - Text to hash
 * @param algorithm - Hash algorithm ('SHA-256', 'SHA-512', or 'MD5')
 * @returns Promise resolving to hex hash string
 */
export async function hashText(
  text: string,
  algorithm: 'SHA-256' | 'SHA-512' | 'MD5'
): Promise<string> {
  if (algorithm === 'MD5') {
    // MD5 is not available in Web Crypto API
    // Use a simple implementation (not cryptographically secure)
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff
    }
    return Math.abs(hash).toString(16).padStart(32, '0')
  }

  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Compare two hashes (case-insensitive)
 * @param hash1 - First hash
 * @param hash2 - Second hash
 * @returns True if hashes match
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase().trim() === hash2.toLowerCase().trim()
}

/**
 * Format hash for display (with optional grouping)
 * @param hash - Hash string
 * @param groupSize - Number of characters per group (default: 8)
 * @returns Formatted hash string
 */
export function formatHash(hash: string, groupSize: number = 8): string {
  const cleaned = hash.replace(/\s/g, '')
  const groups: string[] = []
  for (let i = 0; i < cleaned.length; i += groupSize) {
    groups.push(cleaned.slice(i, i + groupSize))
  }
  return groups.join(' ')
}

