// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'הזמנת שולחנות',
  description: 'מערכת הזמנת שולחנות',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.variable} font-sans bg-surface-0 text-white antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a1a1a', border: '1px solid #3a3a3a', color: '#fff' },
          }}
        />
      </body>
    </html>
  )
}
