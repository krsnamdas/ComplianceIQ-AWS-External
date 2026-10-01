import React, { useState, useEffect } from 'react';
import { GroundedNewsItem, RegulatoryNewsCategory, RegulatoryImpactLevel, RegulatorySentiment, NewsFeedResponse } from '../types/news';
import {
  Globe,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Shield,
  Cpu,
  Database,
  Coins,
  Radio,
  Building,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  Bookmark,
  Check,
  Tag,
} from 'lucide-react';

interface RegulatoryNewsFeedProps {
  initialJurisdiction?: string;
  onSelectCountry?: (countryId: string) => void;
}

const CATEGORIES: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  { id: 'all', label: 'All Categories', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'Cybersecurity', label: 'Cybersecurity', icon: <Shield className="w-3.5 h-3.5 text-emerald-400" /> },
  { id: 'AI Governance', label: 'AI Governance', icon: <Cpu className="w-3.5 h-3.5 text-purple-400" /> },
  { id: 'Data Privacy & Cloud', label: 'Data & Cloud', icon: <Database className="w-3.5 h-3.5 text-cyan-400" /> },
  { id: 'FinTech & Banking', label: 'FinTech & Banking', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
  { id: 'Critical Infrastructure', label: 'Critical Infra & OT', icon: <Building className="w-3.5 h-3.5 text-rose-400" /> },
  { id: 'Telecom & Cross-Border', label: 'Telecom & Cross-Border', icon: <Radio className="w-3.5 h-3.5 text-blue-400" /> },
];

const JURISDICTIONS = [
  { id: 'all', label: 'All 24 Jurisdictions', flag: '🌐' },
  { id: 'sa', label: 'Saudi Arabia', flag: '🇸🇦' },
  { id: 'ae', label: 'United Arab Emirates', flag: '🇦🇪' },
  { id: 'qa', label: 'Qatar', flag: '🇶🇦' },
  { id: 'om', label: 'Oman', flag: '🇴🇲' },
  { id: 'bh', label: 'Bahrain', flag: '🇧🇭' },
  { id: 'kw', label: 'Kuwait', flag: '🇰🇼' },
  { id: 'tr', label: 'Turkey', flag: '🇹🇷' },
  { id: 'eg', label: 'Egypt', flag: '🇪🇬' },
  { id: 'ma', label: 'Morocco', flag: '🇲🇦' },
  { id: 'jo', label: 'Jordan', flag: '🇯🇴' },
];

