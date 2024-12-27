import './globals.css'
import type { Metadata } from 'next'
import { SavedProvider } from './saved/SavedContext'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: 'Code Gems',
  description: 'Discover remarkable GitHub projects',
  keywords: 'github, projects, code, gems, programming',
  icons: {
    icon: 'https://cdn.discordapp.com/attachments/1019356251106324496/1322312765750120529/page-removebg-preview.png?ex=67706b3a&is=676f19ba&hm=70bc100b33421611e3a10e036428833a8d3baeb85d251331a2104b76a169c08d&'
  },
};


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
