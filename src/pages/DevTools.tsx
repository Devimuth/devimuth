import { Search, Code, FileText, Hash, Key, FileJson, Link as LinkIcon, GitCompare } from 'lucide-react'
import { useState } from 'react'
import ToolCard from '../components/ToolCard/ToolCard'
import SEOHead from '../components/SEO/SEOHead'

const devTools = [
  {
    title: 'JSON ↔ CSV Converter',
    description: 'Quickly swap between data formats for spreadsheets or APIs.',
    icon: FileText,
    path: '/json-csv-converter',
  },
  {
    title: 'UUID & Hash Generator',
    description: 'Generate secure v4 UUIDs and SHA/MD5 hashes.',
    icon: Hash,
    path: '/uuid-hash-generator',
  },
  {
    title: 'JWT Decoder',
    description: 'Inspect JSON Web Tokens (JWT) locally and securely.',
    icon: Key,
    path: '/jwt-decoder',
  },
  {
    title: 'JSON Formatter/Minifier',
    description: 'Prettify messy JSON strings for better readability.',
    icon: FileJson,
    path: '/json-formatter',
  },
  {
    title: 'Base64 & URL Encoder',
    description: 'Standard encoding utilities for web development.',
    icon: LinkIcon,
    path: '/base64-url-encoder',
  },
  {
    title: 'Diff Viewer',
    description: 'Compare two blocks of text or code to identify changes.',
    icon: GitCompare,
    path: '/diff-viewer',
  },
]

export default function DevTools() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTools = devTools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <SEOHead
        title="Developer Tools - Devimuth"
        description="Essential developer utilities for data conversion, encoding, formatting, and debugging. All tools run client-side in your browser."
        keywords="developer tools, JSON converter, CSV converter, JWT decoder, base64 encoder, UUID generator"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Code className="h-6 w-6 text-dev-600 dark:text-dev-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Developer & Data Utilities
            </h1>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            Data conversion, encoding, formatting, and debugging. All processing happens in your browser.
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
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-dev-500 focus:border-dev-500"
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
                category="dev"
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

