import { useState, useEffect, useRef } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Scissors, Trash2, Download, Lock, Search } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { generateShortCode, validateURL, storeURLMapping, getURLMappings, deleteURLMapping } from '../../utils/marketing/urlUtils'

export default function URLShortener() {
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [history, setHistory] = useState<Record<string, { url: string; createdAt: string; clicks: number; expiresAt?: string; password?: string }>>({})
  const [validationError, setValidationError] = useState<string>('')
  const [expirationDate, setExpirationDate] = useState('')
  const [password, setPassword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const qrContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mappings = getURLMappings()
    setHistory(mappings)
  }, [])

  const handleShorten = () => {
    setValidationError('')
    const validation = validateURL(url)
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid URL')
      toast.error(validation.error || 'Invalid URL')
      return
    }

    try {
      const code = generateShortCode(url, customAlias || undefined)
      setShortCode(code)
      
      // Create short URL (client-side only - for demonstration)
      const baseUrl = window.location.origin
      const shortened = `${baseUrl}/s/${code}`
      setShortUrl(shortened)

      // Store mapping with optional expiration and password
      const mappingData: { url: string; createdAt: string; clicks: number; expiresAt?: string; password?: string } = {
        url,
        createdAt: new Date().toISOString(),
        clicks: 0,
      }
      
      if (expirationDate) {
        mappingData.expiresAt = new Date(expirationDate).toISOString()
      }
      
      if (password) {
        mappingData.password = password
      }
      
      storeURLMapping(code, url, mappingData)
      
      // Update history
      const mappings = getURLMappings()
      setHistory(mappings)

      toast.success('URL shortened!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to shorten URL'
      setValidationError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleCopy = () => {
    if (shortUrl) {
      copyToClipboard(shortUrl, 'Short URL copied to clipboard!')
    } else {
      toast.error('No short URL to copy')
    }
  }

  const handleDelete = (code: string) => {
    deleteURLMapping(code)
    const mappings = getURLMappings()
    setHistory(mappings)
    toast.success('URL deleted from history')
  }

  const handleClear = () => {
    setUrl('')
    setCustomAlias('')
    setShortCode('')
    setShortUrl('')
    setValidationError('')
    setExpirationDate('')
    setPassword('')
  }

  const handleDownloadQR = () => {
    if (!shortUrl) {
      toast.error('No URL to generate QR code')
      return
    }
    
    try {
      const container = qrContainerRef.current
      if (!container) {
        toast.error('QR code container not found')
        return
      }
      
      // Find the SVG element
      const svgElement = container.querySelector('svg')
      if (!svgElement) {
        toast.error('SVG element not found')
        return
      }
      
      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      
      // Create image from SVG
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Create canvas and draw image
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          toast.error('Canvas context not available')
          URL.revokeObjectURL(svgUrl)
          return
        }
        
        ctx.drawImage(img, 0, 0)
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(svgUrl)
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `qr-code-${shortCode || 'url'}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success('QR code downloaded!')
          } else {
            toast.error('Failed to create image')
          }
        }, 'image/png')
      }
      
      img.onerror = () => {
        toast.error('Failed to load SVG image')
        URL.revokeObjectURL(svgUrl)
      }
      
      img.src = svgUrl
    } catch (error) {
      console.error('Error downloading QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  const handleExportHistory = () => {
    const csv = [
      ['Short Code', 'Original URL', 'Clicks', 'Created At', 'Expires At'].join(','),
      ...Object.entries(history).map(([code, data]) => [
        code,
        `"${data.url}"`,
        data.clicks,
        new Date(data.createdAt).toLocaleString(),
        data.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'Never'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'url-history.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('History exported!')
  }

  const filteredHistory = Object.entries(history).filter(([code, data]) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return code.toLowerCase().includes(query) || data.url.toLowerCase().includes(query)
  })

  const totalClicks = Object.values(history).reduce((sum, data) => sum + data.clicks, 0)
  const activeUrls = Object.values(history).filter(data => {
    if (!data.expiresAt) return true
    return new Date(data.expiresAt) > new Date()
  }).length

  return (
    <ToolPage
      title="URL Shortener"
      description="Shorten URLs with custom aliases and generate QR codes. All processing happens client-side."
      keywords="URL shortener, link shortener, QR code, URL shortening"
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="!m-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL to Shorten *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setValidationError('')
              }}
              placeholder="https://example.com/very/long/url"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500 ${
                validationError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {validationError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validationError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Alias (optional)
              </label>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="my-custom-link"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Letters, numbers, and hyphens only
              </p>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expiration Date (optional)
              </label>
              <input
                type="datetime-local"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Protection (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShorten}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 transition-colors"
            >
              <Scissors className="h-4 w-4" />
              Shorten URL
            </button>
            {(url || shortUrl) && (
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Shortened URL */}
        {shortUrl && (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Original URL:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{url}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Short Code:</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{shortCode}</p>
                {expirationDate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Expires: {new Date(expirationDate).toLocaleString()}
                  </p>
                )}
                {password && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Password protected
                  </p>
                )}
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                <div ref={qrContainerRef} className="p-2 bg-white rounded">
                  <QRCodeSVG value={shortUrl} size={150} level="H" />
                </div>
                <button
                  onClick={handleDownloadQR}
                  className="mt-2 px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-1 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download QR
                </button>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> This is a client-side URL shortener. The shortened URLs only work if you have the mapping stored in your browser's localStorage. For production use, you would need a backend service.
              </p>
            </div>
          </div>
        )}

        {/* Analytics Summary */}
        {Object.keys(history).length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
              <button
                onClick={handleExportHistory}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-1 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(history).length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total URLs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalClicks}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Clicks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{activeUrls}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Active URLs</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {Object.keys(history).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">URL History</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {filteredHistory.length > 0 ? (
                filteredHistory.map(([code, data]) => {
                  const isExpired = data.expiresAt && new Date(data.expiresAt) < new Date()
                  return (
                    <div
                      key={code}
                      className={`p-4 bg-gray-50 dark:bg-gray-900 border rounded-md flex items-start justify-between gap-4 ${
                        isExpired ? 'border-red-300 dark:border-red-700 opacity-60' : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-sm font-mono text-purple-600 dark:text-purple-400">{code}</code>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {data.clicks} clicks
                          </span>
                          {data.password && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Protected
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-xs text-red-600 dark:text-red-400">Expired</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{data.url}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Created: {new Date(data.createdAt).toLocaleDateString()}
                          </p>
                          {data.expiresAt && (
                            <p className={`text-xs ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              Expires: {new Date(data.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/s/${code}`, 'URL copied!')}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(code)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
                  No URLs found matching your search.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

