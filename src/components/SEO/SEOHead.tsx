import { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
}

export default function SEOHead({
  title = 'Devimuth Tools - Free GIS & Developer Utilities',
  description = 'Free, client-side GIS and developer tools. Coordinate converter, GeoJSON visualizer, JSON/CSV converter, JWT decoder, and more.',
  keywords = 'GIS tools, developer tools, coordinate converter, GeoJSON, WKT, JSON converter, CSV converter, JWT decoder',
  canonical,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)
    updateMetaTag('og:title', title, 'property')
    updateMetaTag('og:description', description, 'property')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)

    // Update canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]')
      if (!canonicalLink) {
        canonicalLink = document.createElement('link')
        canonicalLink.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalLink)
      }
      canonicalLink.setAttribute('href', canonical)
    }

    // Add structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      description: description,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    }

    let script = document.querySelector('script[type="application/ld+json"]')
    if (!script) {
      script = document.createElement('script')
      script.setAttribute('type', 'application/ld+json')
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(structuredData)
  }, [title, description, keywords, canonical])

  return null
}

