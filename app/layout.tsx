import './globals.css'
import type { Metadata } from 'next'
import { SavedProvider } from './saved/SavedContext'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Code Gems',
  description: 'Discover remarkable GitHub projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) { 
  return (
    <html lang="en">
      
      <body>
      <Navbar />
        <SavedProvider>
          {children}
          </SavedProvider>
          <Footer />
      </body>
    </html>
  )
}
