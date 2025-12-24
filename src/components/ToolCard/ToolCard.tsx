import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'

interface ToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  path: string
  category: 'gis' | 'dev' | 'productivity' | 'marketing'
}

export default function ToolCard({ title, description, icon: Icon, path, category }: ToolCardProps) {
  const categoryStyles = {
    gis: 'border-l-4 border-gis-600 dark:border-gis-500 hover:border-gis-700 dark:hover:border-gis-400',
    dev: 'border-l-4 border-dev-600 dark:border-dev-500 hover:border-dev-700 dark:hover:border-dev-400',
    productivity: 'border-l-4 border-primary-600 dark:border-primary-500 hover:border-primary-700 dark:hover:border-primary-400',
    marketing: 'border-l-4 border-purple-600 dark:border-purple-500 hover:border-purple-700 dark:hover:border-purple-400',
  }

  const iconColors = {
    gis: 'text-gis-600 dark:text-gis-400',
    dev: 'text-dev-600 dark:text-dev-400',
    productivity: 'text-primary-600 dark:text-primary-400',
    marketing: 'text-purple-600 dark:text-purple-400',
  }

  return (
    <Link
      to={path}
      className={`group block p-5 bg-white dark:bg-gray-800 ${categoryStyles[category]} transition-colors shadow-sm hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColors[category]}`}>
          <Icon className="h-5 w-5 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 group-hover:underline">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}

