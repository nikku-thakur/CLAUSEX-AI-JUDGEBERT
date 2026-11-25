'use client';

import { useEffect } from 'react';
import { LocalStorageService, applySettingsToDOM } from '@/lib/storage/local-storage';

export function SettingsApplier() {
  useEffect(() => {
    // Apply on client mount
    applySettingsToDOM();

    const handleSettingsUpdate = () => {
      applySettingsToDOM();
    };

    window.addEventListener('clausex_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    return () => {
      window.removeEventListener('clausex_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  return null;
}
