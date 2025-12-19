import { Link } from 'react-router-dom'
import { Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Devimuth Tools
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Free, client-side GIS and developer utilities. All processing happens in your browser.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/coordinate-converter" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  GIS Tools
                </Link>
              </li>
              <li>
                <Link to="/json-csv-converter" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  Developer Tools
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Built with <Heart className="inline h-4 w-4 text-red-500" /> by Devimuth Software & GIS Developer
            </p>
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Github className="h-5 w-5" />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Devimuth Tools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

