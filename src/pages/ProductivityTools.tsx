import { Search, Users, ArrowLeft, Keyboard, ClipboardList, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEO/SEOHead'
import ToolCard from '../components/ToolCard/ToolCard'

const productivityTools = [
  {
    title: 'Typing Test',
    description: 'Measure your typing speed (WPM) and accuracy with customizable test durations and text samples.',
    icon: Keyboard,
    path: '/typing-test',
  },
  {
    title: 'Skills Assessment Generator',
    description: 'Create customizable assessment forms for evaluating virtual assistant skills with multiple question types.',
    icon: ClipboardList,
    path: '/skills-assessment-generator',
  },
  {
    title: 'Communication Test',
    description: 'Test your professional communication skills by responding to email scenarios. Get instant feedback on grammar, tone, clarity, and appropriateness.',
    icon: MessageSquare,
    path: '/communication-test',
  },
]

export default function ProductivityTools() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = productivityTools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <SEOHead
        title="Productivity Tools - Devimuth"
        description="Productivity and automation tools for professionals."
        keywords="productivity tools, automation"
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
            <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              Productivity Tools
            </h1>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
            Productivity and automation tools for professionals.
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

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No tools found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Try adjusting your search query to find the tool you're looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => (
              <ToolCard
                key={tool.path}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                path={tool.path}
                category="productivity"
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