export const RegulatoryNewsFeed: React.FC<RegulatoryNewsFeedProps> = ({
  initialJurisdiction = 'all',
  onSelectCountry,
}) => {
  const [news, setNews] = useState<GroundedNewsItem[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [citations, setCitations] = useState<Array<{ title: string; url: string }>>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLiveGrounded, setIsLiveGrounded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>(initialJurisdiction);
  const [selectedImpact, setSelectedImpact] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<'all' | RegulatorySentiment>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [customLiveQuery, setCustomLiveQuery] = useState<string>('');
  const [isSearchingLive, setIsSearchingLive] = useState<boolean>(false);

  // Detail Modal / Expanded Item
  const [activeItem, setActiveItem] = useState<GroundedNewsItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('menat_bookmarked_news');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchNews = async (opts?: {
    category?: string;
    jurisdiction?: string;
    query?: string;
    forceRefresh?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);

    const cat = opts?.category !== undefined ? opts.category : selectedCategory;
    const jur = opts?.jurisdiction !== undefined ? opts.jurisdiction : selectedJurisdiction;
    const q = opts?.query !== undefined ? opts.query : searchKeyword;
    const refresh = opts?.forceRefresh || false;

    try {
      const res = await fetch('/api/news/grounded', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: cat,
          jurisdiction: jur,
          query: q,
          forceRefresh: refresh,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: NewsFeedResponse = await res.json();
      setNews(data.news || []);
      setSearchQueries(data.searchQueries || []);
      setCitations(data.sourceCitations || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setIsLiveGrounded(data.isLiveGrounded || false);
    } catch (err: any) {
      console.error('[Regulatory News Feed Fetch Error]', err);
      setError('Unable to reach grounded news feed service. Showing baseline intelligence records.');
    } finally {
      setIsLoading(false);
      setIsSearchingLive(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, selectedJurisdiction]);

  const handleRunLiveSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLiveQuery.trim()) return;
    setIsSearchingLive(true);
    fetchNews({ query: customLiveQuery.trim(), forceRefresh: true });
  };

  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(bookmarkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBookmarkedIds(next);
    localStorage.setItem('menat_bookmarked_news', JSON.stringify(Array.from(next)));
  };

  const handleCopyLink = (item: GroundedNewsItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `[MENAT Regulatory Intelligence] ${item.title}\nAuthority: ${item.authority} (${item.jurisdiction})\nCategory: ${item.category} | Impact: ${item.impactLevel}\n\n${item.summary}\nSource: ${item.sourceUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Local filtering for quick in-memory search
  const displayedNews = news.filter((item) => {
    if (selectedImpact !== 'all' && item.impactLevel !== selectedImpact) return false;
    if (selectedSentiment !== 'all' && item.sentiment !== selectedSentiment) return false;
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchAuth = item.authority.toLowerCase().includes(q);
      const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchAuth && !matchTag) return false;
    }
    return true;
  });

  const getSentimentBadge = (sentiment?: RegulatorySentiment, rationale?: string) => {
    if (!sentiment) return null;
    switch (sentiment) {
      case 'Impactful':
        return (
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/15 text-rose-300 border border-rose-500/35 flex items-center space-x-1"
            title={rationale || 'High urgency / direct binding compliance impact'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            <span>Impactful</span>
          </span>
        );
      case 'Consultation Phase':
        return (
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/15 text-purple-300 border border-purple-500/35 flex items-center space-x-1"
            title={rationale || 'Open public consultation / policy draft feedback phase'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Consultation Phase</span>
          </span>
        );
      case 'Neutral':
      default:
        return (
          <span
            className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-500/15 text-blue-300 border border-blue-500/35 flex items-center space-x-1"
            title={rationale || 'Standard administrative or informational notice'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Neutral</span>
          </span>
        );
    }
  };

  const getImpactBadge = (level: RegulatoryImpactLevel) => {
    switch (level) {
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-500/15 text-red-400 border border-red-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            <span>High Impact</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Medium Impact</span>
          </span>
        );
      case 'Advisory':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Advisory</span>
          </span>
        );
    }
  };

  const getCategoryColor = (category: RegulatoryNewsCategory) => {
    switch (category) {
      case 'Cybersecurity':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'AI Governance':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Data Privacy & Cloud':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'FinTech & Banking':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Critical Infrastructure':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Telecom & Cross-Border':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden space-y-0">
      {/* Top Banner & Control Bar */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Regulatory News Feed</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Google Search Grounding</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Autonomous AI Model
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 pl-10">
              Live categorized regulatory notices, statutory gazette decrees & enforcement actions across 24 MENAT jurisdictions.
            </p>
          </div>

          {/* Action Tools: Live Refresh & Live Query */}
          <div className="flex flex-wrap items-center gap-2 pl-10 lg:pl-0">
            {/* Live Search Grounding Input */}
            <form onSubmit={handleRunLiveSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search live MENAT gazettes..."
                value={customLiveQuery}
                onChange={(e) => setCustomLiveQuery(e.target.value)}
                className="w-48 sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                disabled={isLoading || !customLiveQuery.trim()}
                className="ml-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-all cursor-pointer flex items-center space-x-1"
                title="Execute live Google Search Grounding for this query"
              >
                {isSearchingLive ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Ground</span>
              </button>
            </form>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchNews({ forceRefresh: true })}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh live news feed from MENAT regulatory sources"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Categories & Jurisdictions */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap flex items-center space-x-1.5 transition-colors cursor-pointer text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary Filters: Jurisdiction Dropdown & Impact */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Jurisdiction Select */}
            <select
              value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              {JURISDICTIONS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.flag} {j.label}
                </option>
              ))}
            </select>

            {/* Impact Filter */}
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              <option value="all">All Impacts</option>
              <option value="High">High Impact</option>
              <option value="Medium">Medium Impact</option>
              <option value="Advisory">Advisory</option>
            </select>

            {/* Sentiment Indicator Filter */}
            <select
              value={selectedSentiment}
              onChange={(e: any) => setSelectedSentiment(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 font-medium cursor-pointer"
            >
              <option value="all">All Sentiments</option>
              <option value="Impactful">Impactful</option>
              <option value="Consultation Phase">Consultation Phase</option>
              <option value="Neutral">Neutral</option>
            </select>

            {/* Quick Text Filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter results..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-32 pl-6 pr-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Filter className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800 rounded w-1/4"></div>
              </div>
              <div className="h-5 bg-slate-800 rounded w-4/5"></div>
              <div className="h-3.5 bg-slate-800/70 rounded w-full"></div>
              <div className="h-3.5 bg-slate-800/70 rounded w-3/4"></div>
              <div className="pt-2 flex justify-between">
                <div className="h-3 bg-slate-800 rounded w-1/4"></div>
                <div className="h-3 bg-slate-800 rounded w-1/5"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News Feed Cards Grid */}
      {!isLoading && displayedNews.length > 0 && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedNews.map((item) => {
            const isBookmarked = bookmarkedIds.has(item.id);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-950 transition-all cursor-pointer flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-3">
                  {/* Top Metadata Strip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base" title={item.jurisdiction}>
                        {item.countryFlag}
                      </span>
                      <span className="text-xs font-semibold text-white tracking-tight">
                        {item.jurisdiction}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.authority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 flex-wrap justify-end gap-y-1">
                      {getSentimentBadge(item.sentiment, item.sentimentRationale)}
                      {getImpactBadge(item.impactLevel)}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getCategoryColor(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{item.timeAgo}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3">{item.summary}</p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800/80 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls & Source Links */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center space-x-1.5 text-emerald-400 hover:text-emerald-300 font-medium group/link"
                    title={`Open verified official source: ${item.sourceName}`}
                  >
                    <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    <span className="truncate max-w-[180px]">{item.sourceName}</span>
                  </a>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(item, e)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title="Copy regulatory update details"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(item.id, e)}
                      className={`p-1 rounded transition-colors ${
                        isBookmarked
                          ? 'text-amber-400 hover:text-amber-300'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={isBookmarked ? 'Bookmarked' : 'Bookmark this headline'}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>

                    <span className="text-slate-500 font-semibold text-xs group-hover:text-emerald-400 flex items-center space-x-0.5">
                      <span>Brief</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && displayedNews.length === 0 && (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No headlines matching the active filters</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting your category or jurisdiction filter, or use the live Grounding search bar above to fetch fresh updates from Google Search Grounding.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedJurisdiction('all');
              setSelectedImpact('all');
              setSearchKeyword('');
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Grounding Telemetry Strip */}
      <div className="p-4 bg-slate-950 border-t border-slate-800/90 text-xs text-slate-400 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-300 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search Grounding Queries:</span>
          </span>
          {searchQueries.slice(0, 3).map((query, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300 max-w-[240px] truncate"
              title={query}
            >
              "{query}"
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
          <span>Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
          <span>•</span>
          <span>{displayedNews.length} Headlines Indexed</span>
        </div>
      </div>

      {/* Detail Modal / Drawer for In-Depth Compliance Brief */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{activeItem.countryFlag}</span>
                  <span className="text-sm font-bold text-white">{activeItem.jurisdiction}</span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {activeItem.authority}
                  </span>
                  {getSentimentBadge(activeItem.sentiment, activeItem.sentimentRationale)}
                  {getImpactBadge(activeItem.impactLevel)}
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getCategoryColor(
                      activeItem.category
                    )}`}
                  >
                    {activeItem.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeItem.timeAgo}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Headline */}
            <h2 className="text-lg font-extrabold text-white leading-snug">{activeItem.title}</h2>

            {/* Regulatory Sentiment Classification Callout */}
            {activeItem.sentiment && (
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start space-x-3">
                <div className="shrink-0 mt-0.5">
                  {getSentimentBadge(activeItem.sentiment)}
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-white block">
                    Regulatory Sentiment Assessment ({activeItem.sentiment})
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {activeItem.sentimentRationale ||
                      (activeItem.sentiment === 'Impactful'
                        ? 'Direct enforcement obligations with immediate compliance timeline.'
                        : activeItem.sentiment === 'Consultation Phase'
                        ? 'Statutory open commentary window and regulatory impact feedback stage.'
                        : 'Informational regulatory circular with standard operational baseline.')}
                  </p>
                </div>
              </div>
            )}

            {/* Executive Analysis */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Executive Summary</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                {activeItem.summary}
              </p>
            </div>

            {/* Key Compliance Obligations */}
            {activeItem.keyObligations && activeItem.keyObligations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Key Statutory Obligations</span>
                </h4>
                <div className="space-y-1.5">
                  {activeItem.keyObligations.map((ob, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/70 text-xs text-slate-200 flex items-start space-x-2"
                    >
                      <span className="font-mono text-emerald-400 font-bold text-[11px] shrink-0 mt-0.5">
                        0{idx + 1}.
                      </span>
                      <span>{ob}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Business Sectors */}
            {activeItem.affectedSectors && activeItem.affectedSectors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Affected Industry Sectors</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeItem.affectedSectors.map((sec) => (
                    <span
                      key={sec}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-400">
                <span>Published via </span>
                <strong className="text-white">{activeItem.sourceName}</strong>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={activeItem.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Official Source Gazette</span>
                </a>

                {onSelectCountry && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCountry(activeItem.countryCode);
                      setActiveItem(null);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    View Country Dossier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
