import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, ArrowLeftRight, Upload, Download, FileText, X } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { readFileAsText, readFileAsDataURL, downloadFile, isImageFile, isTextFile } from '../../utils/dev/fileHandler'

export default function Base64URLEncoder() {
  const [encodingType, setEncodingType] = useState<'base64' | 'url'>('base64')
  const [operation, setOperation] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [batchMode, setBatchMode] = useState(false)
  const [batchInputs, setBatchInputs] = useState<string[]>([''])
  const [batchOutputs, setBatchOutputs] = useState<string[]>([])
  const [preview, setPreview] = useState<{ type: 'image' | 'text' | 'none'; content: string }>({ type: 'none', content: '' })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleEncode = () => {
    setError('')
    try {
      if (encodingType === 'base64') {
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
        toast.success('Encoded to Base64!')
      } else {
        const encoded = encodeURIComponent(input)
        setOutput(encoded)
        toast.success('URL encoded!')
      }
    } catch (err) {
      setError('Encoding failed')
      toast.error('Encoding failed')
    }
  }

  const handleDecode = () => {
    setError('')
    setPreview({ type: 'none', content: '' })
    try {
      if (encodingType === 'base64') {
        // Check if it's a data URL (image)
        if (input.startsWith('data:')) {
          setOutput(input)
          const mimeMatch = input.match(/data:([^;]+);base64,/)
          if (mimeMatch && mimeMatch[1].startsWith('image/')) {
            setPreview({ type: 'image', content: input })
          }
          toast.success('Decoded from Base64!')
        } else {
          const decoded = decodeURIComponent(escape(atob(input)))
          setOutput(decoded)
          // Check if decoded content looks like an image data URL
          if (decoded.startsWith('data:image/')) {
            setPreview({ type: 'image', content: decoded })
          } else if (decoded.length < 1000) {
            setPreview({ type: 'text', content: decoded })
          }
          toast.success('Decoded from Base64!')
        }
      } else {
        const decoded = decodeURIComponent(input)
        setOutput(decoded)
        toast.success('URL decoded!')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Decoding failed - invalid format'
      setError(errorMsg)
      toast.error('Decoding failed')
    }
  }

  const handleConvert = () => {
    if (operation === 'encode') {
      handleEncode()
    } else {
      handleDecode()
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file)
      if (encodingType === 'base64' && operation === 'encode') {
        const dataURL = await readFileAsDataURL(file)
        setInput(dataURL)
        toast.success('File loaded!')
        
        // Show preview for images
        if (isImageFile(file)) {
          setPreview({ type: 'image', content: dataURL })
        } else if (isTextFile(file)) {
          const text = await readFileAsText(file)
          setPreview({ type: 'text', content: text.substring(0, 500) + (text.length > 500 ? '...' : '') })
        } else {
          setPreview({ type: 'none', content: '' })
        }
      } else {
        const text = await readFileAsText(file)
        setInput(text)
        toast.success('File loaded!')
        setPreview({ type: 'none', content: '' })
      }
    } catch (error) {
      toast.error('Failed to read file')
      console.error(error)
    }
  }

  const handleBatchConvert = () => {
    if (batchMode) {
      const results: string[] = []
      batchInputs.forEach((inp) => {
        if (!inp.trim()) {
          results.push('')
          return
        }
        try {
          if (operation === 'encode') {
            if (encodingType === 'base64') {
              results.push(btoa(unescape(encodeURIComponent(inp))))
            } else {
              results.push(encodeURIComponent(inp))
            }
          } else {
            if (encodingType === 'base64') {
              results.push(decodeURIComponent(escape(atob(inp))))
            } else {
              results.push(decodeURIComponent(inp))
            }
          }
        } catch (err) {
          results.push(`Error: ${err instanceof Error ? err.message : 'Conversion failed'}`)
        }
      })
      setBatchOutputs(results)
      toast.success(`Processed ${results.filter(r => !r.startsWith('Error')).length} items`)
    } else {
      handleConvert()
    }
  }

  const addBatchInput = () => {
    setBatchInputs([...batchInputs, ''])
  }

  const removeBatchInput = (index: number) => {
    setBatchInputs(batchInputs.filter((_, i) => i !== index))
    setBatchOutputs(batchOutputs.filter((_, i) => i !== index))
  }

  const handleDownload = () => {
    if (!output) {
      toast.error('No output to download')
      return
    }

    if (operation === 'decode' && encodingType === 'base64' && preview.type === 'image') {
      // Download decoded image
      const byteString = atob(output.split(',')[1] || output)
      const mimeString = output.split(',')[0].match(/:(.*?);/)?.[1] || 'image/png'
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      const blob = new Blob([ab], { type: mimeString })
      downloadFile(blob, `decoded.${mimeString.split('/')[1]}`, mimeString)
    } else {
      // Download as text file
      downloadFile(output, `encoded.${encodingType === 'base64' ? 'txt' : 'txt'}`, 'text/plain')
    }
    toast.success('File downloaded!')
  }

  return (
    <ToolPage
      title="Base64 & URL Encoder"
      description="Standard encoding utilities for web development."
      keywords="base64 encoder, URL encoder, base64 decoder, URL decoder, encoding utilities"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Encoding/Decoding</h2>
          <div className="flex items-center space-x-2">
            {encodingType === 'base64' && operation === 'encode' && (
              <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Upload File</span>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="hidden"
                />
              </label>
            )}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => {
                  setBatchMode(e.target.checked)
                  setBatchInputs([''])
                  setBatchOutputs([])
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Batch Mode</span>
            </label>
            <select
              value={encodingType}
              onChange={(e) => {
                setEncodingType(e.target.value as 'base64' | 'url')
                setOutput('')
                setError('')
                setPreview({ type: 'none', content: '' })
                setUploadedFile(null)
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="base64">Base64</option>
              <option value="url">URL</option>
            </select>
            <button
              onClick={() => {
                setOperation(operation === 'encode' ? 'decode' : 'encode')
                setOutput('')
                setError('')
                setPreview({ type: 'none', content: '' })
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch</span>
            </button>
          </div>
        </div>

        {batchMode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch Inputs
              </label>
              <button
                onClick={addBatchInput}
                className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Input
              </button>
            </div>
            {batchInputs.map((inp, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 flex-1">
                    Input {index + 1}
                  </label>
                  {batchInputs.length > 1 && (
                    <button
                      onClick={() => removeBatchInput(index)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={inp}
                  onChange={(e) => {
                    const newInputs = [...batchInputs]
                    newInputs[index] = e.target.value
                    setBatchInputs(newInputs)
                  }}
                  placeholder={operation === 'encode' ? 'Enter text to encode...' : `Enter ${encodingType === 'base64' ? 'Base64' : 'URL'} encoded text...`}
                  className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
                {batchOutputs[index] && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Output {index + 1}</span>
                      <button
                        onClick={() => copyToClipboard(batchOutputs[index], 'Copied!')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs font-mono text-gray-900 dark:text-white break-all">
                      {batchOutputs[index].substring(0, 100)}
                      {batchOutputs[index].length > 100 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={handleBatchConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {operation === 'encode' ? `Encode All to ${encodingType === 'base64' ? 'Base64' : 'URL'}` : `Decode All from ${encodingType === 'base64' ? 'Base64' : 'URL'}`}
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {operation === 'encode' ? 'Input Text' : `${encodingType === 'base64' ? 'Base64' : 'URL'} Encoded Input`}
                </label>
                {uploadedFile && (
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <FileText className="h-3 w-3" />
                    <span>{uploadedFile.name}</span>
                    <button
                      onClick={() => {
                        setUploadedFile(null)
                        setInput('')
                        setPreview({ type: 'none', content: '' })
                      }}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={operation === 'encode' ? 'Enter text to encode...' : `Enter ${encodingType === 'base64' ? 'Base64' : 'URL'} encoded text...`}
                className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {operation === 'encode' ? `Encode to ${encodingType === 'base64' ? 'Base64' : 'URL'}` : `Decode from ${encodingType === 'base64' ? 'Base64' : 'URL'}`}
            </button>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {output && !batchMode && (
          <div className="space-y-4">
            {preview.type === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <img
                    src={preview.content}
                    alt="Decoded preview"
                    className="max-w-full max-h-64 mx-auto rounded"
                  />
                </div>
              </div>
            )}
            {preview.type === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview
                </label>
                <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap">
                    {preview.content}
                  </p>
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {operation === 'encode' ? `${encodingType === 'base64' ? 'Base64' : 'URL'} Encoded Output` : 'Decoded Output'}
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(output, 'Copied!')}
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
                className="w-full h-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

