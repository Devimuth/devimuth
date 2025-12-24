import { useState, useEffect } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { generateDescriptionVariations, extractKeywords, calculateReadabilityScore, analyzeSentiment } from '../../utils/marketing/descriptionGenerator'
import { validateDescriptionLength } from '../../utils/marketing/seoTemplates'

export default function MetaDescriptionGenerator() {
  const [content, setContent] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'casual' | 'formal'>('professional')
  const [variations, setVariations] = useState<string[]>([])
  const [selectedVariation, setSelectedVariation] = useState<string>('')
  const [autoExtractedKeywords, setAutoExtractedKeywords] = useState<string[]>([])

  useEffect(() => {
    if (content.trim()) {
      const extracted = extractKeywords(content, 5)
      setAutoExtractedKeywords(extracted)
      
      const keywordList = keywords
        ? keywords.split(',').map(k => k.trim()).filter(k => k)
        : extracted

      if (keywordList.length > 0) {
        const descs = generateDescriptionVariations({
          content,
          keywords: keywordList,
          tone,
        })
        setVariations(descs)
        if (descs.length > 0 && !selectedVariation) {
          setSelectedVariation(descs[0])
        }
      } else {
        setVariations([])
        setSelectedVariation('')
      }
    } else {
      setVariations([])
      setSelectedVariation('')
      setAutoExtractedKeywords([])
    }
  }, [content, keywords, tone])

  const validation = selectedVariation ? validateDescriptionLength(selectedVariation) : null
  const readabilityScore = selectedVariation ? calculateReadabilityScore(selectedVariation) : null
  const sentiment = selectedVariation ? analyzeSentiment(selectedVariation) : null

  const handleCopy = () => {
    if (selectedVariation) {
      const html = `<meta name="description" content="${selectedVariation.replace(/"/g, '&quot;')}">`
      copyToClipboard(html, 'Meta description copied to clipboard!')
    } else {
      toast.error('No description to copy')
    }
  }

  const handleDownload = () => {
    if (!selectedVariation) {
      toast.error('No description to download')
      return
    }

    const html = `<meta name="description" content="${selectedVariation.replace(/"/g, '&quot;')}">`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'meta-description.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Meta description downloaded!')
  }

  const regenerateVariations = () => {
    if (!content.trim()) {
      toast.error('Please enter content to generate descriptions')
      return
    }

    // Get keywords - use provided keywords or auto-extracted
    const keywordList = keywords
      ? keywords.split(',').map(k => k.trim()).filter(k => k)
      : autoExtractedKeywords

    if (keywordList.length === 0) {
      // Try to extract keywords if none available
      const extracted = extractKeywords(content, 5)
      if (extracted.length === 0) {
        toast.error('Unable to generate variations. Please add keywords or ensure content has extractable keywords.')
        return
      }
      
      // Use extracted keywords
      const descs = generateDescriptionVariations({
        content,
        keywords: extracted,
        tone,
      })
      setVariations(descs)
      if (descs.length > 0) {
        setSelectedVariation(descs[0])
      }
      toast.success('Generated new variations!')
      return
    }

    // Generate variations with available keywords
    const descs = generateDescriptionVariations({
      content,
      keywords: keywordList,
      tone,
    })
    
    if (descs.length === 0) {
      toast.error('Failed to generate variations. Please check your content and keywords.')
      return
    }

    setVariations(descs)
    setSelectedVariation(descs[0])
    toast.success('Generated new variations!')
  }

  return (
    <ToolPage
      title="Meta Description Generator"
      description="Create optimized meta descriptions with character count validation and keyword suggestions."
      keywords="meta description, SEO, description generator, keyword optimization"
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="!m-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your page content here to generate meta descriptions..."
              rows={8}
              className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {content.length} characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              />
              {autoExtractedKeywords.length > 0 && !keywords && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto-detected: {autoExtractedKeywords.join(', ')}
                </p>
              )}
            </div>

            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>

          <button
            onClick={regenerateVariations}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate Variations
          </button>
        </div>

        {/* Variations */}
        {variations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Variations ({variations.length})
            </h2>
            
            <div className="space-y-2">
              {variations.map((variation, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedVariation(variation)}
                  className={`p-4 border-2 rounded-md cursor-pointer transition-colors ${
                    selectedVariation === variation
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                      {variation}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {variation.length} chars
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Description */}
        {selectedVariation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Selected Description</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 text-sm transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy HTML
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
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-gray-800 dark:text-gray-200 mb-2">{selectedVariation}</p>
              
              <div className="mt-3 space-y-2">
                {validation && (
                  <div className={`text-sm flex items-center gap-2 ${
                    validation.valid
                      ? 'text-green-600 dark:text-green-400'
                      : validation.length < 120
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {validation.valid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>{validation.length} characters - {validation.message}</span>
                  </div>
                )}
                
                {readabilityScore !== null && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Readability Score:</span> {readabilityScore}/100
                    <span className="ml-2 text-xs">
                      ({readabilityScore >= 60 ? 'Easy to read' : readabilityScore >= 30 ? 'Moderate' : 'Difficult'})
                    </span>
                  </div>
                )}
                
                {sentiment && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Sentiment:</span> 
                    <span className={`ml-2 ${
                      sentiment.sentiment === 'positive' ? 'text-green-600 dark:text-green-400' :
                      sentiment.sentiment === 'negative' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1)} ({sentiment.score > 0 ? '+' : ''}{sentiment.score})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">HTML Code:</p>
              <code className="text-sm text-gray-800 dark:text-gray-200">
                {`<meta name="description" content="${selectedVariation.replace(/"/g, '&quot;')}">`}
              </code>
            </div>
          </div>
        )}

        {/* Best Practices */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Best Practices</h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Keep descriptions between 150-160 characters for optimal display</li>
            <li>Include your primary keyword naturally</li>
            <li>Write compelling copy that encourages clicks</li>
            <li>Include a call-to-action when appropriate</li>
            <li>Make each description unique for every page</li>
          </ul>
        </div>
      </div>
    </ToolPage>
  )
}

