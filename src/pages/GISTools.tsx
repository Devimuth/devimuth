import { Search, MapPin, Navigation, BoxSelect, Ruler } from 'lucide-react'
import { useState } from 'react'
import ToolCard from '../components/ToolCard/ToolCard'
import SEOHead from '../components/SEO/SEOHead'

const gisTools = [
  {
    title: 'Coordinate Converter',
    description: 'Convert between WGS84/UTM, DMS/Decimal, and WKT/GeoJSON formats.',
    icon: Navigation,
    path: '/coordinate-converter',
  },
  {
    title: 'GeoJSON Visualizer',
    description: 'Paste and validate GeoJSON to render it instantly on a map.',
    icon: MapPin,
    path: '/geojson-visualizer',
  },
  {
    title: 'BBOX Selector',
    description: 'Draw on a map to capture Bounding Box coordinates (MinX, MinY, MaxX, MaxY).',
    icon: BoxSelect,
    path: '/bbox-selector',
  },
  {
    title: 'Distance & Area',
    description: 'Calculate geodesic measurements using Turf.js.',
    icon: Ruler,
    path: '/distance-area',
  },
]

export default function GISTools() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTools = gisTools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <SEOHead
        title="GIS Tools - Devimuth"
        description="Comprehensive collection of Geographic Information System tools for coordinate conversion, visualization, and geospatial analysis."
        keywords="GIS tools, coordinate converter, GeoJSON, map tools, geospatial"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-6 w-6 text-gis-600 dark:text-gis-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              GIS & Geospatial Tools
            </h1>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            Coordinate conversion, map visualization, and geospatial analysis. All processing happens in your browser.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gis-500 focus:border-gis-500"
          />
        </div>

        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.path}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                path={tool.path}
                category="gis"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
            No tools found matching your search.
          </div>
        )}
      </div>
    </>
  )
}

