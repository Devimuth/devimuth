import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'purple' | 'primary'
  fontMono?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = 'primary', fontMono = false, className = '', ...props }, ref) => {
    const focusColor = variant === 'purple' ? 'focus:ring-purple-500' : 'focus:ring-primary-500'
    const monoClass = fontMono ? 'font-mono' : ''
    
    return (
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-offset-0 ${focusColor} ${monoClass} ${className}`}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea

