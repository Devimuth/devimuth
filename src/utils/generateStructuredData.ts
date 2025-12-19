export interface ToolStructuredData {
  name: string
  description: string
  url: string
  applicationCategory: string
}

export function generateToolStructuredData(tool: ToolStructuredData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: tool.url,
    applicationCategory: tool.applicationCategory,
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Devimuth Tools',
    description: 'Free, client-side GIS and developer utilities',
    url: window.location.origin,
  }
}

