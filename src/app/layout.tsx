// src/app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { SidebarProvider } from './contexts/SidebarContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tethra DEX',
  description: 'Decentralized Exchange with Advanced Trading Features',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 3,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}