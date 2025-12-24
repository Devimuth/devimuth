import { useState } from 'react'
import Papa from 'papaparse'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, ArrowLeftRight, Upload, Download } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { readFileAsText, downloadFile } from '../../utils/dev/fileHandler'
import { flattenJSON } from '../../utils/dev/jsonUtils'

export default function JSONCSVConverter() {
  const [conversionMode, setConversionMode] = useState<'json-to-csv' | 'csv-to-json'>('json-to-csv')
  const [jsonInput, setJsonInput] = useState('')
  const [csvInput, setCsvInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',')
  const [flattenNested, setFlattenNested] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])

  const convertJSONToCSV = () => {
    setError('')
    try {
      const data = JSON.parse(jsonInput)
      if (!Array.isArray(data)) {
        throw new Error('JSON must be an array of objects')
      }
      if (data.length === 0) {
        throw new Error('Array cannot be empty')
      }

      // Flatten nested objects if enabled
      let processedData = data
      if (flattenNested) {
        processedData = data.map((item) => flattenJSON(item))
      }

      const csv = Papa.unparse(processedData, {
        delimiter: delimiter,
        quotes: true,
        escapeChar: '"',
      })
      setOutput(csv)
      setPreviewData(processedData.slice(0, 10)) // Preview first 10 rows
      toast.success('Converted to CSV!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const convertCSVToJSON = () => {
    setError('')
    try {
      const result = Papa.parse(csvInput, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimiter,
      })
      if (result.errors.length > 0) {
        throw new Error(result.errors[0].message)
      }
      const jsonData = JSON.stringify(result.data, null, 2)
      setOutput(jsonData)
      setPreviewData(result.data.slice(0, 10)) // Preview first 10 rows
      toast.success('Converted to JSON!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleFileUpload = async (file: File, type: 'json' | 'csv') => {
    try {
      const content = await readFileAsText(file)
      if (type === 'json') {
        setJsonInput(content)
      } else {
        setCsvInput(content)
      }
      toast.success('File loaded!')
    } catch (error) {
      toast.error('Failed to read file')
      console.error(error)
    }
  }

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    downloadFile(content, filename, mimeType)
    toast.success('File downloaded!')
  }

  const handleConvert = () => {
    if (conversionMode === 'json-to-csv') {
      convertJSONToCSV()
    } else {
      convertCSVToJSON()
    }
  }

  return (
    <ToolPage
      title="JSON ↔ CSV Converter"
      description="Quickly swap between data formats for spreadsheets or APIs."
      keywords="JSON converter, CSV converter, data format, spreadsheet converter"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Format Conversion</h2>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                Upload {conversionMode === 'json-to-csv' ? 'JSON' : 'CSV'}
              </span>
              <input
                type="file"
                accept={conversionMode === 'json-to-csv' ? '.json,application/json' : '.csv,text/csv'}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileUpload(file, conversionMode === 'json-to-csv' ? 'json' : 'csv')
                  }
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={() => {
                setConversionMode(conversionMode === 'json-to-csv' ? 'csv-to-json' : 'json-to-csv')
                setOutput('')
                setError('')
                setPreviewData([])
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch Mode</span>
            </button>
          </div>
        </div>

        {conversionMode === 'json-to-csv' && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={flattenNested}
                onChange={(e) => setFlattenNested(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Flatten nested objects</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as ',' | ';' | '\t')}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
            </div>
          </div>
        )}

        {conversionMode === 'csv-to-json' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Delimiter:</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value as ',' | ';' | '\t')}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
            </div>
          </div>
        )}

        {conversionMode === 'json-to-csv' ? (
          <div className="space-y-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                JSON Input
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]'
                className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to CSV
            </button>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {previewData.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview (first {previewData.length} rows)
                </label>
                <div className="overflow-x-auto border-2 border-gray-300 dark:border-gray-600 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          {Object.values(row).map((cell: any, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 text-gray-900 dark:text-white">
                              {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CSV Output
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(output, 'converted.csv', 'text/csv')}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(output)}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CSV Input
              </label>
              <textarea
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder='name,age\nJohn,30\nJane,25'
                className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to JSON
            </button>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {previewData.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview (first {previewData.length} rows)
                </label>
                <div className="overflow-x-auto border-2 border-gray-300 dark:border-gray-600 rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        {Object.keys(previewData[0] || {}).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          {Object.values(row).map((cell: any, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-2 text-gray-900 dark:text-white">
                              {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {output && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    JSON Output
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(output, 'converted.json', 'application/json')}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(output)}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={output}
                  readOnly
                  className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}

