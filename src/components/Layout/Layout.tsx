import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import { Toaster } from 'react-hot-toast'
import AnimatedDotBackground from '../AnimatedDotBackground/AnimatedDotBackground'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <AnimatedDotBackground />
      <Header />
      <main className="flex-grow relative z-10">
        {children}
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  )
}

