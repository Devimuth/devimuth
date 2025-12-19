import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Key, Edit2, Check, X, AlertTriangle } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  try {
    return atob(base64)
  } catch (e) {
    throw new Error('Invalid base64url encoding')
  }
}

function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function decodeJWT(token: string): { header: any; payload: any; signature: string } | null {
  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    const signature = parts[2]

    return { header, payload, signature }
  } catch (error) {
    return null
  }
}

function encodeJWT(header: any, payload: any, signature: string = ''): string {
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp || timestamp <= 0) return 'N/A'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

function isExpired(exp: number | undefined): boolean {
  if (!exp) return false
  return Date.now() / 1000 > exp
}

function isExpiringSoon(exp: number | undefined, hours: number = 24): boolean {
  if (!exp) return false
  const expirationTime = exp * 1000
  const hoursUntilExpiration = (expirationTime - Date.now()) / (1000 * 60 * 60)
  return hoursUntilExpiration > 0 && hoursUntilExpiration <= hours
}

function getExpirationStatus(exp: number | undefined): { status: 'valid' | 'expired' | 'expiring-soon'; message: string } {
  if (!exp) {
    return { status: 'valid', message: 'No expiration date' }
  }
  if (isExpired(exp)) {
    return { status: 'expired', message: 'Token has expired' }
  }
  if (isExpiringSoon(exp)) {
    return { status: 'expiring-soon', message: 'Token expires soon' }
  }
  return { status: 'valid', message: 'Token is valid' }
}

export default function JWTDecoder() {
  const [jwtInput, setJwtInput] = useState('')
  const [decoded, setDecoded] = useState<{ header: any; payload: any; signature: string } | null>(null)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedHeader, setEditedHeader] = useState('')
  const [editedPayload, setEditedPayload] = useState('')

  const handleDecode = () => {
    setError('')
    setDecoded(null)
    setIsEditing(false)

    if (!jwtInput.trim()) {
      setError('Please enter a JWT token')
      return
    }

    const result = decodeJWT(jwtInput.trim())
    if (result) {
      setDecoded(result)
      setEditedHeader(JSON.stringify(result.header, null, 2))
      setEditedPayload(JSON.stringify(result.payload, null, 2))
      toast.success('JWT decoded successfully!')
    } else {
      setError('Invalid JWT format')
      toast.error('Invalid JWT format')
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    try {
      const header = JSON.parse(editedHeader)
      const payload = JSON.parse(editedPayload)
      const newToken = encodeJWT(header, payload, decoded?.signature || '')
      setJwtInput(newToken)
      setDecoded({ header, payload, signature: decoded?.signature || '' })
      setIsEditing(false)
      toast.success('JWT updated!')
    } catch (error) {
      toast.error('Invalid JSON in header or payload')
    }
  }

  const handleCancelEdit = () => {
    if (decoded) {
      setEditedHeader(JSON.stringify(decoded.header, null, 2))
      setEditedPayload(JSON.stringify(decoded.payload, null, 2))
    }
    setIsEditing(false)
  }

  return (
    <ToolPage
      title="JWT Decoder"
      description="Inspect JSON Web Tokens (JWT) locally and securely."
      keywords="JWT decoder, JSON web token, token decoder, JWT inspector"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JWT Token
          </label>
          <textarea
            value={jwtInput}
            onChange={(e) => setJwtInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full h-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handleDecode}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Key className="h-4 w-4" />
          <span>Decode JWT</span>
        </button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {decoded && (
          <div className="space-y-4">
            {/* Token Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Token Information</h3>
                <div className="flex items-center space-x-2">
                  {decoded.header.alg && (
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                      Algorithm: {decoded.header.alg}
                    </span>
                  )}
                  {getExpirationStatus(decoded.payload.exp).status === 'expired' && (
                    <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Expired</span>
                    </span>
                  )}
                  {getExpirationStatus(decoded.payload.exp).status === 'expiring-soon' && (
                    <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Expiring Soon</span>
                    </span>
                  )}
                </div>
              </div>
              {decoded.payload.exp && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                    <span className={`font-mono ${
                      isExpired(decoded.payload.exp)
                        ? 'text-red-600 dark:text-red-400'
                        : isExpiringSoon(decoded.payload.exp)
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatTimestamp(decoded.payload.exp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={
                      getExpirationStatus(decoded.payload.exp).status === 'expired'
                        ? 'text-red-600 dark:text-red-400'
                        : getExpirationStatus(decoded.payload.exp).status === 'expiring-soon'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }>
                      {getExpirationStatus(decoded.payload.exp).message}
                    </span>
                  </div>
                </div>
              )}
              {decoded.payload.iat && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Issued At:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {formatTimestamp(decoded.payload.iat)}
                  </span>
                </div>
              )}
              {decoded.payload.nbf && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Not Before:</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {formatTimestamp(decoded.payload.nbf)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Header</h3>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), 'Header copied!')}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedHeader}
                    onChange={(e) => setEditedHeader(e.target.value)}
                    className="w-full h-32 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-x-auto">
                  <code className="text-sm text-gray-900 dark:text-white">
                    {JSON.stringify(decoded.header, null, 2)}
                  </code>
                </pre>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payload</h3>
                <div className="flex items-center space-x-2">
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), 'Payload copied!')}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedPayload}
                    onChange={(e) => setEditedPayload(e.target.value)}
                    className="w-full h-64 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <pre className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 overflow-x-auto">
                  <code className="text-sm text-gray-900 dark:text-white">
                    {JSON.stringify(decoded.payload, (key, value) => {
                      // Format timestamps
                      if ((key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number') {
                        return `${value} (${formatTimestamp(value)})`
                      }
                      return value
                    }, 2)}
                  </code>
                </pre>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signature</h3>
                <button
                  onClick={() => copyToClipboard(decoded.signature, 'Signature copied!')}
                  className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                <code className="text-sm text-gray-900 dark:text-white font-mono break-all">
                  {decoded.signature}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolPage>
  )
}

