import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#08090D',
};

export const metadata: Metadata = {
  title: 'ClauseX AI — Explainable English Legal Meaning Preservation Using JUDGEBERT',
  description:
    'Research prototype and explainable evaluation platform for investigating whether simplified English legal text preserves the essential obligations, conditions, and intent of the original.',
  keywords: [
    'Legal Meaning Preservation',
    'JUDGEBERT',
    'Explainable AI',
    'Legal NLP',
    'Deontic Modality',
    'Contract Simplification',
  ],
  authors: [{ name: 'ClauseX Research Team' }],
  openGraph: {
    title: 'ClauseX AI — Explainable English Legal Meaning Preservation',
    description:
      'Investigate whether simplified legal text preserves original obligations, conditions, and legal intent using explainable AI.',
    type: 'website',
  },
};

import { SettingsApplier } from '@/components/layout/SettingsApplier';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem('clausex_user_settings');
                if (s) {
                  var p = JSON.parse(s);
                  if (p.highContrastBorders) document.documentElement.classList.add('high-contrast-borders');
                  if (p.reducedMotion) document.documentElement.classList.add('reduced-motion');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-text-primary antialiased selection:bg-gold-champagne/30 selection:text-gold-bright">
        <SettingsApplier />
        {children}
      </body>
    </html>
  );
}

