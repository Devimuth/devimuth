import { useState } from 'react'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, ArrowLeftRight } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'

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

export default function DMSConverter() {
  const [conversionMode, setConversionMode] = useState<'dms-to-decimal' | 'decimal-to-dms'>('dms-to-decimal')
  
  // DMS to Decimal
  const [latDegrees, setLatDegrees] = useState('')
  const [latMinutes, setLatMinutes] = useState('')
  const [latSeconds, setLatSeconds] = useState('')
  const [latDirection, setLatDirection] = useState<'N' | 'S'>('N')
  const [lonDegrees, setLonDegrees] = useState('')
  const [lonMinutes, setLonMinutes] = useState('')
  const [lonSeconds, setLonSeconds] = useState('')
  const [lonDirection, setLonDirection] = useState<'E' | 'W'>('E')
  
  // Decimal to DMS
  const [decimalLat, setDecimalLat] = useState('')
  const [decimalLon, setDecimalLon] = useState('')
  
  const [resultLat, setResultLat] = useState('')
  const [resultLon, setResultLon] = useState('')
  const [resultDMS, setResultDMS] = useState<{ lat: any; lon: any } | null>(null)

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

  const handleConvert = () => {
    if (conversionMode === 'dms-to-decimal') {
      convertDMSToDecimal()
    } else {
      convertDecimalToDMS()
    }
  }

  return (
    <ToolPage
      title="DMS to Decimal Degrees Converter"
      description="Convert Degrees, Minutes, Seconds to web-friendly coordinates."
      keywords="DMS converter, degrees minutes seconds, coordinate conversion, latitude longitude"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Coordinate Conversion</h2>
          <button
            onClick={() => {
              setConversionMode(conversionMode === 'dms-to-decimal' ? 'decimal-to-dms' : 'dms-to-decimal')
              setResultLat('')
              setResultLon('')
              setResultDMS(null)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Switch Mode</span>
          </button>
        </div>

        {conversionMode === 'dms-to-decimal' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Latitude (DMS)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degrees</label>
                  <input
                    type="number"
                    value={latDegrees}
                    onChange={(e) => setLatDegrees(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minutes</label>
                  <input
                    type="number"
                    step="any"
                    value={latMinutes}
                    onChange={(e) => setLatMinutes(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seconds</label>
                  <input
                    type="number"
                    step="any"
                    value={latSeconds}
                    onChange={(e) => setLatSeconds(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
                  <select
                    value={latDirection}
                    onChange={(e) => setLatDirection(e.target.value as 'N' | 'S')}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Longitude (DMS)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degrees</label>
                  <input
                    type="number"
                    value={lonDegrees}
                    onChange={(e) => setLonDegrees(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minutes</label>
                  <input
                    type="number"
                    step="any"
                    value={lonMinutes}
                    onChange={(e) => setLonMinutes(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seconds</label>
                  <input
                    type="number"
                    step="any"
                    value={lonSeconds}
                    onChange={(e) => setLonSeconds(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Direction</label>
                  <select
                    value={lonDirection}
                    onChange={(e) => setLonDirection(e.target.value as 'E' | 'W')}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to Decimal Degrees
            </button>

            {(resultLat || resultLon) && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-mono">{resultLat}</span>
                    <button
                      onClick={() => copyToClipboard(resultLat)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 dark:text-white font-mono">{resultLon}</span>
                    <button
                      onClick={() => copyToClipboard(resultLon)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Latitude (Decimal)
              </label>
              <input
                type="number"
                step="any"
                value={decimalLat}
                onChange={(e) => setDecimalLat(e.target.value)}
                placeholder="e.g., 52.5200"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Longitude (Decimal)
              </label>
              <input
                type="number"
                step="any"
                value={decimalLon}
                onChange={(e) => setDecimalLon(e.target.value)}
                placeholder="e.g., 13.4050"
                className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleConvert}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Convert to DMS
            </button>

            {resultDMS && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Latitude (DMS)</h4>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {resultDMS.lat.degrees}° {resultDMS.lat.minutes}' {resultDMS.lat.seconds.toFixed(2)}" {resultDMS.lat.direction}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Longitude (DMS)</h4>
                  <p className="text-gray-900 dark:text-white font-mono">
                    {resultDMS.lon.degrees}° {resultDMS.lon.minutes}' {resultDMS.lon.seconds.toFixed(2)}" {resultDMS.lon.direction}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPage>
  )
}

