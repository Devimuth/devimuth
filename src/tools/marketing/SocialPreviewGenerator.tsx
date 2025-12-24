import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Facebook, Twitter, Linkedin, Instagram, Image as ImageIcon, Download, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function SocialPreviewGenerator() {
  const [platform, setPlatform] = useState<'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'pinterest' | 'reddit' | 'whatsapp' | 'telegram'>('facebook')
  const [previewData, setPreviewData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
  })
  const [imageError, setImageError] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const platformSpecs = {
    facebook: {
      name: 'Facebook',
      icon: Facebook,
      imageSize: '1200x630px',
      titleMax: 100,
      descriptionMax: 200,
      color: 'bg-[#1877f2]',
      previewStyle: 'facebook',
      tips: 'Use engaging visuals, keep titles under 100 chars, and include a clear call-to-action.',
    },
    twitter: {
      name: 'Twitter/X',
      icon: Twitter,
      imageSize: '1200x675px',
      titleMax: 70,
      descriptionMax: 200,
      color: 'bg-black dark:bg-[#000000]',
      previewStyle: 'twitter',
      tips: 'Keep it concise! Titles work best under 70 characters. Use relevant hashtags.',
    },
    linkedin: {
      name: 'LinkedIn',
      icon: Linkedin,
      imageSize: '1200x627px',
      titleMax: 150,
      descriptionMax: 300,
      color: 'bg-[#0a66c2]',
      previewStyle: 'linkedin',
      tips: 'Professional tone works best. Use industry-specific keywords and keep descriptions informative.',
    },
    instagram: {
      name: 'Instagram',
      icon: Instagram,
      imageSize: '1080x1080px',
      titleMax: 150,
      descriptionMax: 2200,
      color: 'bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
      previewStyle: 'instagram',
      tips: 'Visual content is key! Use high-quality square images and engaging captions with emojis.',
    },
    pinterest: {
      name: 'Pinterest',
      icon: ImageIcon,
      imageSize: '1000x1500px',
      titleMax: 100,
      descriptionMax: 500,
      color: 'bg-[#bd081c]',
      previewStyle: 'pinterest',
      tips: 'Vertical images (2:3 ratio) perform best. Use descriptive titles and rich keywords in descriptions.',
    },
    reddit: {
      name: 'Reddit',
      icon: ImageIcon,
      imageSize: '1200x628px',
      titleMax: 300,
      descriptionMax: 10000,
      color: 'bg-[#ff4500]',
      previewStyle: 'reddit',
      tips: 'Clear, descriptive titles are essential. Reddit users value authenticity and detailed information.',
    },
    whatsapp: {
      name: 'WhatsApp',
      icon: ImageIcon,
      imageSize: '1200x630px',
      titleMax: 65,
      descriptionMax: 160,
      color: 'bg-[#25d366]',
      previewStyle: 'whatsapp',
      tips: 'Keep it short and personal. WhatsApp previews show limited text, so make every word count.',
    },
    telegram: {
      name: 'Telegram',
      icon: ImageIcon,
      imageSize: '1200x630px',
      titleMax: 70,
      descriptionMax: 200,
      color: 'bg-[#0088cc]',
      previewStyle: 'telegram',
      tips: 'Similar to WhatsApp, keep titles concise. Telegram supports longer descriptions.',
    },
  }

  const currentSpec = platformSpecs[platform]

  const handleInputChange = (field: string, value: string) => {
    setPreviewData(prev => ({ ...prev, [field]: value }))
    if (field === 'image') {
      setImageError(false)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const handleExportImage = async () => {
    const previewElement = document.getElementById('social-preview')
    if (!previewElement) return

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(previewElement, {
        backgroundColor: null,
        scale: 2,
      })
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `social-preview-${platform}.png`
      link.click()
    } catch (error) {
      console.error('Failed to export image:', error)
    }
  }

  const getCharacterWarning = (current: number, max: number): { color: string; message: string } => {
    if (current === 0) return { color: 'text-gray-500', message: '' }
    if (current <= max * 0.8) return { color: 'text-green-600 dark:text-green-400', message: 'Good length' }
    if (current <= max) return { color: 'text-yellow-600 dark:text-yellow-400', message: 'Approaching limit' }
    return { color: 'text-red-600 dark:text-red-400', message: 'Exceeds limit' }
  }

  const titleWarning = getCharacterWarning(previewData.title.length, currentSpec.titleMax)
  const descWarning = getCharacterWarning(previewData.description.length, currentSpec.descriptionMax)

  return (
    <ToolPage
      title="Social Media Preview Generator"
      description="Preview how your content will look on Facebook, Twitter, LinkedIn, and Instagram."
      keywords="social media preview, Facebook, Twitter, LinkedIn, Instagram, og tags"
    >
      <div className="space-y-6">
        {/* Platform Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Platform
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Dark Mode Preview
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {Object.entries(platformSpecs).map(([key, spec]) => {
              const Icon = spec.icon
              return (
                <button
                  key={key}
                  onClick={() => setPlatform(key as any)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    platform === key
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${platform === key ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                  <p className={`text-xs font-medium ${platform === key ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {spec.name}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content</h2>
            
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={previewData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Page Title"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <div className="mt-1 flex items-center justify-between">
                <p className={`text-xs flex items-center gap-1 ${titleWarning.color}`}>
                  {previewData.title.length > currentSpec.titleMax ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : previewData.title.length > 0 ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : null}
                  {previewData.title.length} / {currentSpec.titleMax} characters
                </p>
                {titleWarning.message && (
                  <p className={`text-xs ${titleWarning.color}`}>{titleWarning.message}</p>
                )}
              </div>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={previewData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Page description"
                rows={4}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <div className="mt-1 flex items-center justify-between">
                <p className={`text-xs flex items-center gap-1 ${descWarning.color}`}>
                  {previewData.description.length > currentSpec.descriptionMax ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : previewData.description.length > 0 ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : null}
                  {previewData.description.length} / {currentSpec.descriptionMax} characters
                </p>
                {descWarning.message && (
                  <p className={`text-xs ${descWarning.color}`}>{descWarning.message}</p>
                )}
              </div>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={previewData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Recommended: {currentSpec.imageSize}
              </p>
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL
              </label>
              <input
                type="url"
                value={previewData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com/page"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
              <button
                onClick={handleExportImage}
                className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-1 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
            
            <div id="social-preview" className={`${currentSpec.color} rounded-lg p-4 shadow-lg`}>
              <div className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg overflow-hidden`}>
                {/* Image */}
                {previewData.image ? (
                  <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 relative">
                    {!imageError ? (
                      <img
                        src={previewData.image}
                        alt="Preview"
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Content */}
                <div className="p-3 space-y-1">
                  {previewData.url && (
                    <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {(() => {
                        try {
                          return new URL(previewData.url).hostname
                        } catch {
                          return previewData.url
                        }
                      })()}
                    </p>
                  )}
                  {previewData.title && (
                    <h3 className={`font-semibold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {previewData.title}
                    </h3>
                  )}
                  {previewData.description && (
                    <p className={`text-xs line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {previewData.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Platform:</strong> {currentSpec.name}<br />
                  <strong>Image Size:</strong> {currentSpec.imageSize}<br />
                  <strong>Title Max:</strong> {currentSpec.titleMax} chars<br />
                  <strong>Description Max:</strong> {currentSpec.descriptionMax} chars
                </p>
              </div>
              
              {currentSpec.tips && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Best Practices</p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">{currentSpec.tips}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  )
}

