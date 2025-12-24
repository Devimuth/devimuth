import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SEOHead from '../SEO/SEOHead'

interface ToolPageProps {
  title: string
  description: string
  children: ReactNode
  keywords?: string
}

// Map tool paths to their category pages
const getCategoryPage = (pathname: string): { path: string; label: string } => {
  const gisTools = ['/coordinate-converter', '/geojson-visualizer', '/bbox-selector', '/distance-area']
  const devTools = ['/json-csv-converter', '/uuid-hash-generator', '/jwt-decoder', '/json-formatter', '/base64-url-encoder', '/diff-viewer']
  const productivityTools = ['/typing-test', '/skills-assessment-generator', '/communication-test']
  const marketingTools = ['/seo-meta-generator', '/meta-description-generator', '/open-graph-generator', '/schema-markup-generator', '/social-preview-generator', '/keyword-density-analyzer', '/url-shortener']
  
  if (gisTools.includes(pathname)) {
    return { path: '/gis-tools', label: 'GIS Tools' }
  }
  if (devTools.includes(pathname)) {
    return { path: '/dev-tools', label: 'Dev Tools' }
  }
  if (productivityTools.includes(pathname)) {
    return { path: '/productivity-tools', label: 'Productivity Tools' }
  }
  if (marketingTools.includes(pathname)) {
    return { path: '/marketing-tools', label: 'Marketing Tools' }
  }
  // Default to home if category not found
  return { path: '/', label: 'Home' }
}

export default function ToolPage({ title, description, children, keywords }: ToolPageProps) {
  const location = useLocation()
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://Devimuth.github.io/devimuth' 
    : window.location.origin
  const currentPath = location.pathname
  const { path: backPath, label: backLabel } = getCategoryPage(currentPath)

  return (
    <>
      <SEOHead
        title={`${title} - Devimuth Tools`}
        description={description}
        keywords={keywords}
        canonical={`${baseUrl}${currentPath}`}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {backLabel}</span>
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 sm:p-10">
          <div className="w-full max-w-full overflow-x-auto overflow-y-visible">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

