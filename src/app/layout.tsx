import type { Metadata } from 'next'
import { AuthProvider } from '../lib/auth'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Quantify Engenharia',
  description: 'Orçamentos de engenharia com inteligência artificial',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
