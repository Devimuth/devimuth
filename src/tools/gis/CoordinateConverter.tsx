import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, ArrowLeftRight, ChevronDown } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import proj4 from '../../utils/proj4Setup'
import toast from 'react-hot-toast'
import { wktToGeoJSONExtended, geoJSONToWKTExtended } from '../../utils/gis/geometry'
import { validateDMS, validateCoordinates } from '../../utils/gis/validation'

// DMS conversion functions
function dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: 'N' | 'S' | 'E' | 'W'): number {
  let decimal = degrees + minutes / 60 + seconds / 3600
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal
  }
  return decimal
}

function decimalToDMS(decimal: number, isLatitude: boolean): { degrees: number; minutes: number; seconds: number; direction: string } {
  const abs = Math.abs(decimal)
  const degrees = Math.floor(abs)
  const minutesFloat = (abs - degrees) * 60
  const minutes = Math.floor(minutesFloat)
  const seconds = (minutesFloat - minutes) * 60

  let direction = ''
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S'
  } else {
    direction = decimal >= 0 ? 'E' : 'W'
  }

  return { degrees, minutes, seconds, direction }
}

// Auto-detect UTM zone from longitude
function getUTMZone(longitude: number): number {
  return Math.floor((longitude + 180) / 6) + 1
}

type ConverterType = 'wgs84-utm' | 'dms-decimal' | 'wkt-geojson'

