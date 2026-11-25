'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, ArrowRight, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LANDING_NAV_ITEMS } from '@/data/navigation';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-obsidian-950/90 backdrop-blur-xl border-b border-border shadow-2xl py-3.5'
          : 'bg-gradient-to-b from-obsidian-950/80 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-bright p-[1px] shadow-gold-sm group-hover:shadow-gold-md transition-shadow">
            <div className="w-full h-full bg-obsidian-950 rounded-[11px] flex items-center justify-center">
              <Scale className="w-4 h-4 text-gold-bright transition-transform group-hover:scale-110" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold-bright animate-ping" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base tracking-wider text-text-primary">
                CLAUSE<span className="text-gold-bright">X</span>
              </span>
              <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-gold-muted text-gold-bright border border-gold-champagne/30">
                AI
              </span>
            </div>
            <span className="text-[8.5px] text-text-muted tracking-widest uppercase">
              JUDGEBERT LMP
            </span>
          </div>
        </Link>

        {/* Focused Desktop Nav Links (Features, How It Works, Research) */}
        <nav className="hidden md:flex items-center gap-8">
          {LANDING_NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-xs uppercase tracking-wider text-text-secondary hover:text-gold-bright transition-colors font-medium"
            >
              {item.name}
            </a>
          ))}
        </nav>

        {/* Right Actions (Dashboard + Primary CTA) */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-gold-bright">
              Dashboard
            </Button>
          </Link>
          <Link href="/analyzer">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Analyze a Clause
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-gold-bright"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-dropdown border-b border-border px-6 py-5 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-3.5">
            {LANDING_NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-text-secondary hover:text-gold-bright py-1"
              >
                {item.name}
              </a>
            ))}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="md" className="w-full text-xs">
                  Dashboard
                </Button>
              </Link>
              <Link href="/analyzer" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full text-xs">
                  Analyze a Clause
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
