import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title:'Département Économique & Entrepreneurial — État de San Andreas',
  description:"Plateforme gouvernementale de gestion économique et entrepreneuriale.",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased min-h-screen bg-gov-900">{children}</body>
    </html>
  )
}
