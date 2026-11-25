'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  User,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  actions?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  pageTitle,
  pageDescription,
  actions,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Generate title from pathname if not supplied
  const pathTitleMap: Record<string, string> = {
    '/dashboard': 'Research Dashboard Overview',
    '/analyzer': 'Clause Analyzer (Original vs Simplified)',
    '/change-explorer': 'Legal Change Explorer',
    '/documents': 'Document Workspace',
    '/history': 'Analysis History & Audit Log',
    '/research': 'Research Lab & Model Architecture',
    '/benchmarks': 'Evaluation Benchmarks',
    '/difficult-cases': 'Difficult Cases Library (16 Scenarios)',
    '/annotations': 'Human Annotation Workspace',
    '/settings': 'System Settings & Preferences',
  };

  const title = pageTitle || pathTitleMap[pathname] || 'ClauseX AI';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background flex flex-row">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-obsidian-950/80 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 h-full bg-obsidian-950">
              <Sidebar onToggleCollapse={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-16 px-4 sm:px-6 border-b border-border bg-obsidian-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-obsidian-900"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-text-primary truncate">{title}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-muted text-gold-bright border border-gold-champagne/30">
                    <ShieldCheck className="w-3 h-3 text-gold-bright" />
                    Demo Engine
                  </span>
                </div>
                {pageDescription && (
                  <p className="text-[11px] text-text-muted truncate hidden md:block">
                    {pageDescription}
                  </p>
                )}
              </div>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-2.5">
              {/* View Landing Page */}
              <Link href="/" target="_blank" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ExternalLink className="w-3 h-3" />}>
                  Landing
                </Button>
              </Link>

              {/* Simulated User Profile */}
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-obsidian-850 border border-gold-champagne/40 flex items-center justify-center text-gold-bright text-xs font-serif font-bold">
                  CX
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-medium text-text-primary leading-tight">Legal Fellow</span>
                  <span className="text-[10px] text-text-muted">Research Lab</span>
                </div>
              </div>

              {actions}
            </div>
          </header>

          {/* Subheader / Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
