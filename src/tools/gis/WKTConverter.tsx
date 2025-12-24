import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, ArrowLeftRight } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'

function wktToGeoJSON(wkt: string): any {
  try {
    // Simple WKT to GeoJSON converter (handles basic geometries)
    const trimmed = wkt.trim()
    
    if (trimmed.startsWith('POINT')) {
      const coords = trimmed.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
      if (coords) {
        return {
          type: 'Point',
          coordinates: [parseFloat(coords[2]), parseFloat(coords[1])],
        }
      }
    }
    
    if (trimmed.startsWith('LINESTRING')) {
      const coords = trimmed.match(/LINESTRING\s*\((.*?)\)/i)
      if (coords) {
        const points = coords[1].split(',').map(p => {
          const [x, y] = p.trim().split(/\s+/)
          return [parseFloat(y), parseFloat(x)]
        })
        return {
          type: 'LineString',
          coordinates: points,
        }
      }
    }
    
    if (trimmed.startsWith('POLYGON')) {
      const coords = trimmed.match(/POLYGON\s*\((.*?)\)/i)
      if (coords) {
        const rings = coords[1].split(/\),\s*\(/).map(ring => {
          const cleanRing = ring.replace(/[()]/g, '')
          const points = cleanRing.split(',').map(p => {
            const [x, y] = p.trim().split(/\s+/)
            return [parseFloat(y), parseFloat(x)]
          })
          return points
        })
        return {
          type: 'Polygon',
          coordinates: rings,
        }
      }
    }
    
    throw new Error('Unsupported WKT geometry type')
  } catch (error) {
    throw new Error('Invalid WKT format')
  }
}

function geoJSONToWKT(geojson: any): string {
  try {
    if (geojson.type === 'Point') {
      const [lon, lat] = geojson.coordinates
      return `POINT(${lon} ${lat})`
    }
    
    if (geojson.type === 'LineString') {
      const coords = geojson.coordinates.map(([lon, lat]: [number, number]) => `${lon} ${lat}`).join(', ')
      return `LINESTRING(${coords})`
    }
    
    if (geojson.type === 'Polygon') {
      const rings = geojson.coordinates.map((ring: number[][]) => {
        const coords = ring.map(([lon, lat]) => `${lon} ${lat}`).join(', ')
        return `(${coords})`
      }).join(', ')
      return `POLYGON(${rings})`
    }
    
    throw new Error('Unsupported GeoJSON geometry type')
  } catch (error) {
    throw new Error('Invalid GeoJSON format')
  }
}

export default function WKTConverter() {
  const [wktInput, setWktInput] = useState('')
  const [geojsonInput, setGeojsonInput] = useState('')
  const [conversionMode, setConversionMode] = useState<'wkt-to-geojson' | 'geojson-to-wkt'>('wkt-to-geojson')
  const [error, setError] = useState('')

  const convertWKTToGeoJSON = () => {
    setError('')
    try {
      const geojson = wktToGeoJSON(wktInput)
      setGeojsonInput(JSON.stringify(geojson, null, 2))
      toast.success('Converted to GeoJSON!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      toast.error('Conversion failed')
    }
  }

  const convertGeoJSONToWKT = () => {
    setError('')
    try {
      const geojson = JSON.parse(geojsonInput)
      const wkt = geoJSONToWKT(geojson)
      setWktInput(wkt)
      toast.success('Converted to WKT!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed')
      toast.error('Conversion failed')
    }
  }

  const handleConvert = () => {
    if (conversionMode === 'wkt-to-geojson') {
      convertWKTToGeoJSON()
    } else {
      convertGeoJSONToWKT()
    }
  }

  return (
    <ToolPage
      title="WKT ↔ GeoJSON Converter"
      description="Seamlessly convert between Well-Known Text and GeoJSON formats."
      keywords="WKT, GeoJSON, converter, well-known text, geospatial format"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Format Conversion</h2>
          <button
            onClick={() => {
              setConversionMode(conversionMode === 'wkt-to-geojson' ? 'geojson-to-wkt' : 'wkt-to-geojson')
              setWktInput('')
              setGeojsonInput('')
              setError('')
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Switch Mode</span>
          </button>
        </div>

        {conversionMode === 'wkt-to-geojson' ? (
          <div className="space-y-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WKT Input
              </label>
              <textarea
                value={wktInput}
                onChange={(e) => setWktInput(e.target.value)}
                placeholder='POINT(13.4050 52.5200)'
                className="w-full h-32 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to GeoJSON
            </button>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {geojsonInput && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    GeoJSON Output
                  </label>
                  <button
                    onClick={() => copyToClipboard(geojsonInput)}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  value={geojsonInput}
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
                GeoJSON Input
              </label>
              <textarea
                value={geojsonInput}
                onChange={(e) => setGeojsonInput(e.target.value)}
                placeholder='{"type": "Point", "coordinates": [13.4050, 52.5200]}'
                className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to WKT
            </button>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {wktInput && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    WKT Output
                  </label>
                  <button
                    onClick={() => copyToClipboard(wktInput)}
                    className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </button>
                </div>
                <textarea
                  value={wktInput}
                  readOnly
                  className="w-full h-32 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}

