import { useState, useEffect, useRef } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Minus, Maximize2, FileText, Eye } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { validateJSON } from '../../utils/dev/jsonUtils'

export default function JSONFormatter() {
  const [jsonInput, setJsonInput] = useState('')
  const [formatted, setFormatted] = useState('')
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'text' | 'tree'>('text')
  const [errorLine, setErrorLine] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // Real-time validation
  useEffect(() => {
    if (!jsonInput.trim()) {
      setValidationError(null)
      setErrorLine(null)
      return
    }

    const validation = validateJSON(jsonInput)
    if (validation.valid) {
      setValidationError(null)
      setErrorLine(null)
    } else {
      setValidationError(validation.error || 'Invalid JSON')
      // Extract line number from error message
      const lineMatch = validation.error?.match(/line (\d+)/)
      if (lineMatch) {
        setErrorLine(parseInt(lineMatch[1]))
      }
    }
  }, [jsonInput])

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const formatJSON = () => {
    setError('')
    const validation = validateJSON(jsonInput)
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON')
      toast.error('Invalid JSON')
      return
    }

    try {
      const formatted = JSON.stringify(validation.data, null, 2)
      setFormatted(formatted)
      toast.success('JSON formatted!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid JSON'
      setError(errorMsg)
      toast.error('Invalid JSON')
    }
  }

  const minifyJSON = () => {
    setError('')
    const validation = validateJSON(jsonInput)
    if (!validation.valid) {
      setError(validation.error || 'Invalid JSON')
      toast.error('Invalid JSON')
      return
    }

    try {
      const minified = JSON.stringify(validation.data)
      setFormatted(minified)
      toast.success('JSON minified!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid JSON'
      setError(errorMsg)
      toast.error('Invalid JSON')
    }
  }

  // Render JSON as tree view
  const renderTreeView = (obj: any, depth: number = 0): JSX.Element => {
    if (obj === null) {
      return <span className="text-purple-600 dark:text-purple-400">null</span>
    }
    if (obj === undefined) {
      return <span className="text-gray-500 dark:text-gray-400">undefined</span>
    }
    if (typeof obj === 'string') {
      return <span className="text-green-600 dark:text-green-400">"{obj}"</span>
    }
    if (typeof obj === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{obj}</span>
    }
    if (typeof obj === 'boolean') {
      return <span className="text-orange-600 dark:text-orange-400">{obj.toString()}</span>
    }

    if (Array.isArray(obj)) {
      return (
        <div className="ml-4">
          <span className="text-gray-600 dark:text-gray-400">[</span>
          {obj.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-gray-500 dark:text-gray-500">{index}:</span> {renderTreeView(item, depth + 1)}
              {index < obj.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </div>
          ))}
          <span className="text-gray-600 dark:text-gray-400">]</span>
        </div>
      )
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj)
      return (
        <div className="ml-4">
          <span className="text-gray-600 dark:text-gray-400">{'{'}</span>
          {keys.map((key, index) => (
            <div key={key} className="ml-4">
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              <span className="text-gray-600 dark:text-gray-400">: </span>
              {renderTreeView(obj[key], depth + 1)}
              {index < keys.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
            </div>
          ))}
          <span className="text-gray-600 dark:text-gray-400">{'}'}</span>
        </div>
      )
    }

    return <span>{String(obj)}</span>
  }

  // Get line numbers for textarea
  const getLineNumbers = (): string => {
    const lines = jsonInput.split('\n')
    return lines.map((_, i) => i + 1).join('\n')
  }

  const parsedData = (() => {
    try {
      return JSON.parse(jsonInput)
    } catch {
      return null
    }
  })()

  return (
    <ToolPage
      title="JSON Formatter/Minifier"
      description="Prettify messy JSON strings for better readability."
      keywords="JSON formatter, JSON minifier, JSON prettifier, JSON beautifier"
    >
      <div className="space-y-6">
        <div className="!m-1">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              JSON Input
            </label>
            <div className="flex items-center space-x-2">
              {validationError ? (
                <span className="text-xs text-red-600 dark:text-red-400">Invalid JSON</span>
              ) : jsonInput.trim() ? (
                <span className="text-xs text-green-600 dark:text-green-400">Valid JSON</span>
              ) : null}
            </div>
          </div>
          <div className="relative border-2 border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            {/* Line numbers */}
            <div
              ref={lineNumbersRef}
              className="absolute left-0 top-0 bottom-0 w-12 bg-gray-100 dark:bg-gray-800 text-right pr-2 pt-4 text-xs text-gray-500 dark:text-gray-400 font-mono overflow-hidden pointer-events-none select-none"
              style={{ lineHeight: '1.5rem' }}
            >
              <pre>{getLineNumbers()}</pre>
            </div>
            {/* Textarea with line numbers offset */}
            <textarea
              ref={textareaRef}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onScroll={handleScroll}
              placeholder='{"name":"John","age":30,"city":"New York"}'
              className="w-full h-64 pl-14 pr-4 py-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500 resize-none"
              style={{ lineHeight: '1.5rem' }}
            />
            {/* Error line highlight */}
            {errorLine && (
              <div
                className="absolute left-12 right-0 bg-red-100 dark:bg-red-900/30 pointer-events-none"
                style={{
                  top: `${(errorLine - 1) * 1.5}rem`,
                  height: '1.5rem',
                }}
              />
            )}
          </div>
          {validationError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{validationError}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={formatJSON}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Maximize2 className="h-4 w-4" />
            <span>Format (Pretty Print)</span>
          </button>
          <button
            onClick={minifyJSON}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Minus className="h-4 w-4" />
            <span>Minify</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {formatted && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Formatted Output
                </label>
                <div className="flex items-center space-x-1 border border-gray-300 dark:border-gray-600 rounded">
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-2 py-1 text-xs ${
                      viewMode === 'text'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setViewMode('tree')}
                    className={`px-2 py-1 text-xs ${
                      viewMode === 'tree'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(formatted, 'JSON copied!')}
                className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
            </div>
            {viewMode === 'text' ? (
              <textarea
                value={formatted}
                readOnly
                className="w-full h-96 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
              />
            ) : (
              <div className="w-full h-96 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm overflow-auto">
                {parsedData ? renderTreeView(parsedData) : <span>Invalid JSON</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}

