import { useState, useEffect } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { generateSchemaMarkup, validateSchema, schemaFields, type SchemaType } from '../../utils/marketing/schemaTemplates'

export default function SchemaMarkupGenerator() {
  const [schemaType, setSchemaType] = useState<SchemaType>('Article')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [generatedJSON, setGeneratedJSON] = useState('')
  const [validation, setValidation] = useState<{ valid: boolean; error?: string; warnings?: string[] } | null>(null)

  useEffect(() => {
    // Reset form data when schema type changes
    setFormData({})
    setGeneratedJSON('')
    setValidation(null)
  }, [schemaType])

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      try {
        const json = generateSchemaMarkup(schemaType, formData)
        setGeneratedJSON(json)
        const validationResult = validateSchema(json)
        setValidation(validationResult)
      } catch (error) {
        setGeneratedJSON('')
        setValidation({ valid: false, error: error instanceof Error ? error.message : 'Generation failed' })
      }
    } else {
      setGeneratedJSON('')
      setValidation(null)
    }
  }, [formData, schemaType])

  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleCopy = () => {
    if (generatedJSON) {
      const scriptTag = `<script type="application/ld+json">\n${generatedJSON}\n</script>`
      copyToClipboard(scriptTag, 'Schema markup copied to clipboard!')
    } else {
      toast.error('No schema markup to copy')
    }
  }

  const handleDownload = () => {
    if (!generatedJSON) {
      toast.error('No schema markup to download')
      return
    }

    const blob = new Blob([generatedJSON], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `schema-${schemaType.toLowerCase()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Schema markup downloaded!')
  }

  const currentFields = schemaFields[schemaType]

  return (
    <ToolPage
      title="Schema Markup Generator"
      description="Create JSON-LD structured data for articles, products, organizations, and more."
      keywords="schema markup, JSON-LD, structured data, schema.org, SEO"
    >
      <div className="space-y-6">
        {/* Schema Type Selector */}
        <div className="!m-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Schema Type
          </label>
          <select
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value as SchemaType)}
            className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
          >
            <option value="Article">Article</option>
            <option value="Organization">Organization</option>
            <option value="Product">Product</option>
            <option value="LocalBusiness">Local Business</option>
            <option value="FAQ">FAQ</option>
            <option value="BreadcrumbList">Breadcrumb List</option>
            <option value="Event">Event</option>
            <option value="Review">Review</option>
            <option value="VideoObject">Video Object</option>
            <option value="Recipe">Recipe</option>
            <option value="HowTo">How-To</option>
            <option value="Course">Course</option>
            <option value="SoftwareApplication">Software Application</option>
          </select>
        </div>

        {/* Dynamic Form Fields */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Schema Properties</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFields.map((field) => (
              <div key={field.key} className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || field.label}
                    rows={field.key.includes('questions') || field.key.includes('answers') || field.key.includes('items') ? 5 : 3}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                    value={formData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder || field.label}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 focus:ring-purple-500"
                  />
                )}
                {field.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.help}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generated JSON */}
        {generatedJSON && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Generated JSON-LD</h2>
              <div className="flex items-center gap-4">
                {validation && (
                  <div className="flex flex-col gap-1">
                    <div className={`flex items-center gap-1 text-sm ${
                      validation.valid
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {validation.valid ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>{validation.valid ? 'Valid' : validation.error}</span>
                    </div>
                    {validation.warnings && validation.warnings.length > 0 && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400">
                        {validation.warnings.map((warning, idx) => (
                          <div key={idx}>⚠ {warning}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
            </div>
            <pre className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto text-sm max-h-96 overflow-y-auto">
              <code className="text-gray-800 dark:text-gray-200">{generatedJSON}</code>
            </pre>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Usage:</strong> Add this JSON-LD script tag to your HTML <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">&lt;head&gt;</code> section:
              </p>
              <pre className="mt-2 text-xs text-blue-900 dark:text-blue-100 overflow-x-auto max-w-full whitespace-pre-wrap break-words">
                {`<script type="application/ld+json">\n${generatedJSON}\n</script>`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

