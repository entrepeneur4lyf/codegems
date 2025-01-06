import './globals.css'
import type { Metadata } from 'next'
import { SavedProvider } from './saved/SavedContext'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Analytics } from "@vercel/analytics/react"
import BuyMeACoffeeWidget from "@/components/BuyMeACoffeeWidget";

export const metadata: Metadata = {
  title: 'Code Gems',
  description: 'Discover remarkable GitHub projects',
  keywords: ['github', 'projects', 'code', 'gems', 'programming'],
  icons: {
    icon: [
      {
        url: 'https://media.discordapp.net/attachments/1019356251106324496/1322312765750120529/page-removebg-preview.png?ex=677c48ba&is=677af73a&hm=4e2d042a1355aa5cd578ef86a0c4a81a49f7de1d35b72dc64885df23d8778bc3&=&format=webp&quality=lossless',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
  },
  openGraph: {
    title: 'Code Gems',
    description: 'Discover remarkable GitHub projects',
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
        <BuyMeACoffeeWidget 
        id="bebedi"
        color="#BD5FFF"
        xMargin={18}
        yMargin={18}
      />
          <Footer />
          <Analytics />
      </body>
    </html>
  )
}
