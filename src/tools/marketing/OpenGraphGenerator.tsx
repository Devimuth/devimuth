import { useState, useEffect } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Download, Image as ImageIcon, Eye, Facebook, Twitter, Linkedin } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'

export default function OpenGraphGenerator() {
  const [ogData, setOgData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
    type: 'website',
    siteName: '',
    locale: 'en_US',
  })
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [imageError, setImageError] = useState(false)
  const [showMultiPreview, setShowMultiPreview] = useState(false)

  useEffect(() => {
    if (ogData.title || ogData.description) {
      const tags: string[] = []
      
      if (ogData.title) {
        tags.push(`<meta property="og:title" content="${escapeHtml(ogData.title)}">`)
      }
      if (ogData.description) {
        tags.push(`<meta property="og:description" content="${escapeHtml(ogData.description)}">`)
      }
      if (ogData.image) {
        tags.push(`<meta property="og:image" content="${escapeHtml(ogData.image)}">`)
      }
      if (ogData.url) {
        tags.push(`<meta property="og:url" content="${escapeHtml(ogData.url)}">`)
      }
      if (ogData.type) {
        tags.push(`<meta property="og:type" content="${escapeHtml(ogData.type)}">`)
      }
      if (ogData.siteName) {
        tags.push(`<meta property="og:site_name" content="${escapeHtml(ogData.siteName)}">`)
      }
      if (ogData.locale) {
        tags.push(`<meta property="og:locale" content="${escapeHtml(ogData.locale)}">`)
      }

      setGeneratedHTML(tags.join('\n'))
    } else {
      setGeneratedHTML('')
    }
  }, [ogData])

  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  const handleInputChange = (field: string, value: string) => {
    setOgData(prev => ({ ...prev, [field]: value }))
    if (field === 'image') {
      setImageError(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleCopy = () => {
    if (generatedHTML) {
      copyToClipboard(generatedHTML, 'Open Graph tags copied to clipboard!')
    } else {
      toast.error('No tags to copy')
    }
  }

  const handleDownload = () => {
    if (!generatedHTML) {
      toast.error('No tags to download')
      return
    }

    const blob = new Blob([generatedHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'open-graph-tags.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Open Graph tags downloaded!')
  }

  return (
    <ToolPage
      title="Open Graph Tag Generator"
      description="Generate Open Graph tags for optimal social media sharing previews."
      keywords="Open Graph, og tags, social media, Facebook, LinkedIn, Twitter"
    >
      <div className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Required Tags</h2>
            
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:title *
              </label>
              <input
                type="text"
                value={ogData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Page Title"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:description *
              </label>
              <textarea
                value={ogData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Page description for social sharing"
                rows={3}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:image *
              </label>
              <input
                type="url"
                value={ogData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recommended: 1200x630px (1.91:1 ratio)
              </p>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:url *
              </label>
              <input
                type="url"
                value={ogData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com/page"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Optional Tags</h2>
            
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:type
              </label>
              <select
                value={ogData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="product">Product</option>
                <option value="book">Book</option>
                <option value="profile">Profile</option>
                <option value="video">Video</option>
                <option value="music">Music</option>
              </select>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:site_name
              </label>
              <input
                type="text"
                value={ogData.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Your Site Name"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                og:locale
              </label>
              <input
                type="text"
                value={ogData.locale}
                onChange={(e) => handleInputChange('locale', e.target.value)}
                placeholder="en_US"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Format: language_COUNTRY (e.g., en_US, fr_FR)
              </p>
            </div>

            {/* Image Preview */}
            {ogData.image && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image Preview
                </label>
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800">
                  {!imageError ? (
                    <img
                      src={ogData.image}
                      alt="OG Image Preview"
                      onError={handleImageError}
                      className="max-w-full h-auto rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      <ImageIcon className="h-8 w-8" />
                      <span className="ml-2 text-sm">Unable to load image</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Platform Preview */}
        {generatedHTML && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Platform Previews</h2>
              <button
                onClick={() => setShowMultiPreview(!showMultiPreview)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 transition-colors"
              >
                <Eye className="h-4 w-4" />
                {showMultiPreview ? 'Hide' : 'Show'} Multi-Platform Preview
              </button>
            </div>
            {showMultiPreview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Facebook Preview */}
                <div className="bg-[#1877f2] rounded-lg p-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Facebook className="h-4 w-4 text-white" />
                    <span className="text-xs text-white font-medium">Facebook</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    {ogData.image && !imageError ? (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 relative">
                        <img
                          src={ogData.image}
                          alt="Preview"
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      {ogData.url && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {(() => {
                            try {
                              return new URL(ogData.url).hostname
                            } catch {
                              return ogData.url
                            }
                          })()}
                        </p>
                      )}
                      {ogData.title && (
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                          {ogData.title}
                        </h3>
                      )}
                      {ogData.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {ogData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Twitter Preview */}
                <div className="bg-black dark:bg-gray-800 rounded-lg p-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Twitter className="h-4 w-4 text-white" />
                    <span className="text-xs text-white font-medium">Twitter/X</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    {ogData.image && !imageError ? (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 relative">
                        <img
                          src={ogData.image}
                          alt="Preview"
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      {ogData.url && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {(() => {
                            try {
                              return new URL(ogData.url).hostname
                            } catch {
                              return ogData.url
                            }
                          })()}
                        </p>
                      )}
                      {ogData.title && (
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                          {ogData.title}
                        </h3>
                      )}
                      {ogData.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {ogData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LinkedIn Preview */}
                <div className="bg-[#0a66c2] rounded-lg p-3 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Linkedin className="h-4 w-4 text-white" />
                    <span className="text-xs text-white font-medium">LinkedIn</span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    {ogData.image && !imageError ? (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 relative">
                        <img
                          src={ogData.image}
                          alt="Preview"
                          onError={handleImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2 space-y-1">
                      {ogData.url && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {(() => {
                            try {
                              return new URL(ogData.url).hostname
                            } catch {
                              return ogData.url
                            }
                          })()}
                        </p>
                      )}
                      {ogData.title && (
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                          {ogData.title}
                        </h3>
                      )}
                      {ogData.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {ogData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated HTML */}
        {generatedHTML && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Open Graph Tags</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto text-sm">
              <code className="text-gray-800 dark:text-gray-200">{generatedHTML}</code>
            </pre>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

