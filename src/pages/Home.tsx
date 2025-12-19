import { MapPin, Code, Users, Navigation, FileJson, Key, Shield, Zap, Globe, Lock, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEO/SEOHead'
import ToolCard from '../components/ToolCard/ToolCard'
import FAQ from '../components/FAQ/FAQ'
import { useDarkMode } from '../hooks/useDarkMode'

const featuredTools = [
  {
    title: 'Coordinate Converter',
    description: 'Convert between WGS84/UTM, DMS/Decimal, and WKT/GeoJSON formats.',
    icon: Navigation,
    path: '/coordinate-converter',
    category: 'gis' as const,
  },
  {
    title: 'JSON Formatter/Minifier',
    description: 'Prettify messy JSON strings for better readability.',
    icon: FileJson,
    path: '/json-formatter',
    category: 'dev' as const,
  },
  {
    title: 'JWT Decoder',
    description: 'Inspect JSON Web Tokens (JWT) locally and securely.',
    icon: Key,
    path: '/jwt-decoder',
    category: 'dev' as const,
  },
  {
    title: 'GeoJSON Visualizer',
    description: 'Paste and validate GeoJSON to render it instantly on a map.',
    icon: MapPin,
    path: '/geojson-visualizer',
    category: 'gis' as const,
  },
]

const faqItems = [
  {
    question: 'What is Devimuth Tools?',
    answer: 'Devimuth Tools is a collection of free, client-side web utilities for GIS (Geographic Information Systems) and developer tasks. All tools run entirely in your browser—no data is sent to any server, ensuring complete privacy and security.',
  },
  {
    question: 'Are my data secure? Does data leave my browser?',
    answer: 'Yes, your data is completely secure. All processing happens locally in your browser using JavaScript. No data, files, or information ever leaves your device. There are no API calls to external servers for processing, and we do not collect, store, or transmit any of your data.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No account is required. Devimuth Tools is completely free to use without any registration, login, or account creation. Simply visit the tool you need and start using it immediately.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'Devimuth Tools works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. The tools require JavaScript to be enabled and utilize modern web APIs, so older browsers may not be fully supported.',
  },
  {
    question: 'Are the tools free to use?',
    answer: 'Yes, all tools are completely free to use with no hidden costs, subscriptions, or premium tiers. Devimuth Tools is open source and available for anyone to use, modify, and distribute.',
  },
  {
    question: 'Can I use these tools offline?',
    answer: 'Once the website is loaded in your browser, most tools will continue to work offline since all processing happens client-side. However, you may need an internet connection for initial page load and any map-related tools that fetch tile data.',
  },
  {
    question: 'What GIS coordinate systems are supported?',
    answer: 'The coordinate converter supports multiple coordinate systems including WGS84 (decimal degrees and DMS), UTM (Universal Transverse Mercator), and can convert to/from WKT (Well-Known Text) and GeoJSON formats. Specific supported projections depend on the tool being used.',
  },
  {
    question: 'How do I report bugs or suggest features?',
    answer: 'If you encounter any issues or have suggestions for improvements, please visit our GitHub repository (linked in the footer) to open an issue or submit a pull request. We welcome contributions and feedback from the community.',
  },
  {
    question: 'Can I use these tools for commercial purposes?',
    answer: 'Yes, Devimuth Tools is open source and free for both personal and commercial use. You can use, modify, and distribute the tools according to the project\'s license. Please check the specific license terms in the repository for details.',
  },
  {
    question: 'What formats are supported for data conversion?',
    answer: 'The tools support various formats including JSON, CSV, GeoJSON, WKT, Base64, URL encoding, and coordinate formats (DMS, Decimal Degrees, UTM). Each tool specifies the supported input and output formats in its interface.',
  },
]

export default function Home() {
  const { isDark } = useDarkMode()

  return (
    <>
      <SEOHead />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Enhanced Hero Section */}
        <div className="mb-16 text-center">
          <img 
            src={isDark ? "/logo-w8-bg.png" : "/logo.png"} 
            alt="Devimuth Logo" 
            className="h-16 sm:h-20 md:h-24 w-auto mx-auto mb-6"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Devimuth Tools
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-2">
            Free, client-side GIS and developer utilities
          </p>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Everything runs in your browser—no data leaves your machine. Fast, secure, and completely private.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
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
            to="/va-tools"
            className="group block p-6 bg-white dark:bg-gray-800 border-l-4 border-primary-600 dark:border-primary-500 hover:border-primary-700 dark:hover:border-primary-400 transition-colors shadow-sm hover:shadow-md md:col-span-2"
          >
            <div className="flex items-start gap-3 mb-3">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1.5">
                  VA Tools
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
        </div>

        {/* Featured Tools Section */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Popular Tools
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
            Get started quickly with our most-used tools
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featuredTools.map((tool) => (
              <ToolCard
                key={tool.path}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                path={tool.path}
                category={tool.category}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Value Propositions Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-12 mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Why Choose Devimuth Tools?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Client-Side Only</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                All processing happens locally in your browser. Your data never leaves your device, ensuring complete privacy and security.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">No Tracking</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                No analytics, no cookies, no data collection. We respect your privacy and don't monitor your usage or collect any personal information.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Open Source</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Free to use, modify, and distribute. Built by the community, for the community. Check out our source code and contribute.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Fast & Efficient</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Instant results without waiting for server responses. Process data quickly using modern web technologies and optimized algorithms.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Eye className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">No Account Required</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Start using tools immediately without registration or login. No barriers, no sign-ups—just instant access to all features.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Code className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Developer-Friendly</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Built with modern web standards. Clean interfaces, reliable tools, and extensive format support for all your development needs.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-12">
          <FAQ items={faqItems} />
        </div>
      </div>
    </>
  )
}

