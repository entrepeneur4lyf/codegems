import './globals.css'
import type { Metadata } from 'next'
import { SavedProvider } from './saved/SavedContext'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import { SpeedInsights } from "@vercel/speed-insights/next"
import DiscordPromo from '@/components/DiscordPromo'; 

export const metadata: Metadata = {
  title: 'Code Gems',
  description: 'Welcome to Code Gems - a community-driven platform for discovering and sharing remarkable GitHub projects! The heart of Code Gems is YOU - developers, designers, and tech enthusiasts who know about amazing open-source projects that deserve more visibility.',
  keywords: ['github', 'projects', 'code', 'gems', 'programming'],
  icons: {
    icon: [
      {
        url: '/icon.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: 'Code Gems',
    description: 'Welcome to Code Gems - a community-driven platform for discovering and sharing remarkable GitHub projects! The heart of Code Gems is YOU - developers, designers, and tech enthusiasts who know about amazing open-source projects that deserve more visibility.',
    type: 'website',
  },
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
          <DiscordPromo />
          <Footer />
          <Toaster />
          <Analytics />
          <SpeedInsights/>
      </body>
    </html>
  )
}
