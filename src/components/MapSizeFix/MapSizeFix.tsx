import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * MapSizeFix component - Only use this when maps are inside tabs, modals, or hidden containers.
 * For regular pages with explicit pixel heights, this component is not needed.
 */
export default function MapSizeFix() {
  const map = useMap()

  useEffect(() => {
    // Call invalidateSize when map is ready and on window resize
    const invalidateSize = () => {
      try {
        map.invalidateSize(false)
      } catch (error) {
        console.error('Error invalidating map size:', error)
      }
    }

    // Invalidate when map is ready
    map.whenReady(() => {
      setTimeout(invalidateSize, 100)
    })

    // Handle window resize
    const handleResize = () => {
      invalidateSize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [map])

  return null
}

