import { MapPin, Code, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEO/SEOHead'

export default function Tools() {
  return (
    <>
      <SEOHead
        title="Tools - Devimuth"
        description="Browse all tool categories: GIS Tools, Developer Tools, Productivity Tools, and Marketing Tools. Free, client-side utilities for your workflow."
        keywords="tools, GIS tools, developer tools, productivity tools, marketing tools, utilities"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            All Tools
          </h1>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            Browse our collection of free, client-side tools organized by category. Everything runs in your browser—no data leaves your machine.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/gis-tools"
            className="group block p-6 bg-white dark:bg-gray-800 border-l-4 border-gis-600 dark:border-gis-500 hover:border-gis-700 dark:hover:border-gis-400 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-3 mb-3">
              <MapPin className="h-6 w-6 text-gis-600 dark:text-gis-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                  GIS Tools
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Coordinate conversion, map visualization, geospatial analysis.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-gis-600 dark:text-gis-400 group-hover:underline">
              View tools →
            </span>
          </Link>

          <Link
            to="/dev-tools"
            className="group block p-6 bg-white dark:bg-gray-800 border-l-4 border-dev-600 dark:border-dev-500 hover:border-dev-700 dark:hover:border-dev-400 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-3 mb-3">
              <Code className="h-6 w-6 text-dev-600 dark:text-dev-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                  Dev Tools
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Data conversion, encoding, formatting, debugging.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-dev-600 dark:text-dev-400 group-hover:underline">
              View tools →
            </span>
          </Link>

          <Link
            to="/productivity-tools"
            className="group block p-6 bg-white dark:bg-gray-800 border-l-4 border-primary-600 dark:border-primary-500 hover:border-primary-700 dark:hover:border-primary-400 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-3 mb-3">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                  Productivity Tools
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Productivity and automation utilities.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
              View tools →
            </span>
          </Link>

          <Link
            to="/marketing-tools"
            className="group block p-6 bg-white dark:bg-gray-800 border-l-4 border-purple-600 dark:border-purple-500 hover:border-purple-700 dark:hover:border-purple-400 transition-colors shadow-sm hover:shadow-md"
          >
            <div className="flex items-start gap-3 mb-3">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                  Marketing Tools
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  SEO optimization, social media, and marketing utilities.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:underline">
              View tools →
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}

