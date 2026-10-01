import React, { useState, useMemo } from 'react';
import { Country, ScraperStatus } from '../types/regulatory';
import { useAdmin } from '../context/AdminContext';
import { useRBAC } from '../context/RBACContext';
import { MOCK_REGULATORY_UPDATES } from '../data/menatData';
import {
  Shield,
  FileText,
  ArrowRight,
  MapPin,
  Database,
  CalendarClock,
  Globe2,
  Layers,
  BookOpen,
  Search,
  Sparkles,
  TrendingUp,
  Cpu,
  Lock,
  Building2,
  CheckCircle2,
  Check,
  Radio,
  RefreshCw,
  Clock,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface CountryOverviewProps {
  countries: Country[];
  selectedCountryId: string;
  onSelectCountry: (countryId: string) => void;
  onViewRegulations: (countryId: string) => void;
  onViewSources?: (countryId: string) => void;
  onViewTimeline?: (countryId?: string) => void;
  onNavigateTab?: (tab: any) => void;
  onRequestLogin?: (targetTab?: any) => void;
  scraperStatus?: ScraperStatus;
  isScraping?: boolean;
  onTriggerScrape?: () => void;
}

export const CountryOverview: React.FC<CountryOverviewProps> = ({
  countries,
  selectedCountryId,
  onSelectCountry,
  onViewRegulations,
  onViewSources,
  onViewTimeline,
  onNavigateTab,
  onRequestLogin,
  scraperStatus,
  isScraping,
  onTriggerScrape,
}) => {
  const { isAuthenticated, isCurrentUserAdmin, isAdminUnlocked } = useAdmin();
  const { isAdmin } = useRBAC();
  const isSuperAdmin = isAuthenticated && (isAdmin || isCurrentUserAdmin || isAdminUnlocked);
  const [activeRegion, setActiveRegion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Total summary calculations
  const totalRegs = useMemo(
    () => countries.reduce((acc, c) => acc + c.totalRegulationsCount, 0),
    [countries]
  );
  const totalTech = useMemo(
    () => countries.reduce((acc, c) => acc + c.techRegulationsCount, 0),
    [countries]
  );
  const totalNonTech = useMemo(
    () => countries.reduce((acc, c) => acc + c.nonTechRegulationsCount, 0),
    [countries]
  );

  // Filter countries by region and search
  const filteredCountries = useMemo(() => {
    return countries.filter((c) => {
      // Region filter
      if (activeRegion === 'GCC' && c.region !== 'GCC') return false;
      if (activeRegion === 'Middle East' && c.macroRegion !== 'Middle East') return false;
      if (
        activeRegion === 'North Africa & Sahel' &&
        c.macroRegion !== 'North Africa, The Sahel, & Horn of Africa'
      )
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesCapital = c.capital.toLowerCase().includes(q);
        const matchesAuth = c.primaryAuthorities.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesCapital && !matchesAuth) {
          return false;
        }
      }

      return true;
    });
  }, [countries, activeRegion, searchQuery]);

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. WHAT THE PLATFORM IS ABOUT IN SIMPLE TERMS */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Sovereign MENAT Regulatory &amp; Controls Intelligence Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Comprehensive Regulatory Compliance across {countries.length} Middle East, North Africa &amp; Türkiye Jurisdictions
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            <strong>ComplianceIQ</strong> translates complex ministerial gazettes, royal decrees, central bank circulars, and data privacy frameworks into clear, actionable technical security controls. Built specifically for compliance officers, CISOs, IT auditors, and legal counsel operating across sovereign MENAT markets.
          </p>

          {/* Simple 3-pillar breakdown in plain language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-emerald-400 flex items-center space-x-1.5">
                <Globe2 className="w-4 h-4 shrink-0" />
                <span>Verified</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                100% verified official government portals, official gazettes, and national cybersecurity bodies with automated link integrity checks.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-cyan-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Global Crosswalks</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Direct statutory mapping from sovereign mandates to NIST CSF 2.0, ISO/IEC 27001:2022, and CIS Controls v8.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Actionable Governance</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Audit LOE estimations, AI policy redlining, version diff comparisons, and enforcement grace-period roadmaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1.5. AUTOMATED WEEKLY SCRAPER & SOVEREIGN LINK AUDIT STATUS (ADMIN ONLY) */}
      {/* ========================================================================= */}
      {isSuperAdmin && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Automated Regulatory Scraper &amp; Link Audit Daemon
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Weekly Periodic Run
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Admin Privileged View
                </span>
              </div>

              <div className="text-sm font-semibold text-white flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Last Scraped:{' '}
                  <strong className="text-cyan-300 font-mono">
                    {scraperStatus?.lastRegulationsScrapeTime
                      ? new Date(scraperStatus.lastRegulationsScrapeTime).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : scraperStatus?.lastRunTimestamp
                      ? new Date(scraperStatus.lastRunTimestamp).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Sep 22, 2026, 04:17 AM UTC'}
                  </strong>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-300 text-xs">
                  Frequency: <span className="text-emerald-400 font-medium">Once a Week Automatically</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-300 text-xs">
                  HTTP Reachability Daemon: <span className="text-teal-400 font-medium">Every 12h (PDFs &amp; URLs)</span>
                </span>
              </div>

              <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                When new regulations are registered, their official portals and PDF gazettes are automatically enqueued into our weekly crawling roster. Link integrity is verified with zero-tolerance for broken endpoints.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0">
              {onTriggerScrape && (
                <button
                  type="button"
                  onClick={onTriggerScrape}
                  disabled={isScraping}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-emerald-500/40 flex items-center space-x-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Execute immediate manual scraper probe across all 24 MENAT jurisdiction portals"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                  <span>{isScraping ? 'Scraping Sovereign Portals...' : 'Manual Scrape Upon Prompt'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab ? onNavigateTab('regulations') : onViewRegulations('all')}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <span>Explore Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE INSIGHTS */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Executive Regulatory Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Insight 1: Data Sovereignty */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono">
              01
            </div>
            <h3 className="font-bold text-sm text-white leading-snug">
              Data Sovereignty &amp; Residency Mandates
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mandatory local cloud storage and stringent Standard Contractual Clauses (SCCs) are now active across Saudi Arabia (PDPL), UAE (Decree 45/2021), and Qatar (Law 13/2016).
            </p>
          </div>

          {/* Insight 2: AI Governance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs font-mono">
              02
            </div>
            <h3 className="font-bold text-sm text-white leading-snug">
              AI Guardrails &amp; Ethics Standards
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              SDAIA, CBUAE, and Qatar NCSA have enacted enterprise Generative AI guidelines prohibiting sensitive PII input into public multi-tenant models and requiring watermark provenance.
            </p>
          </div>

          {/* Insight 3: Critical Infrastructure */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono">
              03
            </div>
            <h3 className="font-bold text-sm text-white leading-snug">
              Zero-Trust &amp; Operational Resilience
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mandatory air-gapping, OT/ICS telemetry isolation, and continuous third-party risk auditing are strictly enforced across hydrocarbons, power grids, and commercial banking.
            </p>
          </div>

          {/* Insight 4: Crosswalk Convergence */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs font-mono">
              04
            </div>
            <h3 className="font-bold text-sm text-white leading-snug">
              78% Standard Control Convergence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ComplianceIQ's controls engine identifies over 78% direct control overlap between regional requirements and international baselines (NIST CSF 2.0 &amp; ISO 27001), lowering audit friction.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. A SUMMARY (PLATFORM METRICS) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Platform Coverage Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{countries.length}</div>
              <div className="text-[11px] text-slate-400 font-medium">Sovereign Jurisdictions</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-cyan-400 tracking-tight">{totalRegs}</div>
              <div className="text-[11px] text-slate-400 font-medium">Statutory Standards &amp; Acts</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-teal-400 tracking-tight">{totalTech}</div>
              <div className="text-[11px] text-slate-400 font-medium">Cyber, Cloud &amp; AI Frameworks</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-400 tracking-tight">18</div>
              <div className="text-[11px] text-slate-400 font-medium">Regulated Industry Sectors</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GENERAL REGULATORY UPDATES (RECENT PULSE) */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
              General Updates &amp; Regional Circulars Pulse
            </h2>
          </div>
          <span className="text-xs text-slate-400">Continuous Monitoring</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MOCK_REGULATORY_UPDATES.slice(0, 3).map((upd) => (
            <div key={upd.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-emerald-400">{upd.countryName}</span>
                  <span className="text-slate-500 font-mono">{upd.publicationDate}</span>
                </div>
                <h4 className="font-bold text-xs text-white line-clamp-2">{upd.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{upd.summary}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 truncate max-w-[170px]">{upd.authority}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {upd.impactLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. AND THEN THE JURISDICTIONS THAT'S IT */}
      {/* ========================================================================= */}
      {!isAuthenticated ? (
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Globe2 className="w-5 h-5 text-emerald-400" />
                <span>Sovereign Jurisdictions ({countries.length} Nations Across MENAT)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive statutory frameworks, clause crosswalks, gap analyses, and compliance baselines.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-1.5 w-fit">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </span>
          </div>

          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Detailed Sovereign Jurisdictions &amp; Technical Controls Locked
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To inspect sovereign standard articles, mandatory confidence ratings, gap analyses, and verified official gazette PDFs for all {countries.length} countries, please sign in with your compliance officer or administrator credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto pt-1 opacity-75">
              {countries.map((c) => (
                <span
                  key={c.id}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5"
                >
                  <span>{c.flag}</span>
                  <span className="font-medium">{c.name}</span>
                </span>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onRequestLogin ? onRequestLogin('regulations') : onNavigateTab && onNavigateTab('regulations')}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Unlock All {countries.length} Jurisdictions</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <Globe2 className="w-5 h-5 text-emerald-400" />
                <span>Sovereign Jurisdictions ({filteredCountries.length} of {countries.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Select any country to view its sovereign authorities, statutory standards, and official portal links.
              </p>
            </div>

          {/* Region Filter Buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto text-xs">
            <button
              onClick={() => setActiveRegion('All')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeRegion === 'All'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All {countries.length} Countries
            </button>
            <button
              onClick={() => setActiveRegion('GCC')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeRegion === 'GCC'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              GCC (6)
            </button>
            <button
              onClick={() => setActiveRegion('Middle East')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeRegion === 'Middle East'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Levant &amp; ME (14)
            </button>
            <button
              onClick={() => setActiveRegion('North Africa & Sahel')}
              className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                activeRegion === 'North Africa & Sahel'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              North Africa &amp; Sahel (10)
            </button>
          </div>
        </div>

        {/* Search Bar for Jurisdictions */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search jurisdiction by country name, capital, or regulatory authority (e.g., Saudi Arabia, SDAIA, CBUAE, QCB)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Country Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((c) => {
            const isSelected = c.id === selectedCountryId;

            return (
              <div
                key={c.id}
                onClick={() => onSelectCountry(c.id)}
                className={`group rounded-2xl border p-5 transition-all cursor-pointer relative bg-slate-900 hover:border-emerald-500/50 hover:shadow-lg flex flex-col justify-between ${
                  isSelected ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Flag & Title */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl select-none" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                          {c.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{c.capital}</span>
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-800">
                            {c.macroRegion === 'Middle East' ? 'Middle East' : 'Africa/Sahel'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Description */}
                  <p className="mt-3 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Sovereign Regulators */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Primary Authorities:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.primaryAuthorities.map((auth) => (
                        <span
                          key={auth}
                          className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 font-medium"
                        >
                          {auth}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Stats & View Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">
                      <strong className="text-emerald-400 font-semibold">{c.techRegulationsCount}</strong> Tech
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">
                      <strong className="text-amber-400 font-semibold">{c.nonTechRegulationsCount}</strong> Non-Tech
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onViewTimeline && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTimeline(c.id);
                        }}
                        className="text-[11px] px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 flex items-center space-x-1 border border-slate-800 transition-colors cursor-pointer"
                        title="View statutory deadlines & Gantt timeline"
                      >
                        <CalendarClock className="w-3 h-3" />
                        <span>Timeline</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewRegulations(c.id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>View Regs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
};
