import { useEffect, useRef, useState } from 'react'
import { useDarkMode } from '../../hooks/useDarkMode'

interface Dot {
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  vx: number
  vy: number
}

interface AnimatedDotBackgroundProps {
  dotSpacing?: number
  repulsionRadius?: number
  repulsionStrength?: number
}

export default function AnimatedDotBackground({
  dotSpacing = 40,
  repulsionRadius = 120,
  repulsionStrength = 0.15,
}: AnimatedDotBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const dotsRef = useRef<Dot[]>([])
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const { isDark } = useDarkMode()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Initialize dots in a grid pattern
  const initializeDots = (width: number, height: number): Dot[] => {
    const dots: Dot[] = []
    const cols = Math.ceil(width / dotSpacing) + 1
    const rows = Math.ceil(height / dotSpacing) + 1

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const x = j * dotSpacing + (dotSpacing / 2)
        const y = i * dotSpacing + (dotSpacing / 2)
        const size = 2 + Math.random() * 2 // 2-4px

        dots.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size,
          vx: 0,
          vy: 0,
        })
      }
    }

    return dots
  }

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Initialize dots when canvas size changes
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      dotsRef.current = initializeDots(canvasSize.width, canvasSize.height)
    }
  }, [canvasSize.width, canvasSize.height, dotSpacing])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const animate = () => {
      if (!ctx || canvasSize.width === 0 || canvasSize.height === 0) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set dot color based on dark mode
      const dotColor = isDark ? 'rgba(156, 163, 175, 0.4)' : 'rgba(107, 114, 128, 0.4)' // gray-400 in dark, gray-500 in light
      ctx.fillStyle = dotColor

      const dots = dotsRef.current
      const mouse = mouseRef.current

      // Update and draw each dot
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]

        // Apply repulsion from mouse if within radius
        if (mouse) {
          const dx = dot.x - mouse.x
          const dy = dot.y - mouse.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < repulsionRadius && distance > 0) {
            // Normalize direction vector
            const normalizedX = dx / distance
            const normalizedY = dy / distance

            // Calculate repulsion force (stronger when closer)
            const force = (1 - distance / repulsionRadius) * repulsionStrength

            // Apply velocity
            dot.vx += normalizedX * force * 50
            dot.vy += normalizedY * force * 50
          }
        }

        // Apply friction
        dot.vx *= 0.85
        dot.vy *= 0.85

        // Update position
        dot.x += dot.vx
        dot.y += dot.vy

        // Spring back to base position
        const springX = (dot.baseX - dot.x) * 0.05
        const springY = (dot.baseY - dot.y) * 0.05
        dot.vx += springX
        dot.vy += springY

        // Draw dot pixel by pixel
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [canvasSize, isDark, repulsionRadius, repulsionStrength])

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      }
    }

    const handleMouseLeave = () => {
      mouseRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}

