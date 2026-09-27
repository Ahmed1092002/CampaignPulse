import { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import './styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CampaignPulse - Campaign Analytics & Lead Management',
  description: 'Multi-tenant campaign analytics and lead-management platform for marketing teams',
  keywords: ['campaign', 'analytics', 'leads', 'marketing', 'SaaS', 'landing page'],
  authors: [{ name: 'CampaignPulse' }],
  creator: 'CampaignPulse',
  publisher: 'CampaignPulse',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://campaignpulse.com',
    siteName: 'CampaignPulse',
    title: 'CampaignPulse - Campaign Analytics & Lead Management',
    description: 'Multi-tenant campaign analytics and lead-management platform for marketing teams',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CampaignPulse',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampaignPulse',
    description: 'Multi-tenant campaign analytics and lead-management platform',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${notoSansArabic.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}