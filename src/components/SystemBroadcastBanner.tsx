import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AlertTriangle, Info, AlertOctagon, X, ExternalLink, ShieldAlert } from 'lucide-react';

export const SystemBroadcastBanner: React.FC = () => {
  const { broadcastBanner, effectiveFeatureFlags: featureFlags } = useAdmin();
  const [isDismissed, setIsDismissed] = useState(false);

  // If system broadcast is disabled globally in feature flags or dismissed by user or muted in broadcast settings
  if (!featureFlags.systemBroadcast || !broadcastBanner.enabled || isDismissed) {
    return null;
  }

  const getTheme = () => {
    switch (broadcastBanner.level) {
      case 'critical':
        return {
          bg: 'bg-rose-950/90 border-rose-600/50 text-rose-200',
          badgeBg: 'bg-rose-600/30 text-rose-300 border-rose-500/50',
          icon: <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />,
          accent: 'text-rose-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-600/50 text-amber-200',
          badgeBg: 'bg-amber-600/30 text-amber-300 border-amber-500/50',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          accent: 'text-amber-400',
        };
      case 'info':
      default:
        return {
          bg: 'bg-sky-950/90 border-sky-600/50 text-sky-200',
          badgeBg: 'bg-sky-600/30 text-sky-300 border-sky-500/50',
          icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
          accent: 'text-sky-400',
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={`border-b px-4 py-2 text-xs backdrop-blur-md transition-all ${theme.bg}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
          {theme.icon}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${theme.badgeBg}`}
            >
              {broadcastBanner.title || 'Official Advisory'}
            </span>
            <span className="text-slate-100 font-medium truncate">
              {broadcastBanner.message}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {broadcastBanner.actionUrl && (
            <a
              href={broadcastBanner.actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              <span>{broadcastBanner.actionLabel || 'Inspect Directive'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
