import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Rectangle, useMap } from 'react-leaflet'
import { LatLngBounds } from 'leaflet'
import ToolPage from '../../components/ToolPage/ToolPage'
import { Copy, Trash2 } from 'lucide-react'
import { copyToClipboard } from '../../utils/copyToClipboard'
import toast from 'react-hot-toast'
import * as turf from '@turf/turf'
import proj4 from '../../utils/proj4Setup'
import { validateBBox } from '../../utils/gis/validation'
import { formatArea, type AreaUnit } from '../../utils/gis/units'

function DrawingRectangle({ onBoundsChange }: { onBoundsChange: (bounds: LatLngBounds) => void }) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      // Only handle left mouse button (button 0) for drawing
      // Middle mouse button (button 1) and right button (button 2) allow map dragging
      const button = (e.originalEvent as MouseEvent).button
      if (button !== 0) {
        return // Allow middle/right button to drag the map
      }
      
      // Prevent map dragging for left click
      map.dragging.disable()
      setIsDrawing(true)
      const point: [number, number] = [e.latlng.lat, e.latlng.lng]
      setStartPoint(point)
      setEndPoint(point)
    }

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (isDrawing) {
        setEndPoint([e.latlng.lat, e.latlng.lng])
      }
    }

    const handleMouseUp = (e: L.LeafletMouseEvent) => {
      // Only handle left mouse button (button 0) for drawing
      const button = (e.originalEvent as MouseEvent).button
      if (button !== 0) {
        return // Allow middle/right button to work normally
      }
      
      if (isDrawing && startPoint) {
        const finalPoint: [number, number] = [e.latlng.lat, e.latlng.lng]
        setEndPoint(finalPoint)
        
        // Only create bounds if there's actual movement
        const latDiff = Math.abs(startPoint[0] - finalPoint[0])
        const lngDiff = Math.abs(startPoint[1] - finalPoint[1])
        
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          const newBounds = new LatLngBounds(
            [Math.min(startPoint[0], finalPoint[0]), Math.min(startPoint[1], finalPoint[1])],
            [Math.max(startPoint[0], finalPoint[0]), Math.max(startPoint[1], finalPoint[1])]
          )
          onBoundsChange(newBounds)
        }
        
        setIsDrawing(false)
      }
      // Re-enable map dragging
      map.dragging.enable()
    }

    // Mouse events
    map.on('mousedown', handleMouseDown)
    map.on('mousemove', handleMouseMove)
    map.on('mouseup', handleMouseUp)

    // Touch event handlers for mobile - use DOM events directly
    const mapContainer = map.getContainer()
    
    const handleTouchStart = (e: TouchEvent) => {
      // Only handle single touch (not multi-touch)
      if (e.touches.length !== 1) {
        return // Allow multi-touch to pan the map
      }
      
      e.preventDefault() // Prevent default map panning
      const touch = e.touches[0]
      const containerPoint = map.mouseEventToContainerPoint(touch as unknown as MouseEvent)
      const latlng = map.containerPointToLatLng(containerPoint)
      
      // Prevent map dragging for single touch
      map.dragging.disable()
      map.touchZoom.disable()
      setIsDrawing(true)
      const point: [number, number] = [latlng.lat, latlng.lng]
      setStartPoint(point)
      setEndPoint(point)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isDrawing && e.touches.length === 1) {
        e.preventDefault() // Prevent default map panning
        const touch = e.touches[0]
        const containerPoint = map.mouseEventToContainerPoint(touch as unknown as MouseEvent)
        const latlng = map.containerPointToLatLng(containerPoint)
        setEndPoint([latlng.lat, latlng.lng])
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isDrawing && startPoint && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0]
        const containerPoint = map.mouseEventToContainerPoint(touch as unknown as MouseEvent)
        const latlng = map.containerPointToLatLng(containerPoint)
        const finalPoint: [number, number] = [latlng.lat, latlng.lng]
        setEndPoint(finalPoint)
        
        // Only create bounds if there's actual movement
        const latDiff = Math.abs(startPoint[0] - finalPoint[0])
        const lngDiff = Math.abs(startPoint[1] - finalPoint[1])
        
        if (latDiff > 0.0001 || lngDiff > 0.0001) {
          const newBounds = new LatLngBounds(
            [Math.min(startPoint[0], finalPoint[0]), Math.min(startPoint[1], finalPoint[1])],
            [Math.max(startPoint[0], finalPoint[0]), Math.max(startPoint[1], finalPoint[1])]
          )
          onBoundsChange(newBounds)
        }
        
        setIsDrawing(false)
      }
      // Re-enable map interactions
      map.dragging.enable()
      map.touchZoom.enable()
    }

    // Add touch event listeners to map container
    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: false })
    mapContainer.addEventListener('touchmove', handleTouchMove, { passive: false })
    mapContainer.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      // Cleanup mouse events
      map.off('mousedown', handleMouseDown)
      map.off('mousemove', handleMouseMove)
      map.off('mouseup', handleMouseUp)
      
      // Cleanup touch events
      mapContainer.removeEventListener('touchstart', handleTouchStart)
      mapContainer.removeEventListener('touchmove', handleTouchMove)
      mapContainer.removeEventListener('touchend', handleTouchEnd)
      
      // Re-enable map interactions
      map.dragging.enable()
      map.touchZoom.enable()
    }
  }, [map, isDrawing, startPoint, onBoundsChange])

  if (!startPoint || !endPoint) return null

  const rectBounds = new LatLngBounds(
    [Math.min(startPoint[0], endPoint[0]), Math.min(startPoint[1], endPoint[1])],
    [Math.max(startPoint[0], endPoint[0]), Math.max(startPoint[1], endPoint[1])]
  )

  return <Rectangle bounds={rectBounds} pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }} />
}

