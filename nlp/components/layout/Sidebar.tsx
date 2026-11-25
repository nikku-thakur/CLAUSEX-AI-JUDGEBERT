'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scale,
  ShieldAlert,
  FileText,
  History,
  FlaskConical,
  BarChart3,
  BookOpen,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { APP_NAV_ITEMS } from '@/data/navigation';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4 shrink-0" />,
  Scale: <Scale className="w-4 h-4 shrink-0" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4 shrink-0" />,
  FileText: <FileText className="w-4 h-4 shrink-0" />,
  History: <History className="w-4 h-4 shrink-0" />,
  FlaskConical: <FlaskConical className="w-4 h-4 shrink-0" />,
  BarChart3: <BarChart3 className="w-4 h-4 shrink-0" />,
  BookOpen: <BookOpen className="w-4 h-4 shrink-0" />,
  CheckSquare: <CheckSquare className="w-4 h-4 shrink-0" />,
  Settings: <Settings className="w-4 h-4 shrink-0" />,
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const pathname = usePathname();

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggle = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  return (
    <aside
      className={cn(
        'relative h-screen sticky top-0 z-40 bg-obsidian-950/95 border-r border-border transition-all duration-300 flex flex-col justify-between select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Top Header & Logo */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-deep via-gold-champagne to-gold-bright p-[1px] shrink-0">
              <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
                <Scale className="w-4 h-4 text-gold-bright" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-serif font-bold text-sm tracking-wider text-text-primary">
                  CLAUSE<span className="text-gold-bright">X</span>
                </span>
                <span className="text-[9px] text-text-muted tracking-widest uppercase">
                  JUDGEBERT Research
                </span>
              </div>
            )}
          </Link>

          {/* Collapse button */}
          <button
            onClick={toggle}
            className="p-1 rounded-lg text-text-muted hover:text-gold-bright hover:bg-obsidian-850 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-3">
          <Link href="/analyzer">
            <button
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-deep via-gold-champagne to-gold-bright text-obsidian-950 font-semibold shadow-gold-sm hover:shadow-gold-md transition-all py-2.5 px-3 text-xs',
                isCollapsed && 'px-0'
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              {!isCollapsed && <span>New Analysis</span>}
            </button>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="px-2.5 space-y-1 py-1">
          {APP_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gold-muted text-gold-bright border border-gold-champagne/30 shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-obsidian-900',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <span
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-gold-bright' : 'text-text-muted group-hover:text-gold-champagne'
                  )}
                >
                  {iconMap[item.iconName] || <Scale className="w-4 h-4" />}
                </span>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded bg-obsidian-800 text-gold-champagne border border-gold-champagne/20 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Model & System Status Card */}
      <div className="p-3 border-t border-border">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-obsidian-900/90 border border-gold-champagne/20 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-bright opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-champagne" />
                </span>
                <span className="text-[10px] font-semibold text-text-primary">Demo Heuristic Mode</span>
              </div>
              <span className="text-[9px] px-1 py-0.2 rounded bg-gold-champagne/20 text-gold-bright font-mono">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-text-muted leading-tight">
              Deterministic rule engine active. Offline research simulation.
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="Deterministic Demo Engine Active">
            <div className="w-8 h-8 rounded-lg bg-obsidian-900 border border-gold-champagne/30 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-gold-bright" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
