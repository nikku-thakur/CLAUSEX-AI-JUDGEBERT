'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  ArrowRight,
  BookOpen,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const TOTAL_FRAMES = 192;
const FALLBACK_FRAME_INDEX = 50; // High-illumination showcase centerpiece frame

export const CinematicHero: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const lastDrawnImageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const currentFrameRef = useRef<number>(FALLBACK_FRAME_INDEX);
  const isPlayingRef = useRef<boolean>(true);
  const lastTimeRef = useRef<number>(0);
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
  const [debugFrame, setDebugFrame] = useState<number>(FALLBACK_FRAME_INDEX);

  // Check for explicit dev-only debug query parameter (?debug=frames)
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      window.location.search.includes('debug=frames')
    ) {
      setShowDevControls(true);
    }
  }, []);

  // Draw a frame to canvas with crisp DPI and cover aspect ratio
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use devicePixelRatio for crisp high-DPI rendering
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Cover mathematics
    const hRatio = displayWidth / img.width;
    const vRatio = displayHeight / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (displayWidth - img.width * ratio) / 2;
    const centerShiftY = (displayHeight - img.height * ratio) / 2;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw the cinematic scene with full illumination and contrast
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      centerShiftX,
      centerShiftY,
      img.width * ratio,
      img.height * ratio
    );

    ctx.restore();
    lastDrawnImageRef.current = img;
  }, []);

  // Preload frames and initiate playback
  useEffect(() => {
    let mounted = true;

    // Respect user's reduced-motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      isPlayingRef.current = false;
    }

    // 1. Immediately load the centerpiece showcase frame (Frame 50)
    const initialFrame = new Image();
    initialFrame.src = `/language-jpg/ezgif-frame-${String(FALLBACK_FRAME_INDEX).padStart(3, '0')}.jpg`;
    initialFrame.onload = () => {
      if (!mounted) return;
      imagesRef.current[FALLBACK_FRAME_INDEX - 1] = initialFrame;
      setIsReady(true);
      drawFrame(initialFrame);
    };
    initialFrame.onerror = () => {
      if (!mounted) return;
      setIsReady(true);
    };

    // 2. Preload remaining 191 frames in sequential batches for smooth streaming
    let currentBatchStart = 1;
    const batchSize = 16;

    const loadBatch = () => {
      if (!mounted || currentBatchStart > TOTAL_FRAMES) return;
      const end = Math.min(currentBatchStart + batchSize, TOTAL_FRAMES + 1);

      for (let i = currentBatchStart; i < end; i++) {
        if (i === FALLBACK_FRAME_INDEX) continue;
        const img = new Image();
        const paddedIndex = String(i).padStart(3, '0');
        img.src = `/language-jpg/ezgif-frame-${paddedIndex}.jpg`;

        img.onload = () => {
          if (!mounted) return;
          imagesRef.current[i - 1] = img;
        };
        img.onerror = () => {
          // Fallback to loaded centerpiece if a frame is missing
          if (!mounted) return;
          imagesRef.current[i - 1] = imagesRef.current[FALLBACK_FRAME_INDEX - 1] || null;
        };
      }

      currentBatchStart = end;
      if (currentBatchStart <= TOTAL_FRAMES) {
        setTimeout(loadBatch, 60);
      }
    };

    // Kick off progressive load
    setTimeout(loadBatch, 40);

    // 3. Smooth animation loop at 24 FPS
    const interval = 1000 / 24;

    const animate = (time: number) => {
      if (!isPlayingRef.current) return;

      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        const next = currentFrameRef.current >= TOTAL_FRAMES ? 1 : currentFrameRef.current + 1;
        currentFrameRef.current = next;

        const targetImg = imagesRef.current[next - 1];
        if (targetImg && targetImg.complete && targetImg.naturalWidth > 0) {
          drawFrame(targetImg);
        } else if (lastDrawnImageRef.current) {
          // Zero-flicker: maintain previous valid frame
          drawFrame(lastDrawnImageRef.current);
        }
      }
      animationFrameId.current = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) {
      animationFrameId.current = requestAnimationFrame(animate);
    }

    // Window resize handler
    const handleResize = () => {
      const currentImg =
        imagesRef.current[currentFrameRef.current - 1] ||
        imagesRef.current[FALLBACK_FRAME_INDEX - 1] ||
        lastDrawnImageRef.current;
      if (currentImg) drawFrame(currentImg);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [drawFrame]);

  return (
    <section className="relative min-h-[85vh] lg:min-h-[88vh] flex items-center justify-center overflow-hidden py-24 sm:py-28 border-b border-border/80">
      {/* 1. Cinematic Background Scene */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {/* Static Fallback Image behind canvas */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/language-jpg/ezgif-frame-050.jpg"
          alt="ClauseX AI Legal Tech"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: isReady ? 0 : 1 }}
        />

        {/* 192-Frame Canvas Animation - Full original brightness & contrast */}
        <canvas
          ref={canvasRef}
          className="relative w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: 1 }}
        />

        {/* Soft top blend into navbar */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background/70 to-transparent pointer-events-none" />

        {/* Soft bottom blend into Core Features section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/70 to-transparent pointer-events-none" />

        {/* Subtle radial gold glow behind center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-radial from-gold-bright/15 via-gold-champagne/5 to-transparent blur-3xl pointer-events-none" />
      </div>

      {/* 2. Focused Foreground Card (Transparent Glassmorphic Card) */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <div className="p-6 sm:p-10 rounded-3xl hero-glass-card relative space-y-6">
          {/* Top Trust / Research Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-muted/80 border border-gold-champagne/40 shadow-gold-sm">
            <Scale className="w-4 h-4 text-gold-bright" />
            <span className="text-xs font-semibold text-text-primary tracking-wide">
              JUDGEBERT <span className="text-gold-bright">Legal Meaning Preservation</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Headline with Gold Gradient */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-text-primary leading-[1.12] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Legal Language.{' '}
              <span className="text-gold-gradient block sm:inline">Preserved Meaning.</span>
            </h1>
            <p className="text-sm sm:text-base text-text-secondary font-sans max-w-xl mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              Explore whether simplified legal language preserves the obligations, conditions,
              exceptions, and intent of the original English clause.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link href="/analyzer" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-sm shadow-gold-md hover:scale-105"
                leftIcon={<Sparkles className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Analyze a Clause
              </Button>
            </Link>

            <Link href="/research" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto text-sm border-gold-champagne/30"
                leftIcon={<BookOpen className="w-4 h-4 text-gold-champagne" />}
              >
                Explore the Research
              </Button>
            </Link>
          </div>

          {/* Trust / Context Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-primary font-medium py-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              <Languages className="w-3.5 h-3.5 text-gold-bright shrink-0" />
              <span>English Legal Text</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-primary font-medium py-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              <Sparkles className="w-3.5 h-3.5 text-gold-bright shrink-0" />
              <span>Explainable AI</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-primary font-medium py-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              <BookOpen className="w-3.5 h-3.5 text-gold-bright shrink-0" />
              <span>Research-Oriented</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-primary font-medium py-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              <Scale className="w-3.5 h-3.5 text-gold-bright shrink-0" />
              <span>Human Review</span>
            </div>
          </div>
        </div>

        {/* 3. Dev-Only Diagnostics (Completely hidden unless ?debug=frames in local dev) */}
        {showDevControls && (
          <div className="mt-4 inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-obsidian-950/90 border border-gold-champagne/20 text-[11px] font-mono text-gold-champagne">
            <span>Dev Debug: Frame {debugFrame} / {TOTAL_FRAMES}</span>
            <input
              type="range"
              min="1"
              max={TOTAL_FRAMES}
              value={debugFrame}
              onChange={(e) => {
                const f = parseInt(e.target.value, 10);
                setDebugFrame(f);
                currentFrameRef.current = f;
                const img = imagesRef.current[f - 1];
                if (img) drawFrame(img);
              }}
              className="w-24 accent-gold-champagne"
            />
          </div>
        )}
      </div>
    </section>
  );
};
