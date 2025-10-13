import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'SiifMart Admin',
  description: 'Grocery Store Management',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="emerald">
      <body className="min-h-dvh bg-base-100 text-base-content">
        <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-50">
          <div className="flex-1 px-2 font-bold">SiifMart Admin</div>
        </div>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
