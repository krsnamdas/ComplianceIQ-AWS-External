import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  FileSpreadsheet,
  Trash2,
  Search,
  Filter,
  Clock,
  Download,
  PenTool,
  RefreshCw,
  Activity,
  Layers,
  CheckCircle2,
  Sliders,
  Users,
  ShieldCheck,
  Megaphone,
  BookOpen,
} from 'lucide-react';

export const AuditTrailTab: React.FC = () => {
  const { auditLogs, clearAuditLogs, exportAuditLogsCSV } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // The SHARED, server-side audit log (all admins' actions). Fetched on open so
  // the table reflects everyone's activity — not just this browser's local log.
  const [serverLogs, setServerLogs] = useState<any[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchServerLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const d = await res.json();
        if (Array.isArray(d.logs)) setServerLogs(d.logs);
      }
    } catch {
      // offline: fall back to local logs
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerLogs();
  }, []);

  // Prefer the shared server log when available; fall back to the local view.
  const sourceLogs = serverLogs && serverLogs.length > 0 ? serverLogs : auditLogs;

  // Activity counts by category
  const stats = useMemo(() => {
    const downloads = sourceLogs.filter((l) => l.actionType === 'REGULATORY_DOWNLOAD').length;
    const redlines = sourceLogs.filter((l) => l.actionType === 'POLICY_REDLINING').length;
    const scrapers = sourceLogs.filter((l) => l.actionType === 'SCRAPER_TRIGGERED' || l.actionType === 'LINK_AUDIT_TRIGGERED').length;
    const adminOps = sourceLogs.filter((l) =>
      ['FEATURE_TOGGLED', 'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED', 'USER_SWITCHED', 'BROADCAST_UPDATED', 'BACKUP_EXPORTED', 'BACKUP_RESTORED'].includes(l.actionType)
    ).length;
    return {
      total: sourceLogs.length,
      downloads,
      redlines,
      scrapers,
      adminOps,
    };
  }, [sourceLogs]);

  const filteredLogs = useMemo(() => {
    return sourceLogs.filter((log) => {
      const matchSearch =
        searchTerm === '' ||
        (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.targetEntity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details || '').toLowerCase().includes(searchTerm.toLowerCase());

      let matchAction = true;
      if (actionFilter === 'all') {
        matchAction = true;
      } else if (actionFilter === 'DOWNLOADS') {
        matchAction = log.actionType === 'REGULATORY_DOWNLOAD';
      } else if (actionFilter === 'REDLINE') {
        matchAction = log.actionType === 'POLICY_REDLINING';
      } else if (actionFilter === 'SCRAPER') {
        matchAction = log.actionType === 'SCRAPER_TRIGGERED' || log.actionType === 'LINK_AUDIT_TRIGGERED';
      } else if (actionFilter === 'ADMIN_OPS') {
        matchAction = ['FEATURE_TOGGLED', 'USER_CREATED', 'USER_UPDATED', 'USER_STATUS_CHANGED', 'USER_SWITCHED', 'BROADCAST_UPDATED', 'BACKUP_EXPORTED', 'BACKUP_RESTORED'].includes(log.actionType);
      } else {
        matchAction = log.actionType === actionFilter;
      }

      return matchSearch && matchAction;
    });
  }, [sourceLogs, searchTerm, actionFilter]);

  const getActionBadge = (type: string) => {
    if (type === 'REGULATORY_DOWNLOAD') {
      return {
        style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        label: 'Regulatory Download',
        icon: Download,
      };
    }
    if (type === 'POLICY_REDLINING') {
      return {
        style: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
        label: 'Policy Redlining',
        icon: PenTool,
      };
    }
    if (type === 'SCRAPER_TRIGGERED' || type === 'LINK_AUDIT_TRIGGERED') {
      return {
        style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        label: type === 'SCRAPER_TRIGGERED' ? 'Scraper Trigger' : 'Link Audit',
        icon: RefreshCw,
      };
    }
    if (type.includes('REGULATION')) {
      return {
        style: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        label: type.replace('REGULATION_', '').replace('_', ' '),
        icon: BookOpen,
      };
    }
    if (type.includes('FEATURE')) {
      return {
        style: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        label: 'Feature Toggle',
        icon: Sliders,
      };
    }
    if (type.includes('USER')) {
      return {
        style: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        label: type.replace('USER_', '').replace('_', ' '),
        icon: Users,
      };
    }
    if (type.includes('BROADCAST')) {
      return {
        style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        label: 'System Broadcast',
        icon: Megaphone,
      };
    }
    return {
      style: 'bg-slate-700 text-slate-300 border-slate-600',
      label: type.replace(/_/g, ' '),
      icon: Activity,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Activity Log &amp; Compliance Audit Trail</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {auditLogs.length} Events Logged
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Immutable, timestamped compliance audit log tracking user actions including regulatory dossier downloads,
            AI policy redlining history, automated scraper crawler triggers, and administrative system updates.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Download the complete, server-captured audit log (stored encrypted
              at rest in the bucket) as a readable CSV. This is the authoritative
              trail shared across all admins — not just this browser's view. */}
          <a
            href="/api/audit-logs/download"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            title="Download the full server-side audit log (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Audit Log (CSV)</span>
          </a>
          <button
            onClick={fetchServerLogs}
            disabled={isRefreshing}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh the shared audit log from the server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportAuditLogsCSV}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Export the entries currently visible in this view"
          >
            <Download className="w-4 h-4" />
            <span>Export View</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Clear all audit logs? This action cannot be undone.')) {
                clearAuditLogs();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActionFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            actionFilter === 'all'
              ? 'bg-slate-800/80 border-slate-600 ring-1 ring-slate-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">Total Activities</span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-white mt-1 font-mono">{stats.total}</div>
          <span className="text-[10px] text-slate-500">All audit trail events</span>
        </button>

        <button
          onClick={() => setActionFilter('DOWNLOADS')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            actionFilter === 'DOWNLOADS'
              ? 'bg-cyan-950/40 border-cyan-600 ring-1 ring-cyan-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-cyan-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-cyan-300">Regulatory Downloads</span>
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-300 mt-1 font-mono">{stats.downloads}</div>
          <span className="text-[10px] text-cyan-400/80">PDF dossiers, Excel &amp; JSON</span>
        </button>

        <button
          onClick={() => setActionFilter('REDLINE')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            actionFilter === 'REDLINE'
              ? 'bg-fuchsia-950/40 border-fuchsia-600 ring-1 ring-fuchsia-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-fuchsia-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-fuchsia-300">Policy Redlining</span>
            <PenTool className="w-3.5 h-3.5 text-fuchsia-400" />
          </div>
          <div className="text-lg font-bold text-fuchsia-300 mt-1 font-mono">{stats.redlines}</div>
          <span className="text-[10px] text-fuchsia-400/80">AI policy audit runs</span>
        </button>

        <button
          onClick={() => setActionFilter('SCRAPER')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            actionFilter === 'SCRAPER'
              ? 'bg-indigo-950/40 border-indigo-600 ring-1 ring-indigo-500'
              : 'bg-slate-900/60 border-slate-800 hover:border-indigo-800/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-300">Scraper Triggers</span>
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-indigo-300 mt-1 font-mono">{stats.scrapers}</div>
          <span className="text-[10px] text-indigo-400/80">Crawler runs &amp; link audits</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity log by user, target entity, or event details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-none focus:border-emerald-500 w-full md:w-auto"
        >
          <option value="all">All Action Types</option>
          <option value="DOWNLOADS">Regulatory Downloads &amp; Exports</option>
          <option value="REDLINE">Policy Redlining History</option>
          <option value="SCRAPER">Scraper Triggers &amp; Audits</option>
          <option value="ADMIN_OPS">Administrative &amp; IAM Operations</option>
          <option value="REGULATION_CREATED">Regulations Created</option>
          <option value="REGULATION_UPDATED">Regulations Updated</option>
          <option value="REGULATION_LINK_UPDATED">Statutory Links Updated</option>
          <option value="REGULATION_DELETED">Regulations Deleted</option>
          <option value="FEATURE_TOGGLED">Feature Flag Toggles</option>
          <option value="USER_SWITCHED">User Session Switches</option>
          <option value="USER_CREATED">Users Created</option>
          <option value="USER_UPDATED">Users Updated</option>
          <option value="BROADCAST_UPDATED">Advisory Broadcasts</option>
        </select>
      </div>

      {/* Activity Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="table-scroll-x">
          <table className="w-full text-left text-xs min-w-[820px]">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Activity Category</th>
                <th className="py-3 px-4">Target Entity / Resource</th>
                <th className="py-3 px-4">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No activity log records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.actionType);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.userName}</div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {log.userEmail}
                        </span>
                      </td>

                      {/* Action Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono border ${badge.style}`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4 font-semibold text-slate-200 max-w-[220px] truncate" title={log.targetEntity}>
                        {log.targetEntity}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-300 max-w-md">
                        <p className="line-clamp-2 leading-relaxed" title={log.details}>
                          {log.details}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
