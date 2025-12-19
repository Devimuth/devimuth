import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Generate FAQPage structured data for SEO
  useEffect(() => {
    const faqStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    }

    let script = document.querySelector('script[data-faq-schema]')
    if (!script) {
      script = document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      script.setAttribute('data-faq-schema', 'true')
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(faqStructuredData)

    return () => {
      // Cleanup on unmount
      const faqScript = document.querySelector('script[data-faq-schema]')
      if (faqScript) {
        faqScript.remove()
      }
    }
  }, [items])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleItem(index)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="font-semibold text-gray-900 dark:text-white pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                    isOpen ? 'transform rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-hidden={!isOpen}
              >
                <div className="px-5 pb-4 pt-0">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