export default function CoordinateConverter() {
  const [converterType, setConverterType] = useState<ConverterType>('wgs84-utm')
  const [batchMode, setBatchMode] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [batchResults, setBatchResults] = useState<any[]>([])
  
  // WGS84/UTM states
  const [inputLat, setInputLat] = useState('')
  const [inputLon, setInputLon] = useState('')
  const [utmZone, setUtmZone] = useState('33')
  const [utmNorth, setUtmNorth] = useState(true)
  const [utmEasting, setUtmEasting] = useState('')
  const [utmNorthing, setUtmNorthing] = useState('')
  const [utmMode, setUtmMode] = useState<'latlon-to-utm' | 'utm-to-latlon'>('latlon-to-utm')
  const [detectedZone, setDetectedZone] = useState<number | null>(null)
  
  // DMS/Decimal states
  const [dmsMode, setDmsMode] = useState<'dms-to-decimal' | 'decimal-to-dms'>('dms-to-decimal')
  const [latDegrees, setLatDegrees] = useState('')
  const [latMinutes, setLatMinutes] = useState('')
  const [latSeconds, setLatSeconds] = useState('')
  const [latDirection, setLatDirection] = useState<'N' | 'S'>('N')
  const [lonDegrees, setLonDegrees] = useState('')
  const [lonMinutes, setLonMinutes] = useState('')
  const [lonSeconds, setLonSeconds] = useState('')
  const [lonDirection, setLonDirection] = useState<'E' | 'W'>('E')
  const [decimalLat, setDecimalLat] = useState('')
  const [decimalLon, setDecimalLon] = useState('')
  const [resultLat, setResultLat] = useState('')
  const [resultLon, setResultLon] = useState('')
  const [resultDMS, setResultDMS] = useState<{ lat: any; lon: any } | null>(null)
  
  // WKT/GeoJSON states
  const [wktMode, setWktMode] = useState<'wkt-to-geojson' | 'geojson-to-wkt'>('wkt-to-geojson')
  const [wktInput, setWktInput] = useState('')
  const [geojsonInput, setGeojsonInput] = useState('')
  const [wktError, setWktError] = useState('')

  // Auto-detect UTM zone when longitude changes
  const handleLonChange = (lon: string) => {
    setInputLon(lon)
    const lonNum = parseFloat(lon)
    if (!isNaN(lonNum) && lonNum >= -180 && lonNum <= 180) {
      const zone = getUTMZone(lonNum)
      setDetectedZone(zone)
      if (!utmZone || utmZone === '33') {
        setUtmZone(zone.toString())
      }
    } else {
      setDetectedZone(null)
    }
  }

  // WGS84/UTM conversion
  const convertLatLonToUTM = () => {
    const lat = parseFloat(inputLat)
    const lon = parseFloat(inputLon)

    const coordValidation = validateCoordinates(lat, lon)
    if (!coordValidation.valid) {
      toast.error(coordValidation.error || 'Please enter valid coordinates')
      return
    }

    const zone = parseInt(utmZone)
    const epsg = `EPSG:326${zone.toString().padStart(2, '0')}`
    const epsgSouth = `EPSG:327${zone.toString().padStart(2, '0')}`

    try {
      const targetEpsg = utmNorth ? epsg : epsgSouth
      const result = proj4('EPSG:4326', targetEpsg, [lon, lat])
      setUtmEasting(result[0].toFixed(2))
      setUtmNorthing(result[1].toFixed(2))
      toast.success('Converted to UTM!')
    } catch (error) {
      toast.error('Conversion failed')
      console.error('Conversion error:', error)
    }
  }

  const convertUTMToLatLon = () => {
    const easting = parseFloat(utmEasting)
    const northing = parseFloat(utmNorthing)
    const zone = parseInt(utmZone)

    if (isNaN(easting) || isNaN(northing) || isNaN(zone) || zone < 1 || zone > 60) {
      toast.error('Please enter valid UTM coordinates')
      return
    }

    const epsg = `EPSG:326${zone.toString().padStart(2, '0')}`
    const epsgSouth = `EPSG:327${zone.toString().padStart(2, '0')}`

    try {
      const sourceEpsg = utmNorth ? epsg : epsgSouth
      const result = proj4(sourceEpsg, 'EPSG:4326', [easting, northing])
      setInputLon(result[0].toFixed(6))
      setInputLat(result[1].toFixed(6))
      toast.success('Converted to Lat/Lon!')
    } catch (error) {
      toast.error('Conversion failed')
      console.error('Conversion error:', error)
    }
  }

  // DMS conversion
  const convertDMSToDecimal = () => {
    const lat = parseFloat(latDegrees)
    const latMin = parseFloat(latMinutes)
    const latSec = parseFloat(latSeconds)
    const lon = parseFloat(lonDegrees)
    const lonMin = parseFloat(lonMinutes)
    const lonSec = parseFloat(lonSeconds)

    if (isNaN(lat) || isNaN(latMin) || isNaN(latSec) || isNaN(lon) || isNaN(lonMin) || isNaN(lonSec)) {
      toast.error('Please enter valid DMS values')
      return
    }

    // Validate DMS values
    const latValidation = validateDMS(lat, latMin, latSec, true)
    const lonValidation = validateDMS(lon, lonMin, lonSec, false)

    if (!latValidation.valid) {
      toast.error(latValidation.error || 'Invalid latitude DMS values')
      return
    }

    if (!lonValidation.valid) {
      toast.error(lonValidation.error || 'Invalid longitude DMS values')
      return
    }

    const decimalLat = dmsToDecimal(lat, latMin, latSec, latDirection)
    const decimalLon = dmsToDecimal(lon, lonMin, lonSec, lonDirection)

    setResultLat(decimalLat.toFixed(6))
    setResultLon(decimalLon.toFixed(6))
    toast.success('Converted to decimal degrees!')
  }

  const convertDecimalToDMS = () => {
    const lat = parseFloat(decimalLat)
    const lon = parseFloat(decimalLon)

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error('Please enter valid decimal coordinates')
      return
    }

    const latDMS = decimalToDMS(lat, true)
    const lonDMS = decimalToDMS(lon, false)

    setResultDMS({ lat: latDMS, lon: lonDMS })
    toast.success('Converted to DMS!')
  }

  // WKT conversion (using extended functions)
  const convertWKTToGeoJSON = () => {
    setWktError('')
    try {
      const geojson = wktToGeoJSONExtended(wktInput)
      setGeojsonInput(JSON.stringify(geojson, null, 2))
      toast.success('Converted to GeoJSON!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed'
      setWktError(errorMsg)
      toast.error('Conversion failed')
    }
  }

  const convertGeoJSONToWKT = () => {
    setWktError('')
    try {
      const geojson = JSON.parse(geojsonInput)
      const wkt = geoJSONToWKTExtended(geojson)
      setWktInput(wkt)
      toast.success('Converted to WKT!')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Conversion failed'
      setWktError(errorMsg)
      toast.error('Conversion failed')
    }
  }

  // Batch conversion
  const handleBatchConvert = () => {
    if (!batchInput.trim()) {
      toast.error('Please enter coordinates to convert')
      return
    }

    const lines = batchInput.trim().split('\n').filter(line => line.trim())
    const results: any[] = []

    lines.forEach((line) => {
      const trimmed = line.trim()
      try {
        if (converterType === 'wgs84-utm' && utmMode === 'latlon-to-utm') {
          const parts = trimmed.split(/[,\s]+/)
          if (parts.length >= 2) {
            const lat = parseFloat(parts[0])
            const lon = parseFloat(parts[1])
            const validation = validateCoordinates(lat, lon)
            if (validation.valid) {
              const zone = parseInt(utmZone)
              const epsg = `EPSG:326${zone.toString().padStart(2, '0')}`
              const epsgSouth = `EPSG:327${zone.toString().padStart(2, '0')}`
              const targetEpsg = utmNorth ? epsg : epsgSouth
              const result = proj4('EPSG:4326', targetEpsg, [lon, lat])
              results.push({
                input: trimmed,
                easting: result[0].toFixed(2),
                northing: result[1].toFixed(2),
                error: null,
              })
            } else {
              results.push({ input: trimmed, error: validation.error || 'Invalid coordinates' })
            }
          } else {
            results.push({ input: trimmed, error: 'Invalid format. Expected: lat,lon' })
          }
        } else if (converterType === 'dms-decimal' && dmsMode === 'dms-to-decimal') {
          // Parse DMS format (e.g., "52 31 12 N, 13 24 30 E")
          const parts = trimmed.split(/[,\s]+/)
          if (parts.length >= 6) {
            const latDeg = parseFloat(parts[0])
            const latMin = parseFloat(parts[1])
            const latSec = parseFloat(parts[2])
            const latDir = parts[3] as 'N' | 'S'
            const lonDeg = parseFloat(parts[4])
            const lonMin = parseFloat(parts[5])
            const lonSec = parseFloat(parts[6])
            const lonDir = parts[7] as 'E' | 'W'

            const latValidation = validateDMS(latDeg, latMin, latSec, true)
            const lonValidation = validateDMS(lonDeg, lonMin, lonSec, false)

            if (latValidation.valid && lonValidation.valid) {
              const decimalLat = dmsToDecimal(latDeg, latMin, latSec, latDir)
              const decimalLon = dmsToDecimal(lonDeg, lonMin, lonSec, lonDir)
              results.push({
                input: trimmed,
                lat: decimalLat.toFixed(6),
                lon: decimalLon.toFixed(6),
                error: null,
              })
            } else {
              results.push({ input: trimmed, error: 'Invalid DMS values' })
            }
          } else {
            results.push({ input: trimmed, error: 'Invalid DMS format' })
          }
        } else {
          results.push({ input: trimmed, error: 'Batch conversion not supported for this mode' })
        }
      } catch (error) {
        results.push({ input: trimmed, error: error instanceof Error ? error.message : 'Conversion failed' })
      }
    })

    setBatchResults(results)
    toast.success(`Converted ${results.filter(r => !r.error).length} of ${results.length} coordinates`)
  }

  const handleConvert = () => {
    if (converterType === 'wgs84-utm') {
      if (utmMode === 'latlon-to-utm') {
        convertLatLonToUTM()
      } else {
        convertUTMToLatLon()
      }
    } else if (converterType === 'dms-decimal') {
      if (dmsMode === 'dms-to-decimal') {
        convertDMSToDecimal()
      } else {
        convertDecimalToDMS()
      }
    } else if (converterType === 'wkt-geojson') {
      if (wktMode === 'wkt-to-geojson') {
        convertWKTToGeoJSON()
      } else {
        convertGeoJSONToWKT()
      }
    }
  }

  const renderConverter = () => {
    if (converterType === 'wgs84-utm') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WGS84 ↔ UTM Converter</h3>
            <button
              onClick={() => {
                setUtmMode(utmMode === 'latlon-to-utm' ? 'utm-to-latlon' : 'latlon-to-utm')
                setInputLat('')
                setInputLon('')
                setUtmEasting('')
                setUtmNorthing('')
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch</span>
            </button>
          </div>

          {utmMode === 'latlon-to-utm' ? (
            <>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Latitude (WGS84)
                </label>
                <input
                  type="number"
                  step="any"
                  value={inputLat}
                  onChange={(e) => setInputLat(e.target.value)}
                  placeholder="e.g., 52.5200"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                />
              </div>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Longitude (WGS84)
                </label>
                  <input
                    type="number"
                    step="any"
                    value={inputLon}
                    onChange={(e) => handleLonChange(e.target.value)}
                    placeholder="e.g., 13.4050"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                  />
                  {detectedZone !== null && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Suggested UTM Zone: {detectedZone} (click to use)
                      <button
                        onClick={() => setUtmZone(detectedZone.toString())}
                        className="ml-2 text-blue-700 dark:text-blue-300 hover:underline"
                      >
                        Use
                      </button>
                    </p>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="!m-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    UTM Zone (1-60)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={utmZone}
                    onChange={(e) => setUtmZone(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                  />
                </div>
                <div className="!m-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hemisphere
                  </label>
                  <select
                    value={utmNorth ? 'north' : 'south'}
                    onChange={(e) => setUtmNorth(e.target.value === 'north')}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                  >
                    <option value="north">North</option>
                    <option value="south">South</option>
                  </select>
                </div>
              </div>
              {(utmEasting || utmNorthing) && (
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Easting:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{utmEasting}</span>
                      <button onClick={() => copyToClipboard(utmEasting)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Northing:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{utmNorthing}</span>
                      <button onClick={() => copyToClipboard(utmNorthing)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="!m-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    UTM Zone (1-60)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={utmZone}
                    onChange={(e) => setUtmZone(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                  />
                </div>
                <div className="!m-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hemisphere
                  </label>
                  <select
                    value={utmNorth ? 'north' : 'south'}
                    onChange={(e) => setUtmNorth(e.target.value === 'north')}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                  >
                    <option value="north">North</option>
                    <option value="south">South</option>
                  </select>
                </div>
              </div>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UTM Easting
                </label>
                <input
                  type="number"
                  step="any"
                  value={utmEasting}
                  onChange={(e) => setUtmEasting(e.target.value)}
                  placeholder="e.g., 391234.56"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                />
              </div>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  UTM Northing
                </label>
                <input
                  type="number"
                  step="any"
                  value={utmNorthing}
                  onChange={(e) => setUtmNorthing(e.target.value)}
                  placeholder="e.g., 5823456.78"
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
                />
              </div>
              {(inputLat || inputLon) && (
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{inputLat}</span>
                      <button onClick={() => copyToClipboard(inputLat)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{inputLon}</span>
                      <button onClick={() => copyToClipboard(inputLon)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )
    } else if (converterType === 'dms-decimal') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DMS ↔ Decimal Converter</h3>
            <button
              onClick={() => {
                setDmsMode(dmsMode === 'dms-to-decimal' ? 'decimal-to-dms' : 'dms-to-decimal')
                setResultLat('')
                setResultLon('')
                setResultDMS(null)
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch</span>
            </button>
          </div>

          {dmsMode === 'dms-to-decimal' ? (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Latitude (DMS)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" value={latDegrees} onChange={(e) => setLatDegrees(e.target.value)} placeholder="Deg" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <input type="number" step="any" value={latMinutes} onChange={(e) => setLatMinutes(e.target.value)} placeholder="Min" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <input type="number" step="any" value={latSeconds} onChange={(e) => setLatSeconds(e.target.value)} placeholder="Sec" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <select value={latDirection} onChange={(e) => setLatDirection(e.target.value as 'N' | 'S')} className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Longitude (DMS)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <input type="number" value={lonDegrees} onChange={(e) => setLonDegrees(e.target.value)} placeholder="Deg" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <input type="number" step="any" value={lonMinutes} onChange={(e) => setLonMinutes(e.target.value)} placeholder="Min" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <input type="number" step="any" value={lonSeconds} onChange={(e) => setLonSeconds(e.target.value)} placeholder="Sec" className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                  <select value={lonDirection} onChange={(e) => setLonDirection(e.target.value as 'E' | 'W')} className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </div>
              </div>
              {(resultLat || resultLon) && (
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{resultLat}</span>
                      <button onClick={() => copyToClipboard(resultLat)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-white font-mono">{resultLon}</span>
                      <button onClick={() => copyToClipboard(resultLon)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitude (Decimal)</label>
                <input type="number" step="any" value={decimalLat} onChange={(e) => setDecimalLat(e.target.value)} placeholder="e.g., 52.5200" className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitude (Decimal)</label>
                <input type="number" step="any" value={decimalLon} onChange={(e) => setDecimalLon(e.target.value)} placeholder="e.g., 13.4050" className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              {resultDMS && (
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude (DMS)</h4>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{resultDMS.lat.degrees}° {resultDMS.lat.minutes}' {resultDMS.lat.seconds.toFixed(2)}" {resultDMS.lat.direction}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude (DMS)</h4>
                    <p className="text-gray-900 dark:text-white font-mono text-sm">{resultDMS.lon.degrees}° {resultDMS.lon.minutes}' {resultDMS.lon.seconds.toFixed(2)}" {resultDMS.lon.direction}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )
    } else if (converterType === 'wkt-geojson') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">WKT ↔ GeoJSON Converter</h3>
            <button
              onClick={() => {
                setWktMode(wktMode === 'wkt-to-geojson' ? 'geojson-to-wkt' : 'wkt-to-geojson')
                setWktInput('')
                setGeojsonInput('')
                setWktError('')
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span>Switch</span>
            </button>
          </div>

          {wktMode === 'wkt-to-geojson' ? (
            <>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">WKT Input</label>
                <textarea value={wktInput} onChange={(e) => setWktInput(e.target.value)} placeholder='POINT(13.4050 52.5200)' className="w-full h-32 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500" />
              </div>
              {wktError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{wktError}</p>
                </div>
              )}
              {geojsonInput && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GeoJSON Output</label>
                    <button onClick={() => copyToClipboard(geojsonInput)} className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <textarea value={geojsonInput} readOnly className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="!m-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GeoJSON Input</label>
                <textarea value={geojsonInput} onChange={(e) => setGeojsonInput(e.target.value)} placeholder='{"type": "Point", "coordinates": [13.4050, 52.5200]}' className="w-full h-64 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500" />
              </div>
              {wktError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{wktError}</p>
                </div>
              )}
              {wktInput && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WKT Output</label>
                    <button onClick={() => copyToClipboard(wktInput)} className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <textarea value={wktInput} readOnly className="w-full h-32 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm" />
                </div>
              )}
            </>
          )}
        </div>
      )
    }
  }

  return (
    <ToolPage
      title="Coordinate Converter"
      description="Convert between WGS84/UTM, DMS/Decimal, and WKT/GeoJSON formats."
      keywords="coordinate converter, WGS84, UTM, DMS, WKT, GeoJSON, coordinate transformation"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Coordinate Conversion</h2>
          <div className="flex items-center space-x-4">
            {(converterType === 'wgs84-utm' || converterType === 'dms-decimal') && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => {
                    setBatchMode(e.target.checked)
                    setBatchResults([])
                    setBatchInput('')
                  }}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-gray-700 dark:text-gray-300">Batch Mode</span>
              </label>
            )}
            <div className="relative">
              <select
                value={converterType}
                onChange={(e) => {
                  setConverterType(e.target.value as ConverterType)
                  setBatchMode(false)
                  setBatchResults([])
                  setBatchInput('')
                  // Reset all states when switching
                  setInputLat('')
                  setInputLon('')
                  setUtmEasting('')
                  setUtmNorthing('')
                  setResultLat('')
                  setResultLon('')
                  setResultDMS(null)
                  setWktInput('')
                  setGeojsonInput('')
                  setWktError('')
                  setDetectedZone(null)
                }}
                className="appearance-none w-full sm:w-64 px-4 py-2 pr-10 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-offset-0 focus:ring-primary-500 focus:border-transparent cursor-pointer"
              >
                <option value="wgs84-utm">WGS84 ↔ UTM</option>
                <option value="dms-decimal">DMS ↔ Decimal</option>
                <option value="wkt-geojson">WKT ↔ GeoJSON</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {batchMode && (converterType === 'wgs84-utm' || converterType === 'dms-decimal') ? (
          <div className="space-y-4">
            <div className="!m-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Batch Input (one coordinate per line)
              </label>
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={converterType === 'wgs84-utm' && utmMode === 'latlon-to-utm' 
                  ? '52.5200, 13.4050\n51.5074, -0.1278\n...'
                  : '52 31 12 N, 13 24 30 E\n51 30 27 N, 0 7 39 W\n...'}
                className="w-full h-48 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:ring-1 focus:ring-offset-0 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleBatchConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert Batch
            </button>
            {batchResults.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-md">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Input</th>
                      {converterType === 'wgs84-utm' && utmMode === 'latlon-to-utm' ? (
                        <>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Easting</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Northing</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Latitude</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Longitude</th>
                        </>
                      )}
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.map((result, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">{result.input}</td>
                        {result.error ? (
                          <td colSpan={2} className="px-4 py-2 text-sm text-red-600 dark:text-red-400">{result.error}</td>
                        ) : (
                          <>
                            <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">
                              {result.easting || result.lat}
                            </td>
                            <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-white">
                              {result.northing || result.lon}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-2 text-sm">
                          {result.error ? (
                            <span className="text-red-600 dark:text-red-400">Error</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">Success</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          renderConverter()
        )}

        <button
          onClick={handleConvert}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Convert
        </button>
      </div>
    </ToolPage>
  )
}
