import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { FileText, Code } from 'lucide-react'
import toast from 'react-hot-toast'
import { computeLineDiff, formatUnifiedDiff, formatHTMLDiff, type DiffLine } from '../../utils/dev/diffUtils'
import { downloadFile } from '../../utils/dev/fileHandler'

export default function DiffViewer() {
  const [oldText, setOldText] = useState('')
  const [newText, setNewText] = useState('')
  const [diff, setDiff] = useState<DiffLine[]>([])
  const [diffMode, setDiffMode] = useState<'line' | 'word' | 'char'>('line')
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  const calculateDiff = () => {
    if (!oldText && !newText) {
      toast.error('Please enter text in both fields')
      return
    }
    const diffResult = computeLineDiff(oldText, newText)
    setDiff(diffResult)
    toast.success('Diff calculated!')
  }

  const handleExportUnified = () => {
    const unified = formatUnifiedDiff(oldText, newText, 'old.txt', 'new.txt')
    downloadFile(unified, 'diff.patch', 'text/plain')
    toast.success('Unified diff exported!')
  }

  const handleExportHTML = () => {
    const html = formatHTMLDiff(oldText, newText)
    downloadFile(html, 'diff.html', 'text/html')
    toast.success('HTML diff exported!')
  }

  const getLineClass = (type: 'added' | 'removed' | 'unchanged') => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500'
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500'
      default:
        return 'bg-gray-50 dark:bg-gray-900'
    }
  }

  const getLinePrefix = (type: 'added' | 'removed' | 'unchanged') => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      default:
        return ' '
    }
  }

  return (
    <ToolPage
      title="Diff Viewer"
      description="Compare two blocks of text or code to identify changes."
      keywords="diff viewer, text comparison, code diff, change detection"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Text Comparison</h2>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Mode:</label>
            <select
              value={diffMode}
              onChange={(e) => {
                setDiffMode(e.target.value as 'line' | 'word' | 'char')
                setDiff([])
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="line">Line</option>
              <option value="word">Word</option>
              <option value="char">Character</option>
            </select>
            <label className="text-sm text-gray-700 dark:text-gray-300">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'side-by-side' | 'unified')}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="side-by-side">Side-by-Side</option>
              <option value="unified">Unified</option>
            </select>
          </div>
        </div>

        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Text
              </label>
              <textarea
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                placeholder="Enter original text..."
                className="w-full h-64 sm:h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Text
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter new text..."
                className="w-full h-64 sm:h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Original Text
              </label>
              <textarea
                value={oldText}
                onChange={(e) => setOldText(e.target.value)}
                placeholder="Enter original text..."
                className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Text
              </label>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter new text..."
                className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
        )}

        <button
          onClick={calculateDiff}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Calculate Diff
        </button>

        {diff.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Diff Result</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportUnified}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Unified</span>
                </button>
                <button
                  onClick={handleExportHTML}
                  className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                >
                  <Code className="h-4 w-4" />
                  <span>Export HTML</span>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Added</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Removed</span>
              </div>
            </div>
            {viewMode === 'unified' ? (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden w-full">
                <div className="max-h-64 sm:max-h-96 overflow-y-auto overflow-x-auto">
                  <pre className="font-mono text-sm p-4">
                    {formatUnifiedDiff(oldText, newText)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden w-full">
                <div className="max-h-64 sm:max-h-96 overflow-y-auto overflow-x-auto">
                  {diff.map((line, index) => (
                    <div
                      key={index}
                      className={`px-4 py-1 flex items-start ${getLineClass(line.type)}`}
                    >
                      <div className="flex items-center space-x-2 min-w-[80px]">
                        <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">
                          {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs font-mono">
                          {line.newLineNumber !== undefined ? line.newLineNumber : ''}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 mr-2">
                          {getLinePrefix(line.type)}
                        </span>
                      </div>
                      <span className="flex-1 text-gray-900 dark:text-white">
                        {line.text || '\u00A0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}

