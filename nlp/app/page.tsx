import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CinematicHero } from '@/components/landing/CinematicHero';
import { CoreFeaturesCompact } from '@/components/landing/CoreFeaturesCompact';
import { HowItWorksCompact } from '@/components/landing/HowItWorksCompact';
import { InteractivePreviewCompact } from '@/components/landing/InteractivePreviewCompact';
import { ResearchPreviewCompact } from '@/components/landing/ResearchPreviewCompact';
import { FinalCtaCompact } from '@/components/landing/FinalCtaCompact';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* 1. Cinematic Hero with Visible 192-Frame Canvas Animation */}
        <CinematicHero />

        {/* 2. Core Features: 4 Compact Cards */}
        <CoreFeaturesCompact />

        {/* 3. How It Works: 4 Concise Steps */}
        <HowItWorksCompact />

        {/* 4. Interactive Preview: Original vs Simplified Clause */}
        <InteractivePreviewCompact />

        {/* 5. Research Preview: Methodology & Illustrative Benchmarks */}
        <ResearchPreviewCompact />

        {/* 6. Final CTA with Responsible Use Disclaimer */}
        <FinalCtaCompact />
      </main>

      <Footer />
    </div>
  );
}
