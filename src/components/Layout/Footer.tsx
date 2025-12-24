import { Link } from 'react-router-dom'
import { Github, MapPin, Code, Users, TrendingUp, HelpCircle, Bug, Lightbulb } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Devimuth Tools
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              Free, client-side GIS and developer utilities. All processing happens in your browser—no data leaves your device.
            </p>
            <a
              href="https://github.com/Devimuth"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Github className="h-5 w-5" />
              <span>GitHub</span>
            </a>
          </div>
          
          {/* Navigation Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/tools" 
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  All Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Tool Categories Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tool Categories
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/gis-tools" 
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gis-600 dark:hover:text-gis-400 transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span>GIS Tools</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/dev-tools" 
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-dev-600 dark:hover:text-dev-400 transition-colors"
                >
                  <Code className="h-4 w-4" />
                  <span>Dev Tools</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/productivity-tools" 
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  <span>Productivity Tools</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/marketing-tools" 
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Marketing Tools</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Devimuth/devimuth/blob/main/Readme.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Devimuth/devimuth/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  <span>Report Bug</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Devimuth/devimuth/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Lightbulb className="h-4 w-4" />
                  <span>Feature Request</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Devimuth Tools. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