export default function BBOXSelector() {
  const [bounds, setBounds] = useState<LatLngBounds | null>(null)
  const [bbox, setBbox] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null)
  const [coordinateSystem, setCoordinateSystem] = useState<'WGS84' | 'WebMercator'>('WGS84')
  const [manualInput, setManualInput] = useState({
    minX: '',
    minY: '',
    maxX: '',
    maxY: '',
  })
  const [bboxArea, setBboxArea] = useState<number | null>(null)
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('km2')

  const handleBoundsChange = (newBounds: LatLngBounds) => {
    setBounds(newBounds)
    const wgs84Bbox = {
      minX: newBounds.getWest(),
      minY: newBounds.getSouth(),
      maxX: newBounds.getEast(),
      maxY: newBounds.getNorth(),
    }
    setBbox(wgs84Bbox)
    setManualInput({
      minX: wgs84Bbox.minX.toFixed(6),
      minY: wgs84Bbox.minY.toFixed(6),
      maxX: wgs84Bbox.maxX.toFixed(6),
      maxY: wgs84Bbox.maxY.toFixed(6),
    })
    calculateArea(wgs84Bbox)
  }

  const calculateArea = (bboxData: { minX: number; minY: number; maxX: number; maxY: number }) => {
    try {
      const polygon = turf.polygon([[
        [bboxData.minX, bboxData.minY],
        [bboxData.maxX, bboxData.minY],
        [bboxData.maxX, bboxData.maxY],
        [bboxData.minX, bboxData.maxY],
        [bboxData.minX, bboxData.minY],
      ]])
      const areaM2 = turf.area(polygon)
      const areaKm2 = areaM2 / 1000000
      setBboxArea(areaKm2)
    } catch (error) {
      setBboxArea(null)
    }
  }

  const handleManualInputChange = (field: 'minX' | 'minY' | 'maxX' | 'maxY', value: string) => {
    setManualInput({ ...manualInput, [field]: value })
  }

  const handleManualInputApply = () => {
    const minX = parseFloat(manualInput.minX)
    const minY = parseFloat(manualInput.minY)
    const maxX = parseFloat(manualInput.maxX)
    const maxY = parseFloat(manualInput.maxY)

    const validation = validateBBox(minX, minY, maxX, maxY)
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid bounding box')
      return
    }

    let finalBbox = { minX, minY, maxX, maxY }

    // Convert from Web Mercator to WGS84 if needed
    if (coordinateSystem === 'WebMercator') {
      try {
        const sw = proj4('EPSG:3857', 'EPSG:4326', [minX, minY])
        const ne = proj4('EPSG:3857', 'EPSG:4326', [maxX, maxY])
        finalBbox = {
          minX: Math.min(sw[0], ne[0]),
          minY: Math.min(sw[1], ne[1]),
          maxX: Math.max(sw[0], ne[0]),
          maxY: Math.max(sw[1], ne[1]),
        }
      } catch (error) {
        toast.error('Failed to convert coordinates')
        return
      }
    }

    setBbox(finalBbox)
    const newBounds = new LatLngBounds(
      [finalBbox.minY, finalBbox.minX],
      [finalBbox.maxY, finalBbox.maxX]
    )
    setBounds(newBounds)
    calculateArea(finalBbox)
    toast.success('Bounding box updated')
  }

  const handleCoordinateSystemChange = (system: 'WGS84' | 'WebMercator') => {
    if (!bbox) {
      setCoordinateSystem(system)
      return
    }

    try {
      let convertedBbox
      if (system === 'WebMercator') {
        // Convert from WGS84 to Web Mercator
        const sw = proj4('EPSG:4326', 'EPSG:3857', [bbox.minX, bbox.minY])
        const ne = proj4('EPSG:4326', 'EPSG:3857', [bbox.maxX, bbox.maxY])
        convertedBbox = {
          minX: Math.min(sw[0], ne[0]),
          minY: Math.min(sw[1], ne[1]),
          maxX: Math.max(sw[0], ne[0]),
          maxY: Math.max(sw[1], ne[1]),
        }
      } else {
        // Already in WGS84
        convertedBbox = bbox
      }

      setManualInput({
        minX: convertedBbox.minX.toFixed(6),
        minY: convertedBbox.minY.toFixed(6),
        maxX: convertedBbox.maxX.toFixed(6),
        maxY: convertedBbox.maxY.toFixed(6),
      })
      setCoordinateSystem(system)
    } catch (error) {
      toast.error('Failed to convert coordinate system')
    }
  }

  useEffect(() => {
    if (bbox) {
      calculateArea(bbox)
    }
  }, [bbox])

  const handleClear = () => {
    setBounds(null)
    setBbox(null)
    toast.success('Bounding box cleared')
  }

  const copyBbox = (format: 'minx-miny-maxx-maxy' | 'wkt' | 'geojson') => {
    if (!bbox) return

    let text = ''
    switch (format) {
      case 'minx-miny-maxx-maxy':
        text = `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`
        break
      case 'wkt':
        text = `POLYGON((${bbox.minX} ${bbox.minY}, ${bbox.maxX} ${bbox.minY}, ${bbox.maxX} ${bbox.maxY}, ${bbox.minX} ${bbox.maxY}, ${bbox.minX} ${bbox.minY}))`
        break
      case 'geojson':
        text = JSON.stringify({
          type: 'Polygon',
          coordinates: [[
            [bbox.minX, bbox.minY],
            [bbox.maxX, bbox.minY],
            [bbox.maxX, bbox.maxY],
            [bbox.minX, bbox.maxY],
            [bbox.minX, bbox.minY],
          ]],
        }, null, 2)
        break
    }
    copyToClipboard(text, `${format.toUpperCase()} copied!`)
  }

  return (
    <ToolPage
      title="BBOX Selector"
      description="Draw on a map to capture Bounding Box coordinates (MinX, MinY, MaxX, MaxY). Left-click and drag to draw, use middle mouse button to pan the map."
      keywords="bounding box, bbox, map selector, coordinates, geospatial"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Desktop:</strong> Left-click and drag on the map to draw a bounding box. Use the middle mouse button to drag/pan the map.
            <br />
            <strong>Mobile:</strong> Touch and drag with one finger to draw a bounding box. Use two fingers to pan/zoom the map.
          </p>
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
                {bounds && <Rectangle bounds={bounds} pathOptions={{ color: '#3b82f6', fillOpacity: 0.2 }} />}
                <DrawingRectangle onBoundsChange={handleBoundsChange} />
              </MapContainer>
            </div>
            {bbox && (
              <button
                onClick={handleClear}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Selection</span>
              </button>
            )}
          </div>

          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bounding Box Coordinates</h3>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">System:</label>
                <select
                  value={coordinateSystem}
                  onChange={(e) => handleCoordinateSystemChange(e.target.value as 'WGS84' | 'WebMercator')}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="WGS84">WGS84</option>
                  <option value="WebMercator">Web Mercator</option>
                </select>
              </div>
            </div>
            {bbox ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Manual Input</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MinX (West)</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="any"
                          value={manualInput.minX}
                          onChange={(e) => handleManualInputChange('minX', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(manualInput.minX, 'MinX copied!')}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Copy MinX"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MinY (South)</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="any"
                          value={manualInput.minY}
                          onChange={(e) => handleManualInputChange('minY', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(manualInput.minY, 'MinY copied!')}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Copy MinY"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MaxX (East)</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="any"
                          value={manualInput.maxX}
                          onChange={(e) => handleManualInputChange('maxX', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(manualInput.maxX, 'MaxX copied!')}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Copy MaxX"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MaxY (North)</label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="any"
                          value={manualInput.maxY}
                          onChange={(e) => handleManualInputChange('maxY', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(manualInput.maxY, 'MaxY copied!')}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          title="Copy MaxY"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleManualInputApply}
                    className="w-full px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Apply Manual Input
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MinX (West)</label>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">{bbox.minX.toFixed(6)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MinY (South)</label>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">{bbox.minY.toFixed(6)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MaxX (East)</label>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">{bbox.maxX.toFixed(6)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MaxY (North)</label>
                    <p className="text-lg font-mono text-gray-900 dark:text-white">{bbox.maxY.toFixed(6)}</p>
                  </div>
                </div>

                {bboxArea !== null && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Area:</label>
                      <select
                        value={areaUnit}
                        onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="m2">m²</option>
                        <option value="km2">km²</option>
                        <option value="acres">acres</option>
                      </select>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatArea(bboxArea, areaUnit, 4)}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => copyBbox('minx-miny-maxx-maxy')}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy as MinX,MinY,MaxX,MaxY</span>
                  </button>
                  <button
                    onClick={() => copyBbox('wkt')}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy as WKT</span>
                  </button>
                  <button
                    onClick={() => copyBbox('geojson')}
                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy as GeoJSON</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 h-auto min-h-[256px]">
                <p className="text-gray-500 dark:text-gray-400">Draw on the map to capture bounding box</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPage>
  )
}

