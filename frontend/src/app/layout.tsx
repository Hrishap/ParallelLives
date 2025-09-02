import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ReactQueryProvider } from '../lib/providers/ReactQueryProvider';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});


export const metadata: Metadata = {
  title: 'ParallelLives - AI What If Life Simulator',
  description: 'Explore alternate life paths with AI-powered storytelling and real-world data',
  keywords: ['AI', 'life simulator', 'career planning', 'what if scenarios'],
  authors: [{ name: 'ParallelLives Team' }],
  openGraph: {
    title: 'ParallelLives - AI What If Life Simulator',
    description: 'Explore alternate life paths with AI-powered storytelling and real-world data',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ParallelLives - AI What If Life Simulator',
    description: 'Explore alternate life paths with AI-powered storytelling and real-world data',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased"  style={{ fontFamily: "'Cal Sans', var(--font-inter), sans-serif" }}>

        <ReactQueryProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ReactQueryProvider>
      </body>
    </html>
  );
}