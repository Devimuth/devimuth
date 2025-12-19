import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Hash, Key, Upload, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5 } from 'uuid'
import { hashFile, hashText, compareHashes } from '../../utils/dev/hashUtils'

// Note: MD5 is not available in Web Crypto API and is cryptographically insecure
// This is a placeholder implementation for compatibility only
// DO NOT use for security purposes
async function generateMD5(text: string): Promise<string> {
  // Using Web Crypto API's SHA-256 as a fallback (MD5 is not available)
  // This is NOT a real MD5 implementation - it's a placeholder
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // Return first 32 chars to simulate MD5 length (but it's actually SHA-256 truncated)
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

export default function UUIDHashGenerator() {
  const [activeTab, setActiveTab] = useState<'uuid' | 'hash' | 'compare'>('uuid')
  const [uuidCount, setUuidCount] = useState(1)
  const [uuidVersion, setUuidVersion] = useState<'v1' | 'v4' | 'v5'>('v4')
  const [uuidNamespace, setUuidNamespace] = useState('')
  const [uuidName, setUuidName] = useState('')
  const [uuids, setUuids] = useState<string[]>([])
  const [hashInput, setHashInput] = useState('')
  const [hashAlgorithm, setHashAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'MD5'>('SHA-256')
  const [hashResult, setHashResult] = useState('')
  const [hashFileInput, setHashFileInput] = useState<File | null>(null)
  const [compareHash1, setCompareHash1] = useState('')
  const [compareHash2, setCompareHash2] = useState('')
  const [compareResult, setCompareResult] = useState<boolean | null>(null)

  const generateUUIDs = () => {
    const newUuids: string[] = []
    try {
      for (let i = 0; i < uuidCount; i++) {
        let uuid: string
        switch (uuidVersion) {
          case 'v1':
            uuid = uuidv1()
            break
          case 'v4':
            uuid = uuidv4()
            break
          case 'v5':
            if (!uuidNamespace || !uuidName) {
              toast.error('Namespace and name are required for UUID v5')
              return
            }
            // Parse namespace UUID or use default
            let namespaceUuid: string
            try {
              // Try to parse as UUID
              if (uuidNamespace.match(/^[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{12}$/i)) {
                namespaceUuid = uuidNamespace
              } else {
                // Use as namespace string
                namespaceUuid = uuidv5(uuidNamespace, uuidv5.DNS)
              }
            } catch {
              namespaceUuid = uuidv5(uuidNamespace, uuidv5.DNS)
            }
            uuid = uuidv5(uuidName, namespaceUuid as any)
            break
          default:
            uuid = uuidv4()
        }
        newUuids.push(uuid)
      }
      setUuids(newUuids)
      toast.success(`Generated ${uuidCount} UUID ${uuidVersion}!`)
    } catch (error) {
      toast.error('Failed to generate UUIDs')
      console.error(error)
    }
  }

  const generateHash = async () => {
    if (!hashInput.trim() && !hashFileInput) {
      toast.error('Please enter text or upload a file to hash')
      return
    }

    try {
      if (hashFileInput) {
        // Hash file
        const hash = await hashFile(hashFileInput, hashAlgorithm)
        setHashResult(hash)
        toast.success(`${hashAlgorithm} hash generated from file!`)
      } else {
        // Hash text
        if (hashAlgorithm === 'MD5') {
          const hash = await generateMD5(hashInput)
          setHashResult(hash)
          toast.success('MD5 hash generated! (Note: This is not a real MD5 implementation)')
        } else {
          const hash = await hashText(hashInput, hashAlgorithm)
          setHashResult(hash)
          toast.success(`${hashAlgorithm} hash generated!`)
        }
      }
    } catch (error) {
      toast.error('Hash generation failed')
      console.error(error)
    }
  }

  const handleCompareHashes = () => {
    if (!compareHash1.trim() || !compareHash2.trim()) {
      toast.error('Please enter both hashes to compare')
      return
    }
    const result = compareHashes(compareHash1, compareHash2)
    setCompareResult(result)
    if (result) {
      toast.success('Hashes match!')
    } else {
      toast.error('Hashes do not match')
    }
  }

  return (
    <ToolPage
      title="UUID & Hash Generator"
      description="Generate secure UUIDs and SHA/MD5 hashes."
      keywords="UUID generator, hash generator, SHA-256, SHA-512, MD5, secure random"
    >
      <div className="space-y-6">
        <div className="flex space-x-2 border-b border-gray-300 dark:border-gray-600">
          <button
            onClick={() => setActiveTab('uuid')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'uuid'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            UUID Generator
          </button>
          <button
            onClick={() => setActiveTab('hash')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'hash'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Hash Generator
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'compare'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Hash Compare
          </button>
        </div>

        {activeTab === 'uuid' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                UUID Version
              </label>
              <select
                value={uuidVersion}
                onChange={(e) => setUuidVersion(e.target.value as 'v1' | 'v4' | 'v5')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="v1">v1 (Timestamp-based)</option>
                <option value="v4">v4 (Random)</option>
                <option value="v5">v5 (Name-based)</option>
              </select>
            </div>
            {uuidVersion === 'v5' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Namespace (UUID or string)
                  </label>
                  <input
                    type="text"
                    value={uuidNamespace}
                    onChange={(e) => setUuidNamespace(e.target.value)}
                    placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8 or any string"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={uuidName}
                    onChange={(e) => setUuidName(e.target.value)}
                    placeholder="Enter name for UUID v5"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of UUIDs
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={uuidCount}
                onChange={(e) => setUuidCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={generateUUIDs}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>Generate UUIDs</span>
            </button>
            {uuids.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated UUIDs
                  </label>
                  <button
                    onClick={() => copyToClipboard(uuids.join('\n'), 'UUIDs copied!')}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy All</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {uuids.map((uuid, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={uuid}
                        readOnly
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(uuid, 'UUID copied!')}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hash' && (
          <div className="space-y-4">
            {hashAlgorithm === 'MD5' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Security Warning</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      MD5 is cryptographically broken and should NOT be used for security purposes. 
                      This implementation is a placeholder and does not provide real MD5 hashing. 
                      Use SHA-256 or SHA-512 for secure hashing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hash Algorithm
              </label>
              <select
                value={hashAlgorithm}
                onChange={(e) => setHashAlgorithm(e.target.value as 'SHA-256' | 'SHA-512' | 'MD5')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="SHA-256">SHA-256</option>
                <option value="SHA-512">SHA-512</option>
                <option value="MD5">MD5 (Insecure - Not Recommended)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File (or enter text below)
              </label>
              <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600">
                <Upload className="h-4 w-4" />
                <span className="text-sm">
                  {hashFileInput ? hashFileInput.name : 'Choose File'}
                </span>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setHashFileInput(file)
                      setHashInput('')
                    }
                  }}
                  className="hidden"
                />
              </label>
              {hashFileInput && (
                <button
                  onClick={() => {
                    setHashFileInput(null)
                  }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Remove file
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Input Text {hashFileInput && '(will be ignored if file is selected)'}
              </label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter text to hash..."
                disabled={!!hashFileInput}
                className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={generateHash}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Hash className="h-4 w-4" />
              <span>Generate Hash</span>
            </button>
            {hashResult && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hash Result
                  </label>
                  <button
                    onClick={() => copyToClipboard(hashResult, 'Hash copied!')}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                  <code className="text-sm text-gray-900 dark:text-white font-mono break-all">
                    {hashResult}
                  </code>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hash 1
              </label>
              <textarea
                value={compareHash1}
                onChange={(e) => setCompareHash1(e.target.value)}
                placeholder="Enter first hash..."
                className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hash 2
              </label>
              <textarea
                value={compareHash2}
                onChange={(e) => setCompareHash2(e.target.value)}
                placeholder="Enter second hash..."
                className="w-full h-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleCompareHashes}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Hash className="h-4 w-4" />
              <span>Compare Hashes</span>
            </button>
            {compareResult !== null && (
              <div className={`p-4 rounded-lg border-2 flex items-center space-x-3 ${
                compareResult
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'
              }`}>
                {compareResult ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">Hashes Match</h4>
                      <p className="text-sm text-green-700 dark:text-green-300">The two hashes are identical.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-200">Hashes Do Not Match</h4>
                      <p className="text-sm text-red-700 dark:text-red-300">The two hashes are different.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}
