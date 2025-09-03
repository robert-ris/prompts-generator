import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {AuthProvider} from '@/lib/auth/AuthProvider';
import {SessionExpiryNotification} from '@/components/auth/SessionExpiryNotification';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Prompt Builder',
  description:
    'Create, manage, and improve AI prompts with intelligent assistance',
  keywords: ['AI', 'prompts', 'builder', 'templates', 'productivity'],
  authors: [{name: 'AI Prompt Builder Team'}],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <SessionExpiryNotification />
        </AuthProvider>
      </body>
    </html>
  );
}
