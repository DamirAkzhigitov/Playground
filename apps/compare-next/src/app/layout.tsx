import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers/Providers'
import { EN } from '@/i18n/messages'
import { getSiteUrl, SITE_NAME } from '@/lib/site'
import '@/styles/index.scss'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

const siteDescription = EN['catalogue.subtitle']
const defaultTitle = `${SITE_NAME} — product comparisons`

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE_NAME}`
  },
  description: siteDescription,
  icons: {
    icon: '/favicon.svg'
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: defaultTitle,
    description: siteDescription
  },
  twitter: {
    card: 'summary',
    title: defaultTitle,
    description: siteDescription
  },
  alternates: {
    canonical: '/'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
