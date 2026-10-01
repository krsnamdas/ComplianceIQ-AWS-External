import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Globe,
  Radio,
  Search,
  ChevronRight,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HeroGraphicBannerProps {
  onSelectRegion?: (region: string) => void;
  onOpenRegistry?: () => void;
  onOpenHeatmap?: () => void;
  onOpenCrosswalk?: () => void;
}

export const HeroGraphicBanner: React.FC<HeroGraphicBannerProps> = ({
  onSelectRegion,
  onOpenRegistry,
  onOpenHeatmap,
  onOpenCrosswalk,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 overflow-hidden transition-all duration-300">
      {/* Background Subtle Grid & Radar SVG Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#radar-grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {/* Top Mini HUD Status Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>MENAT REGULATORY TELEMETRY ACTIVE</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">LAT 24.71° N • LON 46.67° E</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">24 OFFICIAL GAZETTES MONITORED</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden lg:inline px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 font-bold">
              VERIFIED STATUTORY ENGINE
            </span>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={isMinimized ? 'Expand Graphic Banner' : 'Collapse Graphic Banner'}
            >
              {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Main Graphic & Typographic Showcase */}
        {!isMinimized && (
          <div className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Typographic Title & Identity */}
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>MIDDLE EAST • NORTH AFRICA • SAHEL • TÜRKİYE</span>
              </div>

              {/* Bold Typographic Title with Styled Subtext */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
                  COMPLIANCE<span className="text-cyan-400">IQ</span>
                  <span className="text-slate-500 font-light mx-2">/</span>
                  <span className="text-slate-300 font-semibold text-lg sm:text-2xl md:text-3xl">
                    REGULATORY OBSERVATORY
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                  Unified statutory repository &amp; cross-border controls crosswalk. Real-time statutory tracking, 
                  NIST CSF &amp; ISO 27001 mapping, and compliance maturity indexing across 24 sovereign jurisdictions.
                </p>
              </div>

              {/* Regional Quick Links Pills */}
              {onSelectRegion && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">Quick Scope:</span>
                  <button
                    onClick={() => onSelectRegion('GCC')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-white transition-all text-[11px] font-medium cursor-pointer"
                  >
                    GCC (6)
                  </button>
                  <button
                    onClick={() => onSelectRegion('Middle East')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-white transition-all text-[11px] font-medium cursor-pointer"
                  >
                    Levant &amp; ME (14)
                  </button>
                  <button
                    onClick={() => onSelectRegion('North Africa & Sahel')}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 text-slate-300 hover:text-white transition-all text-[11px] font-medium cursor-pointer"
                  >
                    North Africa &amp; Sahel (10)
                  </button>
                  <button
                    onClick={() => onSelectRegion('All')}
                    className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition-all cursor-pointer"
                  >
                    All 24 States
                  </button>
                </div>
              )}
            </div>

            {/* Right: Modern Typographic Graphic SVG */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[280px] h-36 bg-slate-950/80 border border-slate-800 rounded-xl p-3 shadow-inner flex flex-col justify-between overflow-hidden">
                {/* SVG Geometric Regulatory Radar Art */}
                <svg className="absolute right-0 bottom-0 w-44 h-44 opacity-35" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="65" fill="none" stroke="#0284c7" strokeWidth="1" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="15" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="1.5" />
                  {/* Radar sweep line */}
                  <line x1="100" y1="100" x2="185" y2="45" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="185" cy="45" r="4" fill="#34d399" />
                  <circle cx="130" cy="140" r="3" fill="#38bdf8" />
                  <circle cx="50" cy="80" r="3" fill="#fbbf24" />
                </svg>

                {/* Typographic Telemetry Overlay */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    REGULATORY MATRIX
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">2026.09</span>
                </div>

                <div className="relative z-10 my-auto">
                  <div className="font-mono text-xs text-slate-300">
                    <span className="text-cyan-400">24</span> JURISDICTIONS
                  </div>
                  <div className="font-mono text-xs text-slate-300 mt-0.5">
                    <span className="text-emerald-400">160+</span> STATUTORY REGS
                  </div>
                  <div className="font-mono text-[11px] text-amber-400 mt-0.5">
                    NIST • ISO • CIS CROSSWALK
                  </div>
                </div>

                <div className="relative z-10 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <span>AUTONOMOUS CRAWLER</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
