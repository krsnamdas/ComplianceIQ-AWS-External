import React, { useState } from 'react';
import { RegulatoryUpdate, ScraperStatus } from '../types/regulatory';
import { useRBAC } from '../context/RBACContext';
import {
  Radio,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building,
  Terminal,
  Activity,
  Layers,
  Lock,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface RegulatoryRadarProps {
  scraperStatus: ScraperStatus;
  updates: RegulatoryUpdate[];
  onTriggerScrape: () => void;
  isScraping: boolean;
  onViewSources?: () => void;
}

export const RegulatoryRadar: React.FC<RegulatoryRadarProps> = ({
  scraperStatus,
  updates,
  onTriggerScrape,
  isScraping,
  onViewSources,
}) => {
  const { canTriggerScraper, isAnalyst, isAdmin, triggerRestrictedAction, setRole } = useRBAC();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Under Discussion' | 'Draft' | 'Active' | 'Upcoming'>('all');
  const [showTerminalLogs, setShowTerminalLogs] = useState(true);

  const filteredUpdates = updates.filter((u) => {
    if (selectedFilter === 'all') return true;
    return u.status === selectedFilter;
  });

  const handleScrapeClick = () => {
    if (!canTriggerScraper) {
      triggerRestrictedAction(
        'Run Live Regulatory Scraper',
        'Executing manual web crawling probes on official MENAT ministerial and gazette portals is restricted to Compliance Managers. Switch your role to Compliance Manager in the top bar to trigger on-demand crawls.'
      );
      return;
    }
    onTriggerScrape();
  };

  return (
    <div className="space-y-6">
      {/* Scraper / crawler machinery is an administrative capability. It is hidden
          for all non-admin users by default; normal users still see the read-only
          "Upcoming Regulations & Public Consultations Radar" feed below. */}
      {isAdmin && (
        <>
      {/* Analyst Role Notice Banner */}
      {isAnalyst && (
        <div className="p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sky-300 block">Analyst Role (View-Only Mode) Active</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Crawler execution triggers and source management are locked. Switch to Compliance Manager to run manual scraping.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRole('compliance_manager')}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer transition-colors shadow-xs shrink-0"
          >
            <span>Switch to Compliance Manager</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Scraper Status & Schedule Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Automated Regulatory Scraper & Change Watchdog
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Active crawling engine scanning 24+ official gazettes, central banks, and cybersecurity authorities across all 24 MENAT jurisdictions every 48 hours.
            </p>
          </div>

          {/* Trigger Button */}
          <div className="flex items-center space-x-3">
            {onViewSources && (
              <button
                onClick={onViewSources}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Tracked Sources ({scraperStatus.totalSourcesMonitored})</span>
              </button>
            )}

            <button
              onClick={handleScrapeClick}
              disabled={isScraping}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                !canTriggerScraper
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title={
                !canTriggerScraper
                  ? 'Analyst Role: Click to request Compliance Manager elevation'
                  : 'Execute immediate check on official regulatory portals'
              }
            >
              {!canTriggerScraper ? (
                <Lock className="w-4 h-4 text-amber-400" />
              ) : (
                <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
              )}
              <span>
                {isScraping
                  ? 'Probing Official Portals...'
                  : canTriggerScraper
                  ? 'Run Scraper Now (On-Demand)'
                  : 'Run Scraper (Mgr Only)'}
              </span>
            </button>
          </div>
        </div>

        {/* Schedule & Health Metrics */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Crawl Schedule</span>
            </span>
            <span className="font-bold text-white text-sm mt-1 block">
              {scraperStatus.frequency}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Automated background daemon</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Execution Trace</span>
            </span>
            <span className="font-mono text-emerald-400 text-xs mt-1 block">
              {new Date(scraperStatus.lastRunTimestamp).toUTCString().slice(0, 22)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Zero errors recorded</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Automated Run</span>
            </span>
            <span className="font-mono text-cyan-400 text-xs mt-1 block">
              {new Date(scraperStatus.nextScheduledRunTimestamp).toUTCString().slice(0, 22)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Scheduled 48h checkpoint</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sources Monitored</span>
            </span>
            <span className="font-bold text-white text-sm mt-1 block">
              {scraperStatus.sourcesOnline} / {scraperStatus.totalSourcesMonitored} Feeds
            </span>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">100% Verified Official Domains</span>
          </div>
        </div>
      </div>

      {/* Terminal Scraper Execution Logs */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-white">Live Crawler Audit Trail (Latest Checks)</span>
          </div>
          <button
            onClick={() => setShowTerminalLogs(!showTerminalLogs)}
            className="text-xs text-slate-400 hover:text-white"
          >
            {showTerminalLogs ? 'Collapse Logs' : 'Expand Logs'}
          </button>
        </div>

        {showTerminalLogs && (
          <div className="p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-56 overflow-y-auto bg-slate-950">
            {scraperStatus.recentLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 border-b border-slate-900 pb-1.5">
                <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                <span className="text-emerald-400 font-semibold">{log.sourceName}:</span>
                <span className="text-slate-400">HTTP {log.httpStatus}</span>
                <span className="text-slate-300">- {log.summary}</span>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Upcoming Regulations & Public Consultations Feed */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <Radio className="w-5 h-5 text-amber-400" />
              <span>Upcoming Regulations & Public Consultations Radar</span>
            </h3>
            <p className="text-xs text-slate-400">
              Discussions, draft circulars, and scheduled compliance deadlines across sectors with verified citations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
            {(['all', 'Under Discussion', 'Draft', 'Active', 'Upcoming'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedFilter === filter
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'All Alerts' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Update Cards */}
        <div className="grid grid-cols-1 gap-4">
          {filteredUpdates.map((update) => (
            <div
              key={update.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-3"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700">
                    {update.countryName}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{update.authority}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      update.status === 'Under Discussion'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : update.status === 'Draft'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {update.status}
                  </span>

                  <span className="text-[11px] text-slate-400 font-mono">
                    Published: {update.publicationDate}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h4 className="text-base font-bold text-white tracking-tight leading-snug">
                {update.title}
              </h4>

              {/* Summary */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                {update.summary}
              </p>

              {/* Key Requirements Checklist */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Compliance Mandates & Timelines:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {update.keyRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Metadata & Source Link */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Sector badges */}
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Target Sectors:</span>
                  {update.targetSectors.map((sector) => (
                    <span
                      key={sector}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700"
                    >
                      {sector}
                    </span>
                  ))}
                </div>

                {/* Source Verification Link */}
                <div className="flex items-center space-x-2">
                  {update.effectiveDate && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      Effective: <strong className="text-white">{update.effectiveDate}</strong>
                    </span>
                  )}

                  <a
                    href={update.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                  >
                    <span>Official Gazette / Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
