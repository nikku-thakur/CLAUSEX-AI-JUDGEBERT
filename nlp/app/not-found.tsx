import React from 'react';
import Link from 'next/link';
import { Scale, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full glass-panel-gold rounded-2xl p-8 border border-gold-champagne/30 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-obsidian-950 border border-gold-champagne/40 flex items-center justify-center mx-auto text-gold-bright shadow-gold-sm">
          <Scale className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-mono tracking-widest text-gold-champagne">
            Error 404 • Clause Non-Existent
          </span>
          <h1 className="text-3xl font-serif font-bold text-text-primary">
            Page Not Found
          </h1>
          <p className="text-xs text-text-secondary leading-relaxed">
            The legal analysis route or document segment you requested could not be located in the
            ClauseX AI registry.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
              Return Home
            </Button>
          </Link>
          <Link href="/analyzer" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
              Open Clause Analyzer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
