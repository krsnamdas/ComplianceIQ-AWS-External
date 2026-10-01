import React, { useMemo, useState } from 'react';
import { Country, RegulatoryUpdate } from '../types/regulatory';
import { MENAT_COUNTRIES, MOCK_REGULATORY_UPDATES } from '../data/menatData';
import {
  DigestSubscriptionPreferences,
  loadDigestPreferences,
  saveDigestPreferences,
  getFilteredDigestAlerts,
} from '../utils/digestManager';
import {
  BellRing,
  Flame,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  Globe2,
  Layers,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Building,
} from 'lucide-react';

interface DashboardDigestWidgetProps {
  onOpenFullDigest: () => void;
  onOpenCustomize?: () => void;
}

export const DashboardDigestWidget: React.FC<DashboardDigestWidgetProps> = ({
  onOpenFullDigest,
  onOpenCustomize,
}) => {
  const [preferences, setPreferences] = useState<DigestSubscriptionPreferences>(() =>
    loadDigestPreferences()
  );

  // Compute filtered alerts
  const subscribedAlerts = useMemo(() => {
    return getFilteredDigestAlerts(MOCK_REGULATORY_UPDATES, preferences);
  }, [preferences]);

  // Top high priority alerts (up to 3)
  const topAlerts = useMemo(() => {
    return subscribedAlerts.slice(0, 3);
  }, [subscribedAlerts]);

  const unreadCount = useMemo(() => {
    return subscribedAlerts.filter((a) => !preferences.readAlertIds.includes(a.id)).length;
  }, [subscribedAlerts, preferences.readAlertIds]);

  const subscribedCountryObjs = useMemo(() => {
    return MENAT_COUNTRIES.filter((c) => preferences.subscribedCountries.includes(c.id));
  }, [preferences.subscribedCountries]);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/20 border border-rose-500/30 hover:border-rose-500/50 rounded-2xl p-5 shadow-lg space-y-4 transition-all">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
                <span>Regional Regulatory Digest</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  SUBSCRIBED ALERTS
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live high-priority alerts matched to your subscribed countries and sectors.
            </p>
          </div>
        </div>

        {/* Subscribed Metrics & Quick Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center -space-x-1 overflow-hidden px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            {subscribedCountryObjs.slice(0, 5).map((c) => (
              <span key={c.id} className="text-sm" title={c.name}>
                {c.flag}
              </span>
            ))}
            {subscribedCountryObjs.length > 5 && (
              <span className="text-[10px] font-mono text-slate-400 ml-1 font-bold">
                +{subscribedCountryObjs.length - 5}
              </span>
            )}
          </div>

          <button
            onClick={onOpenFullDigest}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>Open Full Digest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alerts Cards Grid */}
      {topAlerts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topAlerts.map((alert) => {
            const countryObj = MENAT_COUNTRIES.find(
              (c) => c.id.toLowerCase() === alert.countryId.toLowerCase()
            );
            const isRead = preferences.readAlertIds.includes(alert.id);

            return (
              <div
                key={alert.id}
                onClick={onOpenFullDigest}
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-all cursor-pointer flex flex-col justify-between ${
                  !isRead
                    ? 'bg-slate-950/80 border-rose-500/40 hover:border-rose-500 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base">{countryObj?.flag || '🌐'}</span>
                      <span className="font-bold text-white text-[11px] truncate max-w-[90px]">
                        {alert.countryName}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                        alert.impactLevel === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {alert.impactLevel.toUpperCase()}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-white text-xs line-clamp-2 leading-snug">
                    {alert.title}
                  </h4>

                  {/* Summary snippet */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {alert.summary}
                  </p>
                </div>

                {/* Footer details */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="truncate max-w-[120px] text-slate-400">{alert.authority}</span>
                  <span className="text-rose-400 font-bold hover:underline flex items-center space-x-0.5">
                    <span>Inspect →</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <span>No critical statutory alerts outstanding for your active subscription profile.</span>
        </div>
      )}

      {/* Bottom Sub-bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center space-x-2">
          <span>Active filter:</span>
          <span className="text-slate-300 font-medium">
            {preferences.subscribedCountries.length} Countries • {preferences.subscribedSectors.length} Sectors
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              {unreadCount} unread
            </span>
          )}
        </div>

        <button
          onClick={onOpenFullDigest}
          className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center space-x-1 cursor-pointer transition-colors mt-2 sm:mt-0"
        >
          <span>Manage Alert Preferences &amp; View All ({subscribedAlerts.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
