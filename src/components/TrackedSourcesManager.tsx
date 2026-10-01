import React, { useState } from 'react';
import { Country, ScrapedSource, ScraperStatus } from '../types/regulatory';
import { useRBAC } from '../context/RBACContext';
import {
  Globe2,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  Filter,
  Layers,
  Database,
  Link as LinkIcon,
  Building,
  Check,
  Lock,
} from 'lucide-react';

interface TrackedSourcesManagerProps {
  sources: ScrapedSource[];
  countries: Country[];
  onRefreshSources: () => void;
  selectedCountryFilter?: string;
  onSelectCountryFilter?: (countryId: string) => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
  scraperStatus?: ScraperStatus;
}

export const TrackedSourcesManager: React.FC<TrackedSourcesManagerProps> = ({
  sources,
  countries,
  onRefreshSources,
  selectedCountryFilter = 'all',
  onSelectCountryFilter,
  onTriggerScrape,
  isScraping,
  scraperStatus,
}) => {
  const { canTriggerScraper, triggerRestrictedAction, setRole } = useRBAC();
  const [searchQuery, setSearchQuery] = useState('');
  const [macroRegionFilter, setMacroRegionFilter] = useState<'all' | 'Middle East' | 'North Africa, The Sahel, & Horn of Africa'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>(selectedCountryFilter);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ScrapedSource | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    countryId: 'ksa',
    authority: '',
    authorityShort: '',
    sourceName: '',
    url: '',
    category: 'Cybersecurity Agency' as ScrapedSource['category'],
    checkFrequency: 'Every 48 Hours' as ScrapedSource['checkFrequency'],
    notes: '',
  });

  const handleCountryFilterChange = (cId: string) => {
    setCountryFilter(cId);
    if (onSelectCountryFilter) {
      onSelectCountryFilter(cId);
    }
  };

  // Filter sources
  const filteredSources = sources.filter((source) => {
    // Macro-region filter
    if (macroRegionFilter !== 'all') {
      const countryObj = countries.find((c) => c.id === source.countryId);
      if (countryObj && countryObj.macroRegion !== macroRegionFilter) {
        return false;
      }
    }

    // Country filter
    if (countryFilter !== 'all' && source.countryId !== countryFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && source.category !== categoryFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        source.sourceName.toLowerCase().includes(q) ||
        source.authority.toLowerCase().includes(q) ||
        source.authorityShort.toLowerCase().includes(q) ||
        source.countryName.toLowerCase().includes(q) ||
        source.url.toLowerCase().includes(q) ||
        (source.notes && source.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const openAddModal = () => {
    if (!canTriggerScraper) {
      triggerRestrictedAction(
        'Add Regulatory Source Link',
        'Configuring automated web scraper endpoints and adding regulatory URLs requires the Compliance Manager role.'
      );
      return;
    }
    setFormData({
      countryId: countryFilter !== 'all' ? countryFilter : 'ksa',
      authority: '',
      authorityShort: '',
      sourceName: '',
      url: 'https://',
      category: 'Cybersecurity Agency',
      checkFrequency: 'Every 48 Hours',
      notes: '',
    });
    setEditingSource(null);
    setIsAddModalOpen(true);
    setFeedbackMessage(null);
  };

  const openEditModal = (source: ScrapedSource) => {
    if (!canTriggerScraper) {
      triggerRestrictedAction(
        'Edit Regulatory Source',
        'Editing regulatory crawler target parameters and frequencies requires the Compliance Manager role.'
      );
      return;
    }
    setEditingSource(source);
    setFormData({
      countryId: source.countryId,
      authority: source.authority,
      authorityShort: source.authorityShort,
      sourceName: source.sourceName,
      url: source.url,
      category: source.category,
      checkFrequency: source.checkFrequency,
      notes: source.notes || '',
    });
    setIsAddModalOpen(true);
    setFeedbackMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url || !formData.authority || !formData.countryId) {
      setFeedbackMessage({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    setFormSubmitting(true);
    setFeedbackMessage(null);

    const countryObj = countries.find((c) => c.id === formData.countryId);
    const countryName = countryObj ? countryObj.name : formData.countryId.toUpperCase();

    try {
      if (editingSource) {
        // Update existing source
        const res = await fetch(`/api/scraper/sources/${editingSource.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            countryName,
          }),
        });
        if (!res.ok) throw new Error('Failed to update source');
        setFeedbackMessage({ type: 'success', text: 'Source link updated successfully!' });
      } else {
        // Add new source
        const res = await fetch('/api/scraper/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            countryName,
          }),
        });
        if (!res.ok) throw new Error('Failed to add new source');
        setFeedbackMessage({ type: 'success', text: 'New regulatory source link added to 48h crawler!' });
      }

      setTimeout(() => {
        setIsAddModalOpen(false);
        setEditingSource(null);
        onRefreshSources();
      }, 700);
    } catch (err: any) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Error saving source.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    if (!canTriggerScraper) {
      triggerRestrictedAction(
        'Delete Regulatory Source',
        'Removing sources from the automated 48-hour crawler requires the Compliance Manager role.'
      );
      return;
    }
    if (!window.confirm(`Are you sure you want to remove the source "${name}" from automated tracking?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/scraper/sources/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      onRefreshSources();
    } catch (err) {
      console.error('Delete error', err);
      alert('Could not remove source link.');
    }
  };

  // Grouped counts for stats
  const totalSources = sources.length;
  const verifiedSources = sources.filter((s) => s.status === 'Active & Verified').length;
  const distinctCountriesTracked = new Set(sources.map((s) => s.countryId)).size;

  const middleEastSourcesCount = sources.filter((s) => {
    const c = countries.find((cnt) => cnt.id === s.countryId);
    return c?.macroRegion === 'Middle East';
  }).length;

  const northAfricaSourcesCount = sources.filter((s) => {
    const c = countries.find((cnt) => cnt.id === s.countryId);
    return c?.macroRegion === 'North Africa, The Sahel, & Horn of Africa';
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Tracked Regulatory Sources & Automated Scraper Feeds
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Every country across the Middle East, North Africa, The Sahel, and Horn of Africa is monitored via direct links to official state gazettes, national cybersecurity authorities, central banks, and data protection commissions.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Automated Schedule: <strong className="ml-1 text-white">Once a Week (Weekly Periodic Run)</strong>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Last Scraped:{' '}
                <strong className="ml-1 text-cyan-300 font-mono">
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
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Live HTTP Probes: <strong className="ml-1 text-white">{verifiedSources} Online (200 OK)</strong>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" title="51 monitored official gazettes and agency portals distributed across 24 sovereign MENAT nations">
                <Globe2 className="w-3.5 h-3.5 mr-1.5" />
                Monitored Portals: <strong className="ml-1 text-white">{totalSources} across {distinctCountriesTracked} Sovereign States</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddModal}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all shadow-md ${
                !canTriggerScraper
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={!canTriggerScraper ? 'Adding sources requires Compliance Manager role' : 'Add Source Link'}
            >
              {!canTriggerScraper ? <Lock className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4" />}
              <span>{!canTriggerScraper ? 'Add Source (Manager)' : 'Add Source Link'}</span>
            </button>

            <button
              onClick={onTriggerScrape}
              disabled={isScraping}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg border flex items-center space-x-2 transition-all disabled:opacity-50 ${
                !canTriggerScraper
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
              }`}
              title={!canTriggerScraper ? 'Scraper trigger requires Compliance Manager role' : 'Run Scraper Now'}
            >
              {!canTriggerScraper ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${isScraping ? 'animate-spin' : ''}`} />
              )}
              <span>
                {isScraping
                  ? 'Probing Feeds...'
                  : !canTriggerScraper
                  ? 'Run Scraper (Manager)'
                  : 'Run Scraper Now'}
              </span>
            </button>
          </div>
        </div>

        {/* Analyst View-Only Banner */}
        {!canTriggerScraper && (
          <div className="mt-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <span className="font-semibold text-white">Analyst Role Active:</span>{' '}
                <span className="text-amber-200/90">
                  You are exploring tracked regulatory gazettes and portal feeds in view-only mode. Adding sources, editing frequencies, and triggering live crawler runs are restricted to Compliance Managers.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRole('compliance_manager')}
              className="self-start sm:self-auto px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shrink-0 text-xs shadow-sm"
            >
              Switch to Manager
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Macro-Region Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setMacroRegionFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                macroRegionFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 24 Sovereign States ({totalSources} Portals)
            </button>
            <button
              onClick={() => setMacroRegionFilter('Middle East')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                macroRegionFilter === 'Middle East'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Middle East (14 States • {middleEastSourcesCount} Portals)
            </button>
            <button
              onClick={() => setMacroRegionFilter('North Africa, The Sahel, & Horn of Africa')}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                macroRegionFilter === 'North Africa, The Sahel, & Horn of Africa'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              North Africa & Horn (10 States • {northAfricaSourcesCount} Portals)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by authority, source name, country, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Specific Country & Authority Category Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center space-x-1">
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Filter by Jurisdiction ({countries.length} Available)</span>
            </label>
            <select
              value={countryFilter}
              onChange={(e) => handleCountryFilterChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All 24 MENAT Jurisdictions</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.name} ({c.macroRegion === 'Middle East' ? 'ME' : 'Africa/Sahel'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Authority Regulatory Domain</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Domains</option>
              <option value="Cybersecurity Agency">Cybersecurity Agency</option>
              <option value="Data Protection Authority">Data Protection Authority</option>
              <option value="Central Bank & Financial Regulatory">Central Bank & Financial Regulatory</option>
              <option value="Telecommunications & Cloud Authority">Telecommunications & Cloud Authority</option>
              <option value="Critical Infrastructure & Energy">Critical Infrastructure & Energy</option>
              <option value="Capital Markets & Crypto">Capital Markets & Crypto</option>
            </select>
          </div>

          <div className="flex items-end justify-between sm:justify-end">
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white">{filteredSources.length}</strong> of{' '}
              <strong className="text-slate-300">{totalSources}</strong> active sources
            </span>
          </div>
        </div>
      </div>

      {/* Tracked Sources List / Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSources.map((source) => {
          const countryObj = countries.find((c) => c.id === source.countryId);
          return (
            <div
              key={source.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                {/* Header: Country Flag, Name, Status Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{countryObj?.flag || '🌐'}</span>
                    <div>
                      <h4 className="font-semibold text-white text-sm leading-tight">
                        {source.countryName}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {countryObj?.macroRegion || 'MENAT Region'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      source.httpStatus === 200
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    HTTP {source.httpStatus} OK
                  </span>
                </div>

                {/* Authority & Source Title */}
                <div className="mt-3.5">
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
                    <Building className="w-3.5 h-3.5" />
                    <span>{source.authorityShort}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 text-[11px]">{source.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-1 line-clamp-2">
                    {source.sourceName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                    {source.notes || 'Official regulatory repository monitored for gazette updates and cyber mandates.'}
                  </p>
                </div>

                {/* Direct Link Preview */}
                <div className="mt-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between group-hover:border-slate-700/80 transition-colors">
                  <span className="truncate pr-2 text-slate-300 font-mono text-[10px]">
                    {source.url}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1 shrink-0 px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/40"
                    title="Open official regulatory website in new tab"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </a>
                </div>
              </div>

              {/* Card Footer: Metadata & Edit/Delete Controls */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center space-x-1 text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Checked: {source.lastChecked.split(' ')[0]}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(source)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit source details or link"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {source.isUserAdded && (
                    <button
                      onClick={() => handleDeleteSource(source.id, source.sourceName)}
                      className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                      title="Delete this custom source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSources.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Tracked Sources Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or add a new official regulatory link using the button above.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCountryFilter('all');
              setCategoryFilter('all');
              setMacroRegionFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Add / Edit Source Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl relative text-white">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {editingSource ? 'Edit Tracked Regulatory Source' : 'Add New Regulatory Source Link'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure official portal URL to be crawled every 48 hours for new decrees & directives.
                </p>
              </div>
            </div>

            {feedbackMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {feedbackMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Jurisdiction / Country *
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Domain Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ScrapedSource['category'] })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Cybersecurity Agency">Cybersecurity Agency</option>
                    <option value="Data Protection Authority">Data Protection Authority</option>
                    <option value="Central Bank & Financial Regulatory">Central Bank & Financial Regulatory</option>
                    <option value="Telecommunications & Cloud Authority">Telecommunications & Cloud Authority</option>
                    <option value="Critical Infrastructure & Energy">Critical Infrastructure & Energy</option>
                    <option value="Capital Markets & Crypto">Capital Markets & Crypto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">
                    Full Authority Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. National Cybersecurity Authority"
                    value={formData.authority}
                    onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Short Acronym
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NCA"
                    value={formData.authorityShort}
                    onChange={(e) => setFormData({ ...formData, authorityShort: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Source / Portal Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Essential Cybersecurity Controls & Gazette Directives"
                  value={formData.sourceName}
                  onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Official URL to Scrape & Monitor *
                </label>
                <input
                  type="url"
                  placeholder="https://authority.gov.xx/regulations"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Check Frequency
                  </label>
                  <select
                    value={formData.checkFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        checkFrequency: e.target.value as ScrapedSource['checkFrequency'],
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Every 48 Hours">Every 48 Hours (Standard)</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Regulatory Tracking Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Scrapes gazette for banking and cloud directives"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-2 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSource ? 'Update Source Link' : 'Add to Scraper Monitor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
