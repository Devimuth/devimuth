import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON as GeoJSONLayer } from 'react-leaflet'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, CheckCircle, XCircle, Download } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { validateGeometry } from '../../utils/gis/validation'
import { exportGeoJSON, exportKML } from '../../utils/gis/export'

export default function GeoJSONVisualizer() {
  const [geojsonInput, setGeojsonInput] = useState('')
  const [geojsonData, setGeojsonData] = useState<any>(null)
  const [originalGeojsonData, setOriginalGeojsonData] = useState<any>(null) // Store original unrounded data
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [precision, setPrecision] = useState<number>(6)
  const isFormattingRef = useRef(false) // Track if we're updating programmatically

  useEffect(() => {
    if (!geojsonInput.trim()) {
      setGeojsonData(null)
      setOriginalGeojsonData(null)
      setIsValid(null)
      setError('')
      setValidationErrors([])
      return
    }

    try {
      const parsed = JSON.parse(geojsonInput)
      if (parsed.type && (parsed.type === 'FeatureCollection' || parsed.type === 'Feature' || parsed.type.startsWith('Point') || parsed.type.startsWith('Line') || parsed.type.startsWith('Polygon'))) {
        // Enhanced validation
        const validation = validateGeometry(parsed)
        if (validation.valid) {
          setGeojsonData(parsed)
          // Only update originalGeojsonData if:
          // 1. It's null (first time), OR
          // 2. We're not formatting (user manually edited), OR
          // 3. The new data appears to have more precision (not just formatted)
          if (!originalGeojsonData || !isFormattingRef.current) {
            setOriginalGeojsonData(JSON.parse(JSON.stringify(parsed))) // Deep copy to preserve original
          }
          setIsValid(true)
          setError('')
          setValidationErrors([])
        } else {
          setGeojsonData(parsed)
          if (!originalGeojsonData || !isFormattingRef.current) {
            setOriginalGeojsonData(JSON.parse(JSON.stringify(parsed))) // Deep copy even if invalid
          }
          setIsValid(false)
          setError('Geometry validation failed')
          setValidationErrors(validation.errors)
        }
      } else {
        setIsValid(false)
        setError('Invalid GeoJSON structure')
        setValidationErrors(['Missing or invalid type field'])
      }
    } catch (err) {
      setIsValid(false)
      setError(err instanceof Error ? err.message : 'Invalid JSON')
      setValidationErrors([err instanceof Error ? err.message : 'Invalid JSON'])
    }
    
    // Reset formatting flag after processing
    isFormattingRef.current = false
  }, [geojsonInput])

  // Round coordinates based on precision
  const roundCoordinates = (data: any, decimals: number): any => {
    if (!data) return data

    const round = (value: number): number => {
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
    }

    const processCoordinates = (coords: any): any => {
      if (Array.isArray(coords)) {
        if (typeof coords[0] === 'number') {
          return [round(coords[0]), round(coords[1]), ...(coords.slice(2))]
        }
        return coords.map(processCoordinates)
      }
      return coords
    }

    if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
      return {
        ...data,
        features: data.features.map((feature: any) => ({
          ...feature,
          geometry: feature.geometry ? {
            ...feature.geometry,
            coordinates: processCoordinates(feature.geometry.coordinates),
          } : feature.geometry,
        })),
      }
    } else if (data.type === 'Feature' && data.geometry) {
      return {
        ...data,
        geometry: {
          ...data.geometry,
          coordinates: processCoordinates(data.geometry.coordinates),
        },
      }
    } else if (data.coordinates) {
      return {
        ...data,
        coordinates: processCoordinates(data.coordinates),
      }
    }

    return data
  }

  const handleFormat = () => {
    // Use original data if available, otherwise parse from input
    const sourceData = originalGeojsonData || geojsonData
    
    if (!sourceData) {
      if (!geojsonInput.trim()) {
        toast.error('No GeoJSON to format')
        return
      }
      try {
        const parsed = JSON.parse(geojsonInput)
        const rounded = roundCoordinates(parsed, precision)
        isFormattingRef.current = true // Mark as programmatic update
        setGeojsonInput(JSON.stringify(rounded, null, 2))
        toast.success('GeoJSON formatted!')
      } catch (err) {
        toast.error('Failed to format GeoJSON')
        console.error(err)
      }
      return
    }

    try {
      // Use original unrounded data to preserve precision
      const rounded = roundCoordinates(JSON.parse(JSON.stringify(sourceData)), precision)
      isFormattingRef.current = true // Mark as programmatic update
      setGeojsonInput(JSON.stringify(rounded, null, 2))
      toast.success('GeoJSON formatted!')
    } catch (err) {
      toast.error('Failed to format GeoJSON')
      console.error(err)
    }
  }

  const handleExportGeoJSON = () => {
    const sourceData = originalGeojsonData || geojsonData
    if (sourceData && isValid) {
      try {
        const rounded = roundCoordinates(JSON.parse(JSON.stringify(sourceData)), precision)
        exportGeoJSON(rounded, 'geojson-export')
        toast.success('Exported as GeoJSON!')
      } catch (error) {
        toast.error('Export failed')
        console.error(error)
      }
    } else {
      toast.error('No valid GeoJSON to export')
    }
  }

  const handleExportKML = () => {
    const sourceData = originalGeojsonData || geojsonData
    if (sourceData && isValid) {
      try {
        const rounded = roundCoordinates(JSON.parse(JSON.stringify(sourceData)), precision)
        exportKML(rounded, 'kml-export')
        toast.success('Exported as KML!')
      } catch (error) {
        toast.error('Export failed')
        console.error(error)
      }
    } else {
      toast.error('No valid GeoJSON to export')
    }
  }

  return (
    <ToolPage
      title="GeoJSON Visualizer"
      description="Paste and validate GeoJSON to render it instantly on a map."
      keywords="GeoJSON, map visualizer, geospatial data, JSON map"
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                GeoJSON Input
              </label>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {isValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                {isValid === false && <XCircle className="h-5 w-5 text-red-500" />}
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Precision:</label>
                  <select
                    value={precision}
                    onChange={(e) => setPrecision(parseInt(e.target.value))}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="0">0</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                  </select>
                </div>
                {isValid === true && (
                  <button
                    onClick={handleFormat}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap"
                  >
                    Format
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={geojsonInput}
              onChange={(e) => setGeojsonInput(e.target.value)}
              placeholder='{"type": "FeatureCollection", "features": [...]}'
              className="w-full h-64 sm:h-96 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary-500 resize-none"
            />
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">{error}</p>
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-1">
                    {validationErrors.map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {isValid && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const sourceData = originalGeojsonData || geojsonData
                    if (sourceData) {
                      const rounded = roundCoordinates(JSON.parse(JSON.stringify(sourceData)), precision)
                      copyToClipboard(JSON.stringify(rounded, null, 2))
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy GeoJSON</span>
                </button>
                <button
                  onClick={handleExportGeoJSON}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  title="Export as GeoJSON file"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">GeoJSON</span>
                </button>
                <button
                  onClick={handleExportKML}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  title="Export as KML file"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">KML</span>
                </button>
              </div>
            )}
          </div>
          <div className="space-y-4 min-w-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Map Preview
            </label>
            <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-full h-64 sm:h-96">
              {geojsonData ? (
                <MapContainer
                  center={[0, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <GeoJSONLayer 
                    data={geojsonData} 
                    eventHandlers={{
                      add: (e) => {
                        const layer = e.target
                        try {
                          const bounds = layer.getBounds()
                          if (bounds && bounds.isValid()) {
                            const map = layer._map
                            if (map) {
                              map.fitBounds(bounds, { padding: [50, 50] })
                            }
                          }
                        } catch (error) {
                          console.error('Error fitting bounds:', error)
                        }
                      }
                    }}
                  />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Enter valid GeoJSON to see map preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolPage>
  )
}

