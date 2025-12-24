import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Polygon, useMapEvents } from 'react-leaflet'
import * as turf from '@turf/turf'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Trash2, Undo2, Download } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import { convertDistance, convertArea, formatDistance, formatArea, type DistanceUnit, type AreaUnit } from '../../utils/gis/units'
import { exportGeoJSON, exportKML } from '../../utils/gis/export'

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function DistanceArea() {
  const [measurementType, setMeasurementType] = useState<'distance' | 'area'>('distance')
  const [points, setPoints] = useState<[number, number][]>([])
  const [distance, setDistance] = useState<number | null>(null)
  const [area, setArea] = useState<number | null>(null)
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('km')
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('km2')

  const handleMapClick = (lat: number, lng: number) => {
    setPoints([...points, [lng, lat]])
  }

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1))
      setDistance(null)
      setArea(null)
      toast.success('Last point removed')
    }
  }

  const handleClear = () => {
    setPoints([])
    setDistance(null)
    setArea(null)
    toast.success('Cleared measurements')
  }

  // Real-time calculation when points change
  useEffect(() => {
    if (measurementType === 'distance' && points.length >= 2) {
      const line = turf.lineString(points)
      const dist = turf.length(line, { units: 'kilometers' })
      setDistance(dist)
    } else if (measurementType === 'area' && points.length >= 3) {
      const closedPoints = [...points, points[0]]
      const polygon = turf.polygon([closedPoints])
      const areaValue = turf.area(polygon) / 1000000 // Convert to km²
      setArea(areaValue)
    } else {
      setDistance(null)
      setArea(null)
    }
  }, [points, measurementType])


  const handleExportGeoJSON = () => {
    try {
      if (measurementType === 'distance' && points.length >= 2) {
        const geojson = turf.lineString(points)
        exportGeoJSON(geojson, 'distance-measurement')
        toast.success('Exported as GeoJSON!')
      } else if (measurementType === 'area' && points.length >= 3) {
        const closedPoints = [...points, points[0]]
        const geojson = turf.polygon([closedPoints])
        exportGeoJSON(geojson, 'area-measurement')
        toast.success('Exported as GeoJSON!')
      } else {
        toast.error('Not enough points to export')
      }
    } catch (error) {
      toast.error('Export failed')
      console.error(error)
    }
  }

  const handleExportKML = () => {
    try {
      if (measurementType === 'distance' && points.length >= 2) {
        const geojson = turf.lineString(points)
        exportKML(geojson, 'distance-measurement')
        toast.success('Exported as KML!')
      } else if (measurementType === 'area' && points.length >= 3) {
        const closedPoints = [...points, points[0]]
        const geojson = turf.polygon([closedPoints])
        exportKML(geojson, 'area-measurement')
        toast.success('Exported as KML!')
      } else {
        toast.error('Not enough points to export')
      }
    } catch (error) {
      toast.error('Export failed')
      console.error(error)
    }
  }

  // Get converted values based on selected units
  const getDisplayDistance = (): string | null => {
    if (distance === null) return null
    const converted = convertDistance(distance, 'km', distanceUnit)
    return formatDistance(converted, distanceUnit)
  }

  const getDisplayArea = (): string | null => {
    if (area === null) return null
    const converted = convertArea(area, 'km2', areaUnit)
    return formatArea(converted, areaUnit)
  }

  // Get secondary display (always in meters/m²)
  const getSecondaryDistance = (): string | null => {
    if (distance === null) return null
    const inMeters = convertDistance(distance, 'km', 'm')
    return formatDistance(inMeters, 'm', 2)
  }

  const getSecondaryArea = (): string | null => {
    if (area === null) return null
    const inM2 = convertArea(area, 'km2', 'm2')
    return formatArea(inM2, 'm2', 2)
  }

  return (
    <ToolPage
      title="Distance & Area Calculator"
      description="Calculate geodesic measurements using Turf.js."
      keywords="distance calculator, area calculator, geodesic measurement, map measurement"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Click on the map to add points. Select measurement type and click Calculate.
          </p>
        </div>

        <div className="flex items-center space-x-4 flex-wrap gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurement Type:</label>
          <select
            value={measurementType}
            onChange={(e) => {
              setMeasurementType(e.target.value as 'distance' | 'area')
              setDistance(null)
              setArea(null)
            }}
            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="distance">Distance</option>
            <option value="area">Area</option>
          </select>
          {measurementType === 'distance' && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit:</label>
          )}
          {measurementType === 'distance' && (
            <select
              value={distanceUnit}
              onChange={(e) => setDistanceUnit(e.target.value as DistanceUnit)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="m">Meters</option>
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
              <option value="ft">Feet</option>
            </select>
          )}
          {measurementType === 'area' && (
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit:</label>
          )}
          {measurementType === 'area' && (
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="m2">Square Meters</option>
              <option value="km2">Square Kilometers</option>
              <option value="acres">Acres</option>
            </select>
          )}
          <button
            onClick={handleUndo}
            disabled={points.length === 0}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="h-4 w-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4 min-w-0">
            <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-full h-64 sm:h-96">
              <MapContainer
                center={[0, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onMapClick={handleMapClick} />
                {points.map((point, index) => (
                  <Marker key={index} position={[point[1], point[0]] as [number, number]} />
                ))}
                {points.length > 1 && measurementType === 'distance' && (
                  <Polyline positions={points.map(p => [p[1], p[0]] as [number, number])} color="#3b82f6" />
                )}
                {points.length > 2 && measurementType === 'area' && (
                  <Polygon positions={[...points.map(p => [p[1], p[0]] as [number, number]), [points[0][1], points[0][0]] as [number, number]]} color="#3b82f6" fillOpacity={0.2} />
                )}
              </MapContainer>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Points: {points.length}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
              {(measurementType === 'distance' && points.length >= 2) || (measurementType === 'area' && points.length >= 3) ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportGeoJSON}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                    title="Export as GeoJSON"
                  >
                    <Download className="h-3 w-3" />
                    <span>GeoJSON</span>
                  </button>
                  <button
                    onClick={handleExportKML}
                    className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1"
                    title="Export as KML"
                  >
                    <Download className="h-3 w-3" />
                    <span>KML</span>
                  </button>
                </div>
              ) : null}
            </div>
            {measurementType === 'distance' ? (
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {distance !== null ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Distance:</span>
                      <button
                        onClick={() => copyToClipboard(getDisplayDistance() || '')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {getDisplayDistance()}
                    </p>
                    {distanceUnit !== 'm' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getSecondaryDistance()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {points.length < 2
                      ? 'Click on map to add at least 2 points for distance measurement'
                      : 'Calculating...'}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                {area !== null ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Area:</span>
                      <button
                        onClick={() => copyToClipboard(getDisplayArea() || '')}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {getDisplayArea()}
                    </p>
                    {areaUnit !== 'm2' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {getSecondaryArea()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {points.length < 3
                      ? 'Click on map to add at least 3 points for area measurement'
                      : 'Calculating...'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPage>
  )
}

