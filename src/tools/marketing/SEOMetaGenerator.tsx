import { useState, useEffect } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Download, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { generateSEOMetaTags, generateReactFormat, generateNextJSFormat, validateTitleLength, validateDescriptionLength, type SEOMetaData } from '../../utils/marketing/seoTemplates'

export default function SEOMetaGenerator() {
  const [formData, setFormData] = useState<SEOMetaData>({
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  })
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [titleValidation, setTitleValidation] = useState<{ valid: boolean; length: number; message: string } | null>(null)
  const [descriptionValidation, setDescriptionValidation] = useState<{ valid: boolean; length: number; message: string } | null>(null)
  const [exportFormat, setExportFormat] = useState<'html' | 'react' | 'nextjs'>('html')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (formData.title) {
      setTitleValidation(validateTitleLength(formData.title))
    } else {
      setTitleValidation(null)
    }
  }, [formData.title])

  useEffect(() => {
    if (formData.description) {
      setDescriptionValidation(validateDescriptionLength(formData.description))
    } else {
      setDescriptionValidation(null)
    }
  }, [formData.description])

  useEffect(() => {
    if (formData.title || formData.description) {
      const html = generateSEOMetaTags(formData)
      setGeneratedHTML(html)
    } else {
      setGeneratedHTML('')
    }
  }, [formData])

  const handleInputChange = (field: keyof SEOMetaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCopy = () => {
    if (generatedHTML) {
      copyToClipboard(generatedHTML, 'Meta tags copied to clipboard!')
    } else {
      toast.error('No meta tags to copy')
    }
  }

  const handleDownload = () => {
    if (!generatedHTML) {
      toast.error('No meta tags to download')
      return
    }

    let content = generatedHTML
    let filename = 'meta-tags.html'
    let mimeType = 'text/html'

    if (exportFormat === 'react') {
      content = generateReactFormat(formData)
      filename = 'meta-tags.jsx'
      mimeType = 'text/javascript'
    } else if (exportFormat === 'nextjs') {
      content = generateNextJSFormat(formData)
      filename = 'meta-tags.jsx'
      mimeType = 'text/javascript'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Meta tags downloaded!')
  }

  const getGeneratedContent = () => {
    if (exportFormat === 'react') {
      return generateReactFormat(formData)
    } else if (exportFormat === 'nextjs') {
      return generateNextJSFormat(formData)
    }
    return generatedHTML
  }

  return (
    <ToolPage
      title="SEO Meta Tag Generator"
      description="Generate comprehensive SEO meta tags including title, description, Open Graph, and Twitter Cards."
      keywords="SEO, meta tags, Open Graph, Twitter Cards, HTML meta tags"
    >
      <div className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Meta Tags */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Meta Tags</h2>
            
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="My Awesome Page"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              {titleValidation && (
                <div className={`mt-1 text-xs flex items-center gap-1 ${
                  titleValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {titleValidation.valid ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  <span>{titleValidation.length} characters - {titleValidation.message}</span>
                </div>
              )}
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="A compelling description of your page..."
                rows={3}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              {descriptionValidation && (
                <div className={`mt-1 text-xs flex items-center gap-1 ${
                  descriptionValidation.valid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {descriptionValidation.valid ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  <span>{descriptionValidation.length} characters - {descriptionValidation.message}</span>
                </div>
              )}
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Canonical URL
              </label>
              <input
                type="url"
                value={formData.canonicalUrl}
                onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                placeholder="https://example.com/page"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Robots Meta
              </label>
              <select
                value={formData.robots}
                onChange={(e) => handleInputChange('robots', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              >
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, follow">Noindex, Follow</option>
                <option value="index, nofollow">Index, Nofollow</option>
                <option value="noindex, nofollow">Noindex, Nofollow</option>
              </select>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <input
                type="text"
                value={formData.language || ''}
                onChange={(e) => handleInputChange('language', e.target.value)}
                placeholder="en, en-US, es, etc."
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                ISO 639-1 language code (e.g., en, es, fr)
              </p>
            </div>
          </div>

          {/* Open Graph & Twitter */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Open Graph Tags</h2>
            
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Title
              </label>
              <input
                type="text"
                value={formData.ogTitle || ''}
                onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                placeholder="Defaults to page title"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Description
              </label>
              <textarea
                value={formData.ogDescription || ''}
                onChange={(e) => handleInputChange('ogDescription', e.target.value)}
                placeholder="Defaults to meta description"
                rows={2}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Image URL
              </label>
              <input
                type="url"
                value={formData.ogImage || ''}
                onChange={(e) => handleInputChange('ogImage', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Type
              </label>
              <select
                value={formData.ogType || 'website'}
                onChange={(e) => handleInputChange('ogType', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="product">Product</option>
                <option value="book">Book</option>
                <option value="profile">Profile</option>
                <option value="video">Video</option>
                <option value="music">Music</option>
                <option value="video.episode">Podcast Episode</option>
              </select>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Site Name
              </label>
              <input
                type="text"
                value={formData.ogSiteName || ''}
                onChange={(e) => handleInputChange('ogSiteName', e.target.value)}
                placeholder="Your Site Name"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OG Image Width
                </label>
                <input
                  type="text"
                  value={formData.ogImageWidth || ''}
                  onChange={(e) => handleInputChange('ogImageWidth', e.target.value)}
                  placeholder="1200"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                />
              </div>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  OG Image Height
                </label>
                <input
                  type="text"
                  value={formData.ogImageHeight || ''}
                  onChange={(e) => handleInputChange('ogImageHeight', e.target.value)}
                  placeholder="630"
                  className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Video URL (optional)
              </label>
              <input
                type="url"
                value={formData.ogVideo || ''}
                onChange={(e) => handleInputChange('ogVideo', e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitter Card Type
              </label>
              <select
                value={formData.twitterCard || 'summary_large_image'}
                onChange={(e) => handleInputChange('twitterCard', e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitter Site (@username)
              </label>
              <input
                type="text"
                value={formData.twitterSite || ''}
                onChange={(e) => handleInputChange('twitterSite', e.target.value)}
                placeholder="@yourusername"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitter Creator (@username)
              </label>
              <input
                type="text"
                value={formData.twitterCreator || ''}
                onChange={(e) => handleInputChange('twitterCreator', e.target.value)}
                placeholder="@authorusername"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Twitter Image Alt Text
              </label>
              <input
                type="text"
                value={formData.twitterImageAlt || ''}
                onChange={(e) => handleInputChange('twitterImageAlt', e.target.value)}
                placeholder="Description of the image"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {generatedHTML && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search Engine Preview</h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 transition-colors"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            {showPreview && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="text-blue-600 dark:text-blue-400 text-lg hover:underline cursor-pointer line-clamp-1">
                    {formData.title || 'Page Title'}
                  </div>
                  <div className="text-green-700 dark:text-green-400 text-sm">
                    {formData.canonicalUrl || 'https://example.com/page'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                    {formData.description || 'Page description will appear here...'}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Meta Tags</h2>
              <div className="flex gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="px-3 py-1 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                >
                  <option value="html">HTML</option>
                  <option value="react">React</option>
                  <option value="nextjs">Next.js</option>
                </select>
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
              <code className="text-gray-800 dark:text-gray-200">{getGeneratedContent()}</code>
            </pre>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

