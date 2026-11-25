import React from 'react';
import Link from 'next/link';
import { Scale, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-obsidian-950 text-text-secondary pt-14 pb-10 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-deep to-gold-bright p-[1px]">
                <div className="w-full h-full bg-obsidian-950 rounded-[7px] flex items-center justify-center">
                  <Scale className="w-4 h-4 text-gold-bright" />
                </div>
              </div>
              <span className="font-serif font-bold text-base text-text-primary tracking-wider">
                CLAUSE<span className="text-gold-bright">X</span> AI
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              Explainable English Legal Meaning Preservation (LMP) using JUDGEBERT. An academic
              research initiative dedicated to safeguarding legal intent in simplified legal text.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold-muted text-gold-bright border border-gold-champagne/30">
                Research Prototype v1.0
              </span>
            </div>
          </div>

          {/* Dedicated Tools Navigation */}
          <div>
            <h4 className="text-xs font-serif font-semibold text-gold-bright uppercase tracking-wider mb-3">
              Application Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/analyzer" className="hover:text-gold-bright transition-colors">
                  Clause Analyzer
                </Link>
              </li>
              <li>
                <Link href="/change-explorer" className="hover:text-gold-bright transition-colors">
                  Legal Change Explorer
                </Link>
              </li>
              <li>
                <Link href="/difficult-cases" className="hover:text-gold-bright transition-colors">
                  Difficult Cases Library
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-gold-bright transition-colors">
                  Document Workspace
                </Link>
              </li>
              <li>
                <Link href="/annotations" className="hover:text-gold-bright transition-colors">
                  Human Annotation Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Research & Configuration */}
          <div>
            <h4 className="text-xs font-serif font-semibold text-gold-bright uppercase tracking-wider mb-3">
              Research & Science
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/research" className="hover:text-gold-bright transition-colors">
                  JUDGEBERT Architecture
                </Link>
              </li>
              <li>
                <Link href="/benchmarks" className="hover:text-gold-bright transition-colors">
                  Evaluation Benchmarks
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-gold-bright transition-colors">
                  Analysis History & Logs
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-gold-bright transition-colors">
                  Settings & Data Reset
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-gold-bright transition-colors">
                  Research Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted">
          <span>© {new Date().getFullYear()} ClauseX AI Research. Built with Obsidian Gold Design System.</span>
          <span>Academic Prototype • Not Legal Advice</span>
        </div>
      </div>
    </footer>
  );
};
