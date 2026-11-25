'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sparkles,
  RotateCcw,
  Download,
  ShieldCheck,
  Eye,
  Sliders,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LocalStorageService, UserSettings, DEFAULT_USER_SETTINGS } from '@/lib/storage/local-storage';
import { useToast } from '@/components/ui/Toast';
import { downloadJson } from '@/lib/export/export-utils';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loaded = LocalStorageService.getSettings();
    setSettings(loaded);
  }, []);

  const handleUpdate = (updated: Partial<UserSettings>) => {
    const newSettings = LocalStorageService.saveSettings(updated);
    setSettings(newSettings);
    toast({
      type: 'success',
      title: 'Preferences Updated',
      message: 'Your system settings have been saved.',
    });
  };

  const handleResetData = () => {
    LocalStorageService.resetAll();
    setSettings(DEFAULT_USER_SETTINGS);
    setConfirmResetOpen(false);
    toast({
      type: 'info',
      title: 'Storage Cleared',
      message: 'Browser storage reset to factory default demonstration data.',
    });
  };

  const handleBackupAllData = () => {
    const fullBackup = {
      settings: LocalStorageService.getSettings(),
      history: LocalStorageService.getHistory(),
      annotations: LocalStorageService.getAnnotations(),
      exportedAt: new Date().toISOString(),
    };
    downloadJson(fullBackup, 'clausex-full-backup.json');
    toast({
      type: 'success',
      title: 'Backup Created',
      message: 'Downloaded complete workspace state as JSON.',
    });
  };

  return (
    <AppShell
      pageTitle="System Settings & Research Configuration"
      pageDescription="Customize interface preferences, export parameters, and local demo storage."
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Section 1: Visual & Interface Ergonomics */}
        <Card variant="glass" className="p-6 border-border space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <Sliders className="w-5 h-5 text-gold-bright" />
            <h3 className="font-serif font-bold text-base text-text-primary">
              Interface Ergonomics & Accessibility
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian-950 border border-border">
              <div>
                <span className="font-semibold text-text-primary block">Reduced Motion Mode</span>
                <span className="text-[11px] text-text-muted">
                  Suppresses hero particle animations and smooth floating transitions.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ reducedMotion: !settings.reducedMotion })}
                className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                  settings.reducedMotion ? 'bg-gold-bright' : 'bg-obsidian-800 border border-border'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-obsidian-950 transition-transform ${
                    settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* High Contrast Borders Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian-950 border border-border">
              <div>
                <span className="font-semibold text-text-primary block">High Contrast Golden Borders</span>
                <span className="text-[11px] text-text-muted">
                  Increases border opacity across glassmorphism panels for greater legibility.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdate({ highContrastBorders: !settings.highContrastBorders })}
                className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                  settings.highContrastBorders ? 'bg-gold-bright' : 'bg-obsidian-800 border border-border'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-obsidian-950 transition-transform ${
                    settings.highContrastBorders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Default Analyzer View */}
            <div>
              <label className="font-semibold text-text-secondary block mb-1.5">
                Default Analyzer Comparison Layout:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleUpdate({ defaultAnalysisLayout: 'side-by-side' })}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-colors ${
                    settings.defaultAnalysisLayout === 'side-by-side'
                      ? 'bg-gold-muted text-gold-bright border-gold-champagne/40 font-semibold'
                      : 'bg-obsidian-950 text-text-secondary border-border'
                  }`}
                >
                  Side-by-Side (Desktop Optimal)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdate({ defaultAnalysisLayout: 'stacked' })}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-colors ${
                    settings.defaultAnalysisLayout === 'stacked'
                      ? 'bg-gold-muted text-gold-bright border-gold-champagne/40 font-semibold'
                      : 'bg-obsidian-950 text-text-secondary border-border'
                  }`}
                >
                  Stacked (Mobile Friendly)
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Demo Storage & Data Controls */}
        <Card variant="glass" className="p-6 border-border space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <RotateCcw className="w-5 h-5 text-gold-bright" />
            <h3 className="font-serif font-bold text-base text-text-primary">
              Browser Storage & Workspace Data
            </h3>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed">
            All analysis history, human annotations, and settings are stored locally in your
            browser session. You can backup your entire data file or reset back to initial research seeds.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="w-4 h-4 text-gold-bright" />}
              onClick={handleBackupAllData}
            >
              Download Complete Workspace JSON
            </Button>

            <Button
              variant="danger"
              size="md"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setConfirmResetOpen(true)}
            >
              Reset to Factory Demo Seeds
            </Button>
          </div>
        </Card>

        {/* Section 4: Privacy & Ethics Statement */}
        <Card variant="subtle" className="p-6 border-border space-y-3 text-xs text-text-secondary">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Academic Research Prototype Notice & Data Handling</span>
          </div>
          <p className="leading-relaxed">
            ClauseX AI is an experimental AI research application designed to support informed legal
            meaning evaluation using JUDGEBERT. It is not an attorney and does not provide legal
            advice. All client-side text comparisons run locally in browser memory.
          </p>
        </Card>

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={confirmResetOpen}
          onClose={() => setConfirmResetOpen(false)}
          title="Reset Local Demo Data?"
          description="This will clear your local analysis history, annotations, and custom settings."
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-text-secondary">
              Default illustrative sample cases and gold-standard benchmarks will be restored.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmResetOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleResetData}>
                Confirm Reset
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
