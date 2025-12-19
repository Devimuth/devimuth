import { Search, Users } from 'lucide-react'
import { useState } from 'react'
import SEOHead from '../components/SEO/SEOHead'

export default function VATools() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <SEOHead
        title="VA Tools - Devimuth"
        description="Virtual Assistant tools and utilities for productivity and automation."
        keywords="VA tools, virtual assistant, productivity tools, automation"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              VA Tools
            </h1>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            Productivity and automation tools for virtual assistants.
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
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Placeholder Content */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            VA tools are currently under development. Check back soon for productivity and automation utilities.
          </p>
        </div>
      </div>
    </>
  )
}

