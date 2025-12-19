/**
 * File handling utilities for dev tools
 */

/**
 * Read file as text
 * @param file - File object to read
 * @returns Promise resolving to file content as string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

/**
 * Read file as Data URL (base64)
 * @param file - File object to read
 * @returns Promise resolving to data URL string
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Read file as ArrayBuffer
 * @param file - File object to read
 * @returns Promise resolving to ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && e.target.result instanceof ArrayBuffer) {
        resolve(e.target.result)
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Download file with specified content
 * @param content - File content as string or Blob
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw new Error('Failed to download file')
  }
}

/**
 * Detect file type based on MIME type and extension
 * @param file - File object
 * @returns Detected file type string
 */
export function detectFileType(file: File): string {
  // Check MIME type first
  if (file.type) {
    return file.type
  }

  // Fallback to extension-based detection
  const extension = file.name.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    csv: 'text/csv',
    txt: 'text/plain',
    js: 'text/javascript',
    ts: 'text/typescript',
    html: 'text/html',
    css: 'text/css',
    xml: 'application/xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  }

  return extension && mimeTypes[extension] ? mimeTypes[extension] : 'application/octet-stream'
}

/**
 * Check if file is an image
 * @param file - File object
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(file.name)
}

/**
 * Check if file is a text file
 * @param file - File object
 * @returns True if file is likely a text file
 */
export function isTextFile(file: File): boolean {
  const textMimeTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-sh',
    'application/x-bash',
  ]
  return textMimeTypes.some((mime) => file.type.startsWith(mime))
}

