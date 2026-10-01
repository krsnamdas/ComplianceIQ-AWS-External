import React, { useState, useMemo, useEffect } from 'react';
import {
  RoadmapMilestone,
  QuarterId,
  InvestmentCategory,
  OrgScale,
  RoadmapFilterState,
  BudgetApprovalStatus,
} from '../types/roadmap';
import {
  ROADMAP_QUARTERS,
  ROADMAP_MILESTONES,
  computeQuarterlySummaries,
} from '../data/regulatoryRoadmapData';
import { MENAT_COUNTRIES } from '../data/menatData';
import {
  CalendarClock,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Users,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  Download,
  Building,
  Sliders,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Cpu,
  Scale,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';

interface RegulatoryRoadmapProps {
  onSelectRegulation?: (regulationCode: string) => void;
  onSelectCountry?: (countryId: string) => void;
  onOpenAIChatWithPrompt?: (prompt: string) => void;
}

const ORG_SCALE_MULTIPLIERS: Record<OrgScale, { label: string; multiplier: number; description: string }> = {
  enterprise: {
    label: 'Enterprise / Sovereign Tier-1',
    multiplier: 1.8,
    description: 'Multi-jurisdiction operations, complex hybrid-cloud & OT footprint, high transaction volume.',
  },
  midmarket: {
    label: 'Mid-Market / Regional Entity',
    multiplier: 1.0,
    description: 'Baseline industry benchmark with single/dual jurisdiction footprint and standard IT scale.',
  },
  startup: {
    label: 'FinTech / High-Growth Startup',
    multiplier: 0.6,
    description: 'Cloud-native agile architecture with streamlined governance workflows.',
  },
};

const INVESTMENT_CATEGORIES: { id: InvestmentCategory; label: string; icon: any; color: string }[] = [
  { id: 'infrastructure_tooling', label: 'Infrastructure & Tooling', icon: Cpu, color: '#10b981' },
  { id: 'external_audit_assurance', label: 'External Audit & Assurance', icon: ShieldAlert, color: '#38bdf8' },
  { id: 'internal_resourcing_fte', label: 'Internal Resourcing & FTE', icon: Users, color: '#a855f7' },
  { id: 'legal_advisory_filings', label: 'Legal & Advisory Filings', icon: Scale, color: '#f59e0b' },
];

export const RegulatoryRoadmap: React.FC<RegulatoryRoadmapProps> = ({
  onSelectRegulation,
  onSelectCountry,
  onOpenAIChatWithPrompt,
}) => {
  // Filters state
  const [filters, setFilters] = useState<RoadmapFilterState>({
    quarter: 'all',
    countryId: 'all',
    sector: 'all',
    category: 'all',
    urgency: 'all',
    search: '',
    investmentCategory: 'all',
    orgScale: 'enterprise',
  });

  // Selected milestone for detail inspection modal
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone | null>(null);

  // Active chart view toggle: CapEx vs OpEx vs Category
  const [chartMetric, setChartMetric] = useState<'capex_opex' | 'categories'>('capex_opex');

  // Roadmap data.
  // Seeded synchronously from the in-code copy (identical first paint, no flash),
  // then hydrated from the region file-backed API (/api/roadmap) so admin/region
  // edits are reflected.
  const [milestonesData, setMilestonesData] = useState<RoadmapMilestone[]>(ROADMAP_MILESTONES);
  const [quartersData, setQuartersData] = useState(ROADMAP_QUARTERS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/roadmap')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.milestones) && data.milestones.length > 0) {
          setMilestonesData(data.milestones);
        }
        if (data && Array.isArray(data.quarters) && data.quarters.length > 0) {
          setQuartersData(data.quarters);
        }
      })
      .catch(() => {
        /* keep synchronous seed on error — no UI disruption */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Budget status overrides persisted in localStorage
  const [budgetStatuses, setBudgetStatuses] = useState<Record<string, BudgetApprovalStatus>>(() => {
    try {
      const stored = localStorage.getItem('menat_roadmap_budget_statuses');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleUpdateBudgetStatus = (milestoneId: string, status: BudgetApprovalStatus) => {
    setBudgetStatuses((prev) => {
      const next = { ...prev, [milestoneId]: status };
      try {
        localStorage.setItem('menat_roadmap_budget_statuses', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save budget status', e);
      }
      return next;
    });
  };

  const scaleConfig = ORG_SCALE_MULTIPLIERS[filters.orgScale];
  const scaleMultiplier = scaleConfig.multiplier;

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return milestonesData.filter((m) => {
      // Quarter filter
      if (filters.quarter === 'next4') {
        const next4 = ['2026-Q4', '2027-Q1', '2027-Q2', '2027-Q3'];
        if (!next4.includes(m.quarter)) return false;
      } else if (filters.quarter === '2027') {
        if (!m.quarter.startsWith('2027')) return false;
      } else if (filters.quarter === '2028') {
        if (!m.quarter.startsWith('2028')) return false;
      } else if (filters.quarter !== 'all') {
        if (m.quarter !== filters.quarter) return false;
      }

      // Country filter
      if (filters.countryId !== 'all' && m.countryId !== filters.countryId) {
        return false;
      }

      // Sector filter
      if (filters.sector !== 'all') {
        if (!m.targetSectors.includes(filters.sector as any)) return false;
      }

      // Urgency filter
      if (filters.urgency !== 'all' && m.urgency !== filters.urgency) {
        return false;
      }

      // Investment category filter
      if (filters.investmentCategory !== 'all') {
        const hasWorkstream = m.workstreams.some((w) => w.category === filters.investmentCategory);
        if (!hasWorkstream) return false;
      }

      // Search query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchCode = m.regulationCode.toLowerCase().includes(q);
        const matchAuth = m.authority.toLowerCase().includes(q) || m.authorityShort.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchTech = m.recommendedTechStack?.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCode && !matchAuth && !matchDesc && !matchTech) {
          return false;
        }
      }

      return true;
    });
  }, [filters, milestonesData]);

  // Quarterly progression summaries computed with scale multiplier
  const quarterlySummaries = useMemo(() => {
    return computeQuarterlySummaries(filteredMilestones, scaleMultiplier);
  }, [filteredMilestones, scaleMultiplier]);

  // Executive Rollup Metrics
  const metrics = useMemo(() => {
    const totalInvestment = filteredMilestones.reduce(
      (acc, m) => acc + Math.round(m.baseInvestmentUSD * scaleMultiplier),
      0
    );
    const totalCapex = filteredMilestones.reduce(
      (acc, m) => acc + Math.round(m.capexUSD * scaleMultiplier),
      0
    );
    const totalOpex = filteredMilestones.reduce(
      (acc, m) => acc + Math.round(m.opexUSD * scaleMultiplier),
      0
    );

    // Next 12 months (Q4 2026 - Q3 2027)
    const next12MonthsQuarters = ['2026-Q4', '2027-Q1', '2027-Q2', '2027-Q3'];
    const next12MonthsInvestment = filteredMilestones
      .filter((m) => next12MonthsQuarters.includes(m.quarter))
      .reduce((acc, m) => acc + Math.round(m.baseInvestmentUSD * scaleMultiplier), 0);

    const totalFTE = filteredMilestones.reduce(
      (acc, m) =>
        acc +
        m.fteRequirementMonths *
          (scaleMultiplier >= 1.5 ? 1.4 : scaleMultiplier <= 0.7 ? 0.7 : 1.0),
      0
    );

    const criticalCount = filteredMilestones.filter((m) => m.urgency === 'Critical').length;
    const approvedBudgetCount = filteredMilestones.filter(
      (m) => budgetStatuses[m.id] === 'approved'
    ).length;

    // Investment Category breakdown
    const categoryTotals: Record<InvestmentCategory, number> = {
      infrastructure_tooling: 0,
      external_audit_assurance: 0,
      internal_resourcing_fte: 0,
      legal_advisory_filings: 0,
    };

    filteredMilestones.forEach((m) => {
      m.workstreams.forEach((w) => {
        categoryTotals[w.category] += Math.round(w.costUSD * scaleMultiplier);
      });
    });

    return {
      totalInvestment,
      totalCapex,
      totalOpex,
      next12MonthsInvestment,
      totalFTE: Number(totalFTE.toFixed(1)),
      criticalCount,
      approvedBudgetCount,
      categoryTotals,
    };
  }, [filteredMilestones, scaleMultiplier, budgetStatuses]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return quarterlySummaries.map((q) => {
      // Calculate by category if requested
      const catSums: Record<InvestmentCategory, number> = {
        infrastructure_tooling: 0,
        external_audit_assurance: 0,
        internal_resourcing_fte: 0,
        legal_advisory_filings: 0,
      };

      q.milestones.forEach((m) => {
        m.workstreams.forEach((w) => {
          catSums[w.category] += Math.round((w.costUSD * scaleMultiplier) / 1000); // in thousands
        });
      });

      return {
        quarter: q.quarterLabel,
        quarterId: q.quarter,
        year: q.year,
        totalUSDk: Math.round(q.totalInvestmentUSD / 1000),
        capexUSDk: Math.round(q.totalCapexUSD / 1000),
        opexUSDk: Math.round(q.totalOpexUSD / 1000),
        milestones: q.milestoneCount,
        critical: q.criticalCount,
        fteMonths: q.totalFteMonths,
        // categories in thousands
        infraUSDk: catSums.infrastructure_tooling,
        auditUSDk: catSums.external_audit_assurance,
        fteUSDk: catSums.internal_resourcing_fte,
        legalUSDk: catSums.legal_advisory_filings,
      };
    });
  }, [quarterlySummaries, scaleMultiplier]);

  // Format currency helper
  const formatUSD = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return `$${Math.round(amount / 1000)}k`;
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    const headers = [
      'Quarter',
      'Deadline Date',
      'Country',
      'Authority',
      'Regulation Code',
      'Regulation Name',
      'Milestone Title',
      'Urgency',
      'Enforcement Type',
      'Estimated Investment (USD)',
      'CapEx (USD)',
      'OpEx (USD)',
      'FTE Capacity (Months)',
      'Budget Approval Status',
      'Max Statutory Fine',
      'Target Sectors',
    ];

    const rows = filteredMilestones.map((m) => {
      const status = budgetStatuses[m.id] || 'pending_allocation';
      return [
        `"${m.quarterLabel}"`,
        `"${m.deadlineDate}"`,
        `"${m.countryName}"`,
        `"${m.authorityShort}"`,
        `"${m.regulationCode}"`,
        `"${m.regulationName}"`,
        `"${m.title.replace(/"/g, '""')}"`,
        `"${m.urgency}"`,
        `"${m.enforcementType}"`,
        Math.round(m.baseInvestmentUSD * scaleMultiplier),
        Math.round(m.capexUSD * scaleMultiplier),
        Math.round(m.opexUSD * scaleMultiplier),
        m.fteRequirementMonths,
        `"${status}"`,
        `"${m.maxStatutoryFine.replace(/"/g, '""')}"`,
        `"${m.targetSectors.join(', ')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MENAT_Regulatory_Investment_Roadmap_${filters.orgScale}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="regulatory-roadmap-dashboard" className="space-y-6">
      {/* Top Banner / Strategic Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-8 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Quarterly Investment Horizon 2026–2028</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Benchmark: Q4 2026</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
              <CalendarClock className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Regulatory Implementation Roadmap</span>
            </h1>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Track upcoming MENAT regulatory enforcement milestones as a quarterly progression. Forecast multi-year
              CapEx and OpEx requirements across cybersecurity, cloud data localization, AI ethics, and post-quantum
              mandates to defend your compliance budget.
            </p>
          </div>

          {/* Org Scale Selector & Export Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Organization Complexity Modulator */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col space-y-1 shadow-inner">
              <label htmlFor="org-scale-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Building className="w-3 h-3 text-emerald-400" />
                <span>Entity Scale Profile:</span>
              </label>
              <select
                id="org-scale-select"
                value={filters.orgScale}
                onChange={(e) => setFilters({ ...filters, orgScale: e.target.value as OrgScale })}
                className="bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="enterprise">Tier-1 Sovereign Enterprise (1.8x)</option>
                <option value="midmarket">Mid-Market / Regional Bank (1.0x)</option>
                <option value="startup">High-Growth FinTech Startup (0.6x)</option>
              </select>
            </div>

            {/* Export Plan Button */}
            <button
              id="export-roadmap-csv-btn"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer h-full"
              title="Download detailed multi-year compliance budget projection spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Budget Plan (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Executive Financial & Capacity Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Forecasted Compliance Investment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Total Projected Spend</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            {formatUSD(metrics.totalInvestment)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span className="text-emerald-400 font-semibold">{formatUSD(metrics.next12MonthsInvestment)}</span>
            <span>in next 12 months (Q4'26–Q3'27)</span>
          </div>
        </div>

        {/* Card 2: CapEx vs OpEx Allocation Split */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">CapEx / OpEx Split</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-baseline space-x-2">
            <span>{Math.round((metrics.totalCapex / (metrics.totalInvestment || 1)) * 100)}%</span>
            <span className="text-sm font-normal text-slate-400">CapEx</span>
            <span className="text-slate-600">/</span>
            <span className="text-lg font-bold text-indigo-400">
              {Math.round((metrics.totalOpex / (metrics.totalInvestment || 1)) * 100)}%
            </span>
            <span className="text-xs font-normal text-slate-400">OpEx</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>{formatUSD(metrics.totalCapex)} Tooling</span>
            <span>•</span>
            <span>{formatUSD(metrics.totalOpex)} Advisory & Audits</span>
          </div>
        </div>

        {/* Card 3: Milestone Volume & Statutory Urgency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Active Milestones</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-baseline space-x-2">
            <span>{filteredMilestones.length}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
              {metrics.criticalCount} Critical
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <span className="text-emerald-400 font-semibold">{metrics.approvedBudgetCount}</span>
            <span>funded or under board review</span>
          </div>
        </div>

        {/* Card 4: FTE Implementation Effort Required */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Workforce Demand</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-baseline space-x-1">
            <span>{metrics.totalFTE}</span>
            <span className="text-xs font-normal text-slate-400">Person-Months</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span>Avg ~{Number((metrics.totalFTE / (quartersData.length || 1)).toFixed(1))} FTE / Qtr</span>
            <span>•</span>
            <span className="text-cyan-400">DevSecOps & GRC</span>
          </div>
        </div>
      </div>

      {/* Main Quarterly Progression Chart & Investment Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <span>Quarterly Compliance Progression & Budget Trajectory</span>
            </h2>
            <p className="text-xs text-slate-400">
              Stacked bar indicates projected financial capital allocation ($ USD in thousands), line indicates
              statutory milestone delivery intensity.
            </p>
          </div>

          {/* Chart Display Mode Switcher */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start md:self-auto">
            <button
              id="chart-mode-capex-opex"
              onClick={() => setChartMetric('capex_opex')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMetric === 'capex_opex'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CapEx vs OpEx
            </button>
            <button
              id="chart-mode-categories"
              onClick={() => setChartMetric('categories')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMetric === 'categories'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Workstream Category
            </button>
          </div>
        </div>

        {/* Recharts Progression Visualizer */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="quarter"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                unit="k"
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 max-w-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-extrabold text-white text-sm">{label}</span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            ${data.totalUSDk * 1000 >= 1000000 ? `${(data.totalUSDk / 1000).toFixed(2)}M` : `$${data.totalUSDk}k`} Total
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-400">CapEx (Tooling & HW):</span>
                            <span className="font-mono text-emerald-400 font-bold">${data.capexUSDk}k</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">OpEx (Audits & Counsel):</span>
                            <span className="font-mono text-indigo-400 font-bold">${data.opexUSDk}k</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-400">Milestone Deadlines:</span>
                            <span className="font-semibold text-white">
                              {data.milestones} ({data.critical} Critical)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Required FTE Effort:</span>
                            <span className="font-semibold text-cyan-400">{data.fteMonths} person-months</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              {chartMetric === 'capex_opex' ? (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="capexUSDk"
                    name="CapEx (Tooling & Licenses)"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="opexUSDk"
                    name="OpEx (Audits & Resourcing)"
                    stackId="a"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              ) : (
                <>
                  <Bar
                    yAxisId="left"
                    dataKey="infraUSDk"
                    name="Tooling & Infrastructure"
                    stackId="b"
                    fill="#10b981"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="auditUSDk"
                    name="External Audit & Certification"
                    stackId="b"
                    fill="#38bdf8"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="fteUSDk"
                    name="Internal Resourcing (FTE)"
                    stackId="b"
                    fill="#a855f7"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="legalUSDk"
                    name="Legal & Advisory Filings"
                    stackId="b"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </>
              )}

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="milestones"
                name="Milestones Volume"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f43f5e' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Investment Distribution Category Bars */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Long-Term Compliance Investment Distribution by Workstream Category</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Based on {scaleConfig.label} Profile
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {INVESTMENT_CATEGORIES.map((cat) => {
              const catTotal = metrics.categoryTotals[cat.id];
              const pct = Math.round((catTotal / (metrics.totalInvestment || 1)) * 100);
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      investmentCategory: filters.investmentCategory === cat.id ? 'all' : cat.id,
                    })
                  }
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    filters.investmentCategory === cat.id
                      ? 'bg-slate-800 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      <span className="text-xs font-semibold text-slate-200">{cat.label}</span>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-mono">{formatUSD(catTotal)}</span>
                    <span className="text-slate-500 hover:text-slate-300 text-[10px]">
                      {filters.investmentCategory === cat.id ? 'Active Filter ✕' : 'Filter by workstream'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Horizon Quick Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-slate-400 font-semibold text-xs mr-1 shrink-0 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Horizon:</span>
            </span>

            {[
              { id: 'all', label: 'All Quarters (2026–2028)' },
              { id: 'next4', label: 'Next 4 Quarters (12 Months)' },
              { id: '2027', label: '2027 Horizon' },
              { id: '2028', label: '2028 Horizon' },
              { id: '2026-Q4', label: 'Q4 2026' },
              { id: '2027-Q1', label: 'Q1 2027' },
              { id: '2027-Q2', label: 'Q2 2027' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilters({ ...filters, quarter: p.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  filters.quarter === p.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Milestone count & Reset */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 shrink-0">
            <span>
              Showing <strong className="text-white">{filteredMilestones.length}</strong> of{' '}
              {milestonesData.length} milestones
            </span>
            {(filters.countryId !== 'all' ||
              filters.sector !== 'all' ||
              filters.urgency !== 'all' ||
              filters.quarter !== 'all' ||
              filters.investmentCategory !== 'all' ||
              filters.search) && (
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    quarter: 'all',
                    countryId: 'all',
                    sector: 'all',
                    category: 'all',
                    urgency: 'all',
                    search: '',
                    investmentCategory: 'all',
                  })
                }
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Detailed Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search milestone, framework, or tech stack..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Jurisdiction Dropdown */}
          <div>
            <select
              value={filters.countryId}
              onChange={(e) => setFilters({ ...filters, countryId: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Jurisdictions</option>
              {MENAT_COUNTRIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <select
              value={filters.sector}
              onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Industry Sectors</option>
              <option value="Banking">Banking & Financial Services</option>
              <option value="Fintech">Payments & FinTech</option>
              <option value="Government">Government & Public Sector</option>
              <option value="Critical Infrastructure">Critical Infrastructure & Utilities</option>
              <option value="Oil & Gas">Oil & Gas / Energy</option>
              <option value="Cloud & Hyperscalers">Cloud & Hyperscalers</option>
              <option value="Telco">Telecommunications</option>
              <option value="Healthcare">Healthcare & Life Sciences</option>
              <option value="Retail & E-Commerce">Retail & E-Commerce</option>
              <option value="Digital Tech Startups">Digital Tech Startups</option>
              <option value="Space & Aerospace">Space & Aerospace</option>
              <option value="Automotive">Automotive & Autonomous Systems</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div>
            <select
              value={filters.urgency}
              onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Regulatory Urgency Tiers</option>
              <option value="Critical">Critical (Immediate Audit / Injunction Risk)</option>
              <option value="High">High (Substantial Fines / Transition Cutoff)</option>
              <option value="Medium">Medium (Supervisory Notice / Phased Prep)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Milestones Implementation Progression List */}
      <div className="space-y-4">
        {filteredMilestones.length > 0 ? (
          filteredMilestones.map((m) => {
            const milestoneSpend = Math.round(m.baseInvestmentUSD * scaleMultiplier);
            const capexSpend = Math.round(m.capexUSD * scaleMultiplier);
            const opexSpend = Math.round(m.opexUSD * scaleMultiplier);
            const status = budgetStatuses[m.id] || 'pending_allocation';

            return (
              <div
                key={m.id}
                id={`milestone-card-${m.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl" title={m.countryName}>
                      {m.countryFlag}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {m.regulationCode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• {m.authorityShort}</span>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {m.quarterLabel} ({m.phaseName})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Urgency Badge */}
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border flex items-center space-x-1 ${
                        m.urgency === 'Critical'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                          : m.urgency === 'High'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                          : 'bg-blue-500/15 text-blue-300 border-blue-500/35'
                      }`}
                    >
                      {m.urgency === 'Critical' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      )}
                      <span>{m.urgency} Urgency</span>
                    </span>

                    {/* Deadline Badge */}
                    <span className="px-2.5 py-0.5 text-[11px] font-mono font-medium rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{m.deadlineDate}</span>
                    </span>
                  </div>
                </div>

                {/* Milestone Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                </div>

                {/* Investment & Penalty Metrics Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
                  {/* Metric 1: Projected Investment */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Est. Total Investment
                    </span>
                    <div className="text-base font-extrabold text-emerald-400 font-mono">
                      {formatUSD(milestoneSpend)}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <span>CapEx: {formatUSD(capexSpend)}</span>
                      <span>•</span>
                      <span>OpEx: {formatUSD(opexSpend)}</span>
                    </div>
                  </div>

                  {/* Metric 2: Required Capacity */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Internal Capacity
                    </span>
                    <div className="text-base font-bold text-cyan-400 font-mono flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{m.fteRequirementMonths} person-months</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {m.primaryCompetencies?.[0] || 'GRC & Security Engineering'}
                    </div>
                  </div>

                  {/* Metric 3: Fine Avoidance / Sanction Protection */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Statutory Fine Exposure
                    </span>
                    <div className="text-xs font-bold text-amber-300 line-clamp-1" title={m.maxStatutoryFine}>
                      {m.maxStatutoryFine}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {m.enforcementType}
                    </div>
                  </div>

                  {/* Metric 4: Interactive Budget Approval Switcher */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                      <span>Compliance Budget Status:</span>
                    </span>
                    <select
                      value={status}
                      onChange={(e) => handleUpdateBudgetStatus(m.id, e.target.value as BudgetApprovalStatus)}
                      className={`w-full px-2 py-1 text-xs font-bold rounded-lg border focus:outline-none cursor-pointer ${
                        status === 'approved'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : status === 'under_review'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : status === 'deferred'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      <option value="approved">✓ Budget Approved / Funded</option>
                      <option value="under_review">⏳ Under Board Audit Review</option>
                      <option value="pending_allocation">○ Pending FY Budget Allocation</option>
                      <option value="deferred">✕ Deferred / Waiver Request</option>
                    </select>
                  </div>
                </div>

                {/* Target Sectors & Action Items Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500">Applicable:</span>
                    {m.targetSectors.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                      >
                        {s}
                      </span>
                    ))}
                    {m.targetSectors.length > 4 && (
                      <span className="text-slate-500 text-[10px]">+{m.targetSectors.length - 4} more</span>
                    )}
                  </div>

                  {/* Actions & Detail Modal Launcher */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {onOpenAIChatWithPrompt && (
                      <button
                        onClick={() =>
                          onOpenAIChatWithPrompt(
                            `Advise our compliance steering committee on implementing ${m.regulationCode} (${m.title}) scheduled for ${m.quarterLabel}. What are the priority technical investments, CapEx hardware/tooling needs, and audit attestation steps?`
                          )
                        }
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1 transition-colors cursor-pointer"
                        title="Consult Autonomous AI Compliance Copilot for implementation strategy"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Advisory</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMilestone(m)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <span>Inspect Workstreams</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <CalendarClock className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-bold text-white text-base">No milestones match the selected filter criteria</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting the horizon view, clearing your search keyword, or selecting "All Quarters".
            </p>
            <button
              onClick={() =>
                setFilters({
                  ...filters,
                  quarter: 'all',
                  countryId: 'all',
                  sector: 'all',
                  urgency: 'all',
                  investmentCategory: 'all',
                  search: '',
                })
              }
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Milestone Detail & Workstream Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1.5 pr-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{selectedMilestone.countryFlag}</span>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {selectedMilestone.regulationCode}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• {selectedMilestone.authority}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  {selectedMilestone.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-400">
                  <span>Enforcement Target: <strong className="text-white">{selectedMilestone.deadlineDate}</strong></span>
                  <span>•</span>
                  <span>Quarter: <strong className="text-indigo-400">{selectedMilestone.quarterLabel}</strong></span>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">{selectedMilestone.urgency} Urgency</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedMilestone(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Regulatory Description */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
              <span className="font-bold text-white block">Statutory Mandate & Executive Summary:</span>
              <p>{selectedMilestone.description}</p>
            </div>

            {/* Workstreams Financial Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Itemized Compliance Workstreams & Cost Allocation</span>
                </h4>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Total: {formatUSD(Math.round(selectedMilestone.baseInvestmentUSD * scaleMultiplier))}
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Pillar / Category</th>
                      <th className="py-2.5 px-3 font-semibold">Workstream Scope</th>
                      <th className="py-2.5 px-3 font-semibold">Classification</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Projected (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {selectedMilestone.workstreams.map((w, idx) => {
                      const cost = Math.round(w.costUSD * scaleMultiplier);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-medium text-slate-200">
                            {w.categoryName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{w.description}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.capexRatio >= 0.5
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}
                            >
                              {w.capexRatio >= 0.5 ? 'CapEx (Asset)' : 'OpEx (Service)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            {formatUSD(cost)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommended Tech Stack & Key Competencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Recommended Tooling & Architecture:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMilestone.recommendedTechStack?.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Key Skillsets & Team Allocation:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMilestone.primaryCompetencies?.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Implementation Action Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-white block">Statutory Compliance Action Checklist:</span>
              <div className="space-y-1.5">
                {selectedMilestone.actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start space-x-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Penalties & Intervention Risk Callout */}
            <div className="bg-rose-950/20 border border-rose-500/30 p-4 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Statutory Sanctions & Executive Exposure:</span>
              </div>
              <p className="text-slate-300">
                <strong>Maximum Statutory Fine:</strong> {selectedMilestone.maxStatutoryFine}
              </p>
              <p className="text-slate-400">
                <strong>Supervisory Intervention:</strong> {selectedMilestone.regulatoryInterventionRisk}
              </p>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {selectedMilestone.officialUrl ? (
                <a
                  href={selectedMilestone.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>Official Authority Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span />
              )}

              <button
                onClick={() => setSelectedMilestone(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
