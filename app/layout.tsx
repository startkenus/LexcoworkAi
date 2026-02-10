import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/command-palette';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LexCoworkAI - Legal AI Platform for India & USA | Contract Review & Compliance',
  description: 'LexCoworkAI is a legal-only, Cowork-class AI platform that helps founders, in-house teams, and legal professionals review contracts, draft policies, and run compliance checks with jurisdiction-aware guardrails.',
  keywords: [
    'LexCoworkAI',
    'legal AI platform',
    'AI legal assistant India',
    'AI legal assistant USA',
    'contract review AI',
    'legal RAG platform',
    'compliance AI',
    'DPDP AI',
    'CCPA AI',
    'GDPR compliance',
    'contract analysis',
    'legal document drafting',
    'jurisdiction-aware AI',
    'legal productivity',
  ],
  authors: [{ name: 'LexCoworkAI' }],
  metadataBase: new URL('https://lexcoworkai.com'),
  openGraph: {
    title: 'LexCoworkAI - Legal AI Platform for India & USA',
    description: 'Review contracts, draft policies, and run compliance checks with jurisdiction-aware guardrails and human-approved actions.',
    type: 'website',
    locale: 'en_US',
    siteName: 'LexCoworkAI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LexCoworkAI - Legal AI Platform',
    description: 'Legal-only AI platform for contract review, compliance, and policy drafting.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <CommandPalette />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
