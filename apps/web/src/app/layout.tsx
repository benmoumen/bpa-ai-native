import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import { SessionProvider } from '@/components';
import { QueryProvider } from '@/lib/query-client';
import './globals.css';

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BPA Service Designer',
  description: 'AI-Native Business Process Application Designer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lexend.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <SessionProvider>{children}</SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
