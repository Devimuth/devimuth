import { Search, TrendingUp, FileText, Hash, Share2, BarChart3, Scissors, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import ToolCard from '../components/ToolCard/ToolCard'
import SEOHead from '../components/SEO/SEOHead'

const marketingTools = [
  {
    title: 'SEO Meta Tag Generator',
    description: 'Generate comprehensive SEO meta tags including title, description, Open Graph, and Twitter Cards.',
    icon: FileText,
    path: '/seo-meta-generator',
  },
  {
    title: 'Meta Description Generator',
    description: 'Create optimized meta descriptions with character count validation and keyword suggestions.',
    icon: FileText,
    path: '/meta-description-generator',
  },
  {
    title: 'Open Graph Tag Generator',
    description: 'Generate Open Graph tags for optimal social media sharing previews.',
    icon: Share2,
    path: '/open-graph-generator',
  },
  {
    title: 'Schema Markup Generator',
    description: 'Create JSON-LD structured data for articles, products, organizations, and more.',
    icon: Hash,
    path: '/schema-markup-generator',
  },
  {
    title: 'Social Media Preview Generator',
    description: 'Preview how your content will look on Facebook, Twitter, LinkedIn, and Instagram.',
    icon: Share2,
    path: '/social-preview-generator',
  },
  {
    title: 'Keyword Density Analyzer',
    description: 'Analyze keyword frequency and density in your content for SEO optimization.',
    icon: BarChart3,
    path: '/keyword-density-analyzer',
  },
  {
    title: 'URL Shortener',
    description: 'Shorten URLs with custom aliases and generate QR codes. All processing happens client-side.',
    icon: Scissors,
    path: '/url-shortener',
  },
]

export default function MarketingTools() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredTools = marketingTools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <SEOHead
        title="Marketing Tools - Devimuth"
        description="SEO, social media, and marketing utilities for meta tags, previews, keyword analysis, and URL shortening. All tools run client-side in your browser."
        keywords="marketing tools, SEO, meta tags, Open Graph, social media, keyword analysis, URL shortener"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Tools</span>
        </Link>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Marketing Tools
            </h1>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            SEO optimization, social media tools, and marketing utilities. All processing happens in your browser.
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
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
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
                category="marketing"
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

