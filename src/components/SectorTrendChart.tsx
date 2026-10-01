import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { SectorType, Regulation } from '../types/regulatory';
import {
  calculateSectorTrendData,
  generateCrossSectorComparisonData,
  MonthlySectorDataPoint,
} from '../data/sectorTrendData';
import {
  TrendingUp,
  BarChart3,
  Layers,
  GitCompare,
  Calendar,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Info,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface SectorTrendChartProps {
  selectedSector: SectorType;
  regulations: Regulation[];
  onSelectSector?: (sector: SectorType) => void;
  onViewRegulation?: (regulationId: string) => void;
}

type ChartViewMode = 'cumulative' | 'velocity' | 'domains' | 'compare';
type TimeGranularity = 'monthly' | 'quarterly';

export const SectorTrendChart: React.FC<SectorTrendChartProps> = ({
  selectedSector,
  regulations,
  onSelectSector,
  onViewRegulation,
}) => {
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('cumulative');
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly');
  const [activeMilestone, setActiveMilestone] = useState<MonthlySectorDataPoint | null>(null);

  // Calculate sector-specific trend
  const trendData = useMemo(() => {
    return calculateSectorTrendData(selectedSector, regulations);
  }, [selectedSector, regulations]);

  // Calculate comparative cross-sector points
  const comparativeData = useMemo(() => {
    return generateCrossSectorComparisonData(regulations);
  }, [regulations]);

  // Aggregate quarterly data if quarterly granularity selected
  const displayMonthlyPoints = useMemo(() => {
    if (granularity === 'monthly') {
      return trendData.monthlyPoints;
    }

    // Group into 4 quarters
    const quarters: Record<string, {
      month: string;
      monthFull: string;
      quarter: string;
      cumulativeVolume: number;
      newEnactments: number;
      amendmentsCount: number;
      totalActiveControls: number;
      domainBreakdown: {
        cyber: number;
        cloud: number;
        ai: number;
        privacy: number;
        resilience: number;
      };
      highlightEvent?: MonthlySectorDataPoint['highlightEvent'];
    }> = {};

    trendData.monthlyPoints.forEach((p) => {
      if (!quarters[p.quarter]) {
        quarters[p.quarter] = {
          month: p.quarter,
          monthFull: p.quarter,
          quarter: p.quarter,
          cumulativeVolume: p.cumulativeVolume,
          newEnactments: p.newEnactments,
          amendmentsCount: p.amendmentsCount,
          totalActiveControls: p.totalActiveControls,
          domainBreakdown: { ...p.domainBreakdown },
          highlightEvent: p.highlightEvent,
        };
      } else {
        // Take latest cumulative count in the quarter
        quarters[p.quarter].cumulativeVolume = p.cumulativeVolume;
        quarters[p.quarter].newEnactments += p.newEnactments;
        quarters[p.quarter].amendmentsCount += p.amendmentsCount;
        quarters[p.quarter].totalActiveControls = p.totalActiveControls;
        quarters[p.quarter].domainBreakdown = { ...p.domainBreakdown };
        if (p.highlightEvent) {
          quarters[p.quarter].highlightEvent = p.highlightEvent;
        }
      }
    });

    return Object.values(quarters);
  }, [trendData, granularity]);

  // Milestone events for the sector over the past year
  const milestones = useMemo(() => {
    return trendData.monthlyPoints.filter((p) => !!p.highlightEvent);
  }, [trendData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Chart Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              12-Month Regulatory Volume & Velocity Analysis
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Oct 2025 – Sep 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking statutory volume expansion, circular velocity, and control density changes across the <strong className="text-slate-200">{selectedSector}</strong> industry.
          </p>
        </div>

        {/* View and Granularity Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Toggle */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                granularity === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setGranularity('quarterly')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                granularity === 'quarterly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarterly
            </button>
          </div>

          {/* Perspective View Modes */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setChartViewMode('cumulative')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                viewMode === 'cumulative'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Active cumulative governing regulations trajectory"
            >
              <TrendingUp className="w-3 h-3" />
              <span>Cumulative</span>
            </button>

            <button
              onClick={() => setChartViewMode('velocity')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                viewMode === 'velocity'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Monthly new enactments and official circular amendments"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Velocity</span>
            </button>

            <button
              onClick={() => setChartViewMode('domains')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                viewMode === 'domains'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Domain-specific breakdown trajectory"
            >
              <Layers className="w-3 h-3" />
              <span>Domains</span>
            </button>

            <button
              onClick={() => setChartViewMode('compare')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center space-x-1.5 transition-colors ${
                viewMode === 'compare'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Compare with other key MENAT sectors"
            >
              <GitCompare className="w-3 h-3" />
              <span>Cross-Sector</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>1 Year Ago (Oct '25)</span>
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">{trendData.startVolume}</span>
            <span className="text-xs text-slate-400">Regulations</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Baseline active mandates</div>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Current (Sep '26)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-emerald-400">{trendData.currentVolume}</span>
            <span className="text-xs text-slate-400">Regulations</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">In-force governing corpus</div>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>12-Month Net Growth</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-teal-400">+{trendData.percentageGrowth}%</span>
            <span className="text-xs text-slate-400 font-mono">+{trendData.netChange} regs</span>
          </div>
          <div className="mt-1 text-[11px] text-teal-300/80">
            {trendData.totalNewEnactments} new laws, {trendData.totalAmendments} circulars
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Highest Velocity Vector</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-sm font-bold text-white truncate" title={trendData.fastestGrowingDomain}>
            {trendData.fastestGrowingDomain.split('(')[0]}
          </div>
          <div className="mt-1 text-[11px] text-amber-400/90 font-mono">
            {trendData.fastestGrowingDomain.includes('(') ? trendData.fastestGrowingDomain.split('(')[1].replace(')', '') : 'Accelerating'}
          </div>
        </div>
      </div>

      {/* Primary Chart Canvas */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-200">
              {viewMode === 'cumulative' && `${selectedSector} Regulatory Volume Progression`}
              {viewMode === 'velocity' && `${selectedSector} Monthly New Enactments & Official Circulars`}
              {viewMode === 'domains' && `${selectedSector} Compliance Domain Volume Distribution`}
              {viewMode === 'compare' && `Cross-Sector Regulatory Burden Growth Comparison (Top 8 MENAT Sectors)`}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">
              {granularity === 'monthly' ? '12 Monthly Data Points' : '4 Rolling Quarters'}
            </span>
          </div>

          {/* Quick Info text */}
          <div className="hidden sm:flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Info className="w-3 h-3 text-slate-500" />
            <span>Hover points for circular and enactment details</span>
          </div>
        </div>

        {/* RECHARTS CANVAS */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'cumulative' ? (
              <AreaChart data={displayMonthlyPoints} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="sectorAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 'auto']} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlySectorDataPoint;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1.5">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{data.monthFull || label}</span>
                            <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.2 bg-emerald-950/60 rounded border border-emerald-800">
                              {data.quarter}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Active In-Force Mandates:</span>
                            <span className="font-extrabold text-emerald-400 font-mono text-sm">
                              {data.cumulativeVolume}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Approx. Enforceable Controls:</span>
                            <span className="font-mono text-slate-200">{data.totalActiveControls}</span>
                          </div>
                          {data.newEnactments > 0 && (
                            <div className="text-[11px] text-teal-300 font-medium">
                              +{data.newEnactments} New Enactment{data.newEnactments > 1 ? 's' : ''} in month
                            </div>
                          )}
                          {data.highlightEvent && (
                            <div className="mt-1 pt-1.5 border-t border-slate-800/80 text-[11px] text-slate-300">
                              <span className="text-amber-400 font-semibold block">
                                {data.highlightEvent.countryFlag} {data.highlightEvent.code}:
                              </span>
                              <span className="text-slate-400 text-[10px] line-clamp-2">
                                {data.highlightEvent.title}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeVolume"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sectorAreaFill)"
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : viewMode === 'velocity' ? (
              <BarChart data={displayMonthlyPoints} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlySectorDataPoint;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.monthFull || label}
                          </div>
                          <div className="flex items-center justify-between text-teal-400">
                            <span>New Statutory Enactments:</span>
                            <span className="font-bold font-mono">{data.newEnactments}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span>Regulatory Circulars/Amendments:</span>
                            <span className="font-bold font-mono">{data.amendmentsCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                            <span>Total Active Mandates:</span>
                            <span className="font-mono text-white">{data.cumulativeVolume}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
                  formatter={(value) => (value === 'newEnactments' ? 'New Enactments' : 'Circulars & Amendments')}
                />
                <Bar dataKey="newEnactments" fill="#10b981" radius={[4, 4, 0, 0]} name="newEnactments" />
                <Bar dataKey="amendmentsCount" fill="#0284c7" radius={[4, 4, 0, 0]} name="amendmentsCount" />
              </BarChart>
            ) : viewMode === 'domains' ? (
              <AreaChart data={displayMonthlyPoints} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlySectorDataPoint;
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {data.monthFull || label} - Domain Breakdown
                          </div>
                          <div className="text-emerald-400 flex justify-between">
                            <span>Cyber Defense:</span>
                            <span className="font-mono font-bold">{data.domainBreakdown.cyber}</span>
                          </div>
                          <div className="text-teal-400 flex justify-between">
                            <span>Cloud & Sovereignty:</span>
                            <span className="font-mono font-bold">{data.domainBreakdown.cloud}</span>
                          </div>
                          <div className="text-amber-400 flex justify-between">
                            <span>AI & Algorithms:</span>
                            <span className="font-mono font-bold">{data.domainBreakdown.ai}</span>
                          </div>
                          <div className="text-sky-400 flex justify-between">
                            <span>Privacy & PDPL:</span>
                            <span className="font-mono font-bold">{data.domainBreakdown.privacy}</span>
                          </div>
                          <div className="text-indigo-400 flex justify-between">
                            <span>Operational Resilience:</span>
                            <span className="font-mono font-bold">{data.domainBreakdown.resilience}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Area type="monotone" dataKey="domainBreakdown.cyber" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Cyber Defense" />
                <Area type="monotone" dataKey="domainBreakdown.cloud" stackId="1" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} name="Cloud & Sovereignty" />
                <Area type="monotone" dataKey="domainBreakdown.ai" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="AI & Algorithms" />
                <Area type="monotone" dataKey="domainBreakdown.privacy" stackId="1" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.6} name="Privacy & PDPL" />
                <Area type="monotone" dataKey="domainBreakdown.resilience" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name="Resilience" />
              </AreaChart>
            ) : (
              <LineChart data={comparativeData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl max-w-xs text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {label} - Cumulative Volume by Sector
                          </div>
                          {payload.map((entry) => (
                            <div key={entry.name} className="flex items-center justify-between" style={{ color: entry.color }}>
                              <span>{entry.name}:</span>
                              <span className="font-mono font-bold">{entry.value} regs</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Line type="monotone" dataKey="Banking" stroke="#10b981" strokeWidth={selectedSector === 'Banking' ? 3.5 : 1.8} dot={false} />
                <Line type="monotone" dataKey="Government" stroke="#38bdf8" strokeWidth={selectedSector === 'Government' ? 3.5 : 1.8} dot={false} />
                <Line type="monotone" dataKey="Critical Infrastructure" stroke="#f59e0b" strokeWidth={selectedSector === 'Critical Infrastructure' ? 3.5 : 1.8} dot={false} />
                <Line type="monotone" dataKey="Cloud & Hyperscalers" stroke="#a855f7" strokeWidth={selectedSector === 'Cloud & Hyperscalers' ? 3.5 : 1.8} dot={false} />
                <Line type="monotone" dataKey="Fintech" stroke="#ec4899" strokeWidth={selectedSector === 'Fintech' ? 3.5 : 1.8} dot={false} />
                <Line type="monotone" dataKey="Telco" stroke="#06b6d4" strokeWidth={selectedSector === 'Telco' ? 3.5 : 1.8} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Past-Year Sector Milestones Timeline */}
      {milestones.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Key Statutory Actions & Enactments Driving 12-Month Volume:</span>
            </h4>
            <span className="text-slate-500 text-[11px]">{milestones.length} Recorded Milestones</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {milestones.map((point) => {
              const event = point.highlightEvent!;
              return (
                <div
                  key={point.month}
                  className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between text-xs space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/70">
                        {point.monthFull}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          event.type === 'Enactment'
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                            : event.type === 'Enforcement Deadline'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>

                    <div className="mt-2 font-bold text-white text-xs flex items-center space-x-1.5">
                      <span>{event.countryFlag}</span>
                      <span>{event.code}</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {event.title}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{event.authority}</span>
                    <span className="text-slate-500">{event.country}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
