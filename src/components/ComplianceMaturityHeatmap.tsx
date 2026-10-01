import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  ShieldAlert,
  Cpu,
  Lock,
  Cloud,
  Coins,
  Activity,
  Radio,
  Sliders,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  TrendingUp,
  X,
  Share2,
} from 'lucide-react';
import {
  MATURITY_SECTORS,
  generateComplianceMaturityMatrix,
  generateCountryMaturitySummaries,
  getSectorTopPerformers,
} from '../data/complianceMaturityData';
import {
  MaturitySectorId,
  MaturitySectorInfo,
  HeatmapCellData,
  CountryMaturitySummary,
  HeatmapFilterState,
} from '../types/heatmap';

interface ComplianceMaturityHeatmapProps {
  onSelectRegulation?: (regulationCode: string) => void;
  onOpenAIChatWithPrompt?: (promptText: string) => void;
}

export const ComplianceMaturityHeatmap: React.FC<ComplianceMaturityHeatmapProps> = ({
  onSelectRegulation,
  onOpenAIChatWithPrompt,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter and view states
  const [selectedSector, setSelectedSector] = useState<MaturitySectorId | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [metric, setMetric] = useState<'score' | 'regulationsCount' | 'mandatoryControlsCount'>('score');
  const [sortBy, setSortBy] = useState<'density' | 'maturity' | 'alphabetical' | 'region'>('density');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected cell for drill-down inspection
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);

  // Hover state
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // AI Gap Analysis modal / loading state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<{ title: string; url: string }[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);

  // Master data.
  // Seeded synchronously from the in-code generators so the first paint is
  // identical and there is no loading flash, then hydrated from the region
  // file-backed API (/api/maturity/heatmap) so admin/region edits are reflected.
  const [matrixData, setMatrixData] = useState<HeatmapCellData[]>(() => generateComplianceMaturityMatrix());
  const [countrySummaries, setCountrySummaries] = useState<CountryMaturitySummary[]>(() => generateCountryMaturitySummaries());

  useEffect(() => {
    let cancelled = false;
    fetch('/api/maturity/heatmap')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.matrix) && data.matrix.length > 0) {
          setMatrixData(data.matrix);
        }
        if (data && Array.isArray(data.countrySummaries) && data.countrySummaries.length > 0) {
          setCountrySummaries(data.countrySummaries);
        }
      })
      .catch(() => {
        /* keep the synchronous seed on error — no UI disruption */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filtered and sorted countries list
  const displayCountries = useMemo(() => {
    let list = [...countrySummaries];

    // Filter by Region
    if (selectedRegion !== 'all') {
      list = list.filter((c) => c.region === selectedRegion);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.countryName.toLowerCase().includes(q) ||
          c.countryId.toLowerCase().includes(q) ||
          c.primaryEnforcementAuthority.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'density') {
      if (selectedSector !== 'all') {
        list.sort((a, b) => (b.sectorRanks[selectedSector] || 0) - (a.sectorRanks[selectedSector] || 0));
      } else {
        list.sort((a, b) => b.totalMandatoryControls - a.totalMandatoryControls);
      }
    } else if (sortBy === 'maturity') {
      list.sort((a, b) => b.overallMaturityScore - a.overallMaturityScore);
    } else if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.countryName.localeCompare(b.countryName));
    } else if (sortBy === 'region') {
      list.sort((a, b) => a.region.localeCompare(b.region) || b.overallMaturityScore - a.overallMaturityScore);
    }

    return list;
  }, [countrySummaries, selectedRegion, selectedSector, sortBy, searchQuery]);

  // Filtered cells for D3 rendering
  const activeCells = useMemo(() => {
    const countryIdSet = new Set(displayCountries.map((c) => c.countryId));
    let cells = matrixData.filter((c) => countryIdSet.has(c.countryId));

    if (selectedSector !== 'all') {
      cells = cells.filter((c) => c.sectorId === selectedSector);
    }

    return cells;
  }, [matrixData, displayCountries, selectedSector]);

  // Sector top performers for quick intelligence cards
  const topAI = useMemo(() => getSectorTopPerformers('ai', 4), []);
  const topCyber = useMemo(() => getSectorTopPerformers('cyber', 4), []);
  const topPrivacy = useMemo(() => getSectorTopPerformers('privacy', 4), []);

  // Set default selected cell on load
  useEffect(() => {
    if (!selectedCell && matrixData.length > 0) {
      const ksaAi = matrixData.find((c) => c.countryId === 'ksa' && c.sectorId === 'ai');
      setSelectedCell(ksaAi || matrixData[0]);
    }
  }, [matrixData, selectedCell]);

  // D3 Heatmap Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const activeSectors =
      selectedSector === 'all' ? MATURITY_SECTORS : MATURITY_SECTORS.filter((s) => s.id === selectedSector);

    // Rotated column labels need extra headroom so they don't clip above the SVG.
    const willRotateHeaders = activeSectors.length > 3;
    const margin = { top: willRotateHeaders ? 96 : 40, right: 30, bottom: 20, left: 190 };
    const rowHeight = 34;
    const height = Math.max(380, displayCountries.length * rowHeight + margin.top + margin.bottom);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Sectors
    const xScale = d3
      .scaleBand<string>()
      .domain(activeSectors.map((s) => s.id))
      .range([0, innerWidth])
      .padding(0.08);

    // Y Scale: Countries
    const yScale = d3
      .scaleBand<string>()
      .domain(displayCountries.map((c) => c.countryId))
      .range([0, innerHeight])
      .padding(0.12);

    // Color Scales
    // Score: 0 (deep slate/navy) -> 50 (cyan/teal) -> 80 (emerald) -> 100 (vibrant gold/emerald)
    const colorScaleScore = d3
      .scaleLinear<string>()
      .domain([0, 30, 60, 85, 100])
      .range(['#0f172a', '#1e293b', '#0d9488', '#10b981', '#34d399']);

    const colorScaleRegs = d3
      .scaleLinear<string>()
      .domain([0, 1, 3, 6])
      .range(['#1e293b', '#0284c7', '#0ea5e9', '#38bdf8']);

    const colorScaleCtrls = d3
      .scaleLinear<string>()
      .domain([0, 10, 40, 100])
      .range(['#1e293b', '#6366f1', '#8b5cf6', '#a855f7']);

    // Draw Column Headers (Sectors)
    // When many sectors are shown, the column bands become too narrow for the
    // horizontal labels and they overlap. We rotate the labels when the band is
    // tight, and keep them horizontal (centered) when there's plenty of room
    // (e.g. a single sector is selected).
    // Use the same decision as the top-margin calculation to guarantee the
    // rotated labels always have the headroom reserved for them.
    const rotateHeaders = willRotateHeaders;

    const columnHeaders = g
      .append('g')
      .attr('class', 'column-headers')
      .selectAll('g')
      .data(activeSectors)
      .enter()
      .append('g')
      .attr(
        'transform',
        (d) => `translate(${(xScale(d.id) || 0) + xScale.bandwidth() / 2}, -10)`
      );

    columnHeaders
      .append('text')
      .attr('text-anchor', rotateHeaders ? 'start' : 'middle')
      .attr('transform', rotateHeaders ? 'rotate(-40)' : null)
      .attr('fill', 'var(--heatmap-axis-header, #94a3b8)')
      .attr('font-size', rotateHeaders ? '11px' : '12px')
      .attr('font-weight', '600')
      .text((d) => d.shortName);

    // Draw Row Headers (Countries)
    const rowHeaders = g
      .append('g')
      .attr('class', 'row-headers')
      .selectAll('g')
      .data(displayCountries)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(-12, ${(yScale(d.countryId) || 0) + yScale.bandwidth() / 2})`);

    rowHeaders
      .append('text')
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d) => (selectedCell?.countryId === d.countryId ? '#38bdf8' : 'var(--heatmap-axis-label, #e2e8f0)'))
      .attr('font-size', '12px')
      .attr('font-weight', (d) => (selectedCell?.countryId === d.countryId ? '700' : '500'))
      .text((d) => `${d.countryFlag}  ${d.countryName.length > 20 ? d.countryName.slice(0, 19) + '…' : d.countryName}`);

    // Draw Heatmap Cells
    const cellsGroup = g.append('g').attr('class', 'cells');

    const cellElements = cellsGroup
      .selectAll<SVGGElement, HeatmapCellData>('g')
      .data(activeCells, (d) => `${d.countryId}-${d.sectorId}`)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${xScale(d.sectorId) || 0}, ${yScale(d.countryId) || 0})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredCell(d);
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => {
        setHoveredCell(null);
      })
      .on('click', (_, d) => {
        setSelectedCell(d);
      });

    // Cell Background Rect
    cellElements
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', (d) => {
        if (metric === 'score') return colorScaleScore(d.score);
        if (metric === 'regulationsCount') return colorScaleRegs(d.regulationsCount);
        return colorScaleCtrls(d.mandatoryControlsCount);
      })
      .attr('stroke', (d) => {
        if (selectedCell?.countryId === d.countryId && selectedCell?.sectorId === d.sectorId) {
          return '#38bdf8';
        }
        return '#334155';
      })
      .attr('stroke-width', (d) => {
        if (selectedCell?.countryId === d.countryId && selectedCell?.sectorId === d.sectorId) {
          return 2.5;
        }
        return 1;
      })
      .attr('stroke-opacity', 0.6)
      .transition()
      .duration(300)
      .style('opacity', 1);

    // Cell Label (Score / Count)
    cellElements
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (d) => (d.score > 60 || metric !== 'score' ? '#ffffff' : '#cbd5e1'))
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text((d) => {
        if (metric === 'score') return d.score;
        if (metric === 'regulationsCount') return `${d.regulationsCount} regs`;
        return `${d.mandatoryControlsCount} ctrls`;
      });
  }, [displayCountries, activeCells, selectedSector, metric, selectedCell]);

  // Handle ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      // Force trigger re-render
      setMetric((m) => m);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Request AI Gap Analysis for the selected cell
  const handleTriggerAiAnalysis = async (cell: HeatmapCellData) => {
    setIsAiLoading(true);
    setShowAiModal(true);
    setAiAnalysisResult(null);
    setAiSources([]);

    try {
      const res = await fetch('/api/ai/maturity-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countryId: cell.countryId,
          sectorId: cell.sectorId,
          compareWith: ['ksa', 'uae', 'qatar'].filter((id) => id !== cell.countryId),
        }),
      });

      const data = await res.json();
      if (data.analysis) {
        setAiAnalysisResult(data.analysis);
        setAiSources(data.sources || []);
      } else {
        setAiAnalysisResult('Failed to generate analysis. Please try again.');
      }
    } catch {
      setAiAnalysisResult(
        'Connection error during AI analysis. The system fallback will resume momentarily.'
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // Export Heatmap Data to CSV
  const handleExportCsv = () => {
    const headers = [
      'Country ID',
      'Country Name',
      'Region',
      'Sector ID',
      'Sector Name',
      'Maturity Score',
      'Maturity Level',
      'Regulations Count',
      'Mandatory Controls Count',
      'Penalty Risk',
      'Enforcement Status',
      'Primary Authorities',
      'Key Regulations',
    ];

    const escapeCsv = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = activeCells.map((c) => [
      escapeCsv(c.countryId.toUpperCase()),
      escapeCsv(c.countryName),
      escapeCsv(c.region),
      escapeCsv(c.sectorId),
      escapeCsv(c.sectorName),
      escapeCsv(c.score),
      escapeCsv(c.levelLabel),
      escapeCsv(c.regulationsCount),
      escapeCsv(c.mandatoryControlsCount),
      escapeCsv(c.penaltyRisk),
      escapeCsv(c.enforcementStatus),
      escapeCsv(c.primaryAuthorities.join('; ')),
      escapeCsv(c.primaryRegulationCodes.join('; ')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MENAT_Compliance_Maturity_Heatmap_${selectedSector}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Flame className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-100">
                Compliance Maturity Heatmap
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full">
                D3 Visualization Engine
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Visualize regional compliance coverage intensity, regulatory density, and statutory maturity
              across all 24 MENAT jurisdictions. Rapidly isolate high-density clusters in specialized domains like{' '}
              <strong className="text-emerald-300">Artificial Intelligence</strong> and{' '}
              <strong className="text-cyan-300">Cybersecurity</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-lg transition-colors"
              title="Download raw matrix dataset in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              Export Heatmap CSV
            </button>
            <button
              onClick={() => {
                if (onOpenAIChatWithPrompt) {
                  onOpenAIChatWithPrompt(
                    `Analyze the MENAT Compliance Maturity Heatmap. Compare countries with the highest regulatory density in AI (e.g., Saudi Arabia, UAE, Qatar) versus Cybersecurity.`
                  );
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI Copilot
            </button>
          </div>
        </div>

        {/* Regulatory Density Highlights Bar (AI & Cyber Leaders) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Card 1: AI Regulatory Leaders */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Highest AI Regulatory Density</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
                SDAIA / UAE AI
              </span>
            </div>
            <div className="space-y-1.5">
              {topAI.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span>{item.countryFlag}</span>
                    <span className="font-medium">{item.countryName}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">{item.regsCount} regs</span>
                    <span className="font-bold text-emerald-400 font-mono">{item.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Cyber Regulatory Leaders */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">Highest Cyber Security Density</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/20">
                NCA / NESA
              </span>
            </div>
            <div className="space-y-1.5">
              {topCyber.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span>{item.countryFlag}</span>
                    <span className="font-medium">{item.countryName}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">{item.ctrlsCount} ctrls</span>
                    <span className="font-bold text-cyan-400 font-mono">{item.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Data Privacy Leaders */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Data Protection & Sovereignty</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
                PDPL / KVKK
              </span>
            </div>
            <div className="space-y-1.5">
              {topPrivacy.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span>{item.countryFlag}</span>
                    <span className="font-medium">{item.countryName}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">{item.regsCount} regs</span>
                    <span className="font-bold text-indigo-400 font-mono">{item.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Sector Quick Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Focus Sector / Domain
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSector('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSector === 'all'
                  ? 'bg-slate-200 text-slate-900 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All 8 Sectors
            </button>
            {MATURITY_SECTORS.map((sector) => {
              const isSelected = selectedSector === sector.id;
              const isHighlight = sector.id === 'ai' || sector.id === 'cyber';
              return (
                <button
                  key={sector.id}
                  onClick={() => setSelectedSector(sector.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? isHighlight
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-200 text-slate-900 font-bold shadow'
                      : isHighlight
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/50'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {sector.id === 'ai' && <Cpu className="w-3.5 h-3.5" />}
                  {sector.id === 'cyber' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {sector.id === 'privacy' && <Lock className="w-3.5 h-3.5" />}
                  {sector.id === 'cloud' && <Cloud className="w-3.5 h-3.5" />}
                  {sector.id === 'fintech' && <Coins className="w-3.5 h-3.5" />}
                  {sector.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Metric Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display Intensity Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="score">Maturity Score (0-100 Scale)</option>
              <option value="regulationsCount">Total Active Regulations</option>
              <option value="mandatoryControlsCount">Mandatory Controls Density</option>
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Regional Scope</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All 24 MENAT Jurisdictions</option>
              <option value="GCC">GCC (6 Nations)</option>
              <option value="North Africa">North Africa</option>
              <option value="Levant & Other">Levant & Wider Middle East</option>
              <option value="The Sahel">The Sahel</option>
              <option value="Horn of Africa">Horn of Africa</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Country Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="density">Highest Regulatory Density</option>
              <option value="maturity">Overall Maturity Score</option>
              <option value="alphabetical">Country Name (A-Z)</option>
              <option value="region">By Macro Region</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Search Jurisdiction / Authority</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search country, e.g. Saudi, UAE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Color Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Coverage Intensity:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1e293b] text-slate-400 border border-slate-700">
                0-30 Initial
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0d9488]/40 text-teal-300 border border-teal-700/50">
                31-60 Emerging
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10b981]/50 text-emerald-200 border border-emerald-600/50">
                61-84 Defined
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34d399] text-slate-950">
                85-100 World-Class
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Click any cell to inspect statutory controls & penalty risks</span>
            <span className="text-slate-600">•</span>
            <span>Showing {displayCountries.length} countries ({activeCells.length} matrix data points)</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid & Inspector Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: D3 Heatmap SVG Canvas (8 cols on XL) */}
        <div className="xl:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Regional Regulatory Coverage Matrix
            </h3>
            <span className="text-xs text-slate-400">
              Interactive D3 Grid • Hover for details • Click to inspect
            </span>
          </div>

          {/* D3 Canvas Container */}
          <div ref={containerRef} className="relative w-full overflow-x-auto">
            <svg ref={svgRef} className="w-full select-none" />

            {/* Hover Tooltip Overlay */}
            {hoveredCell && tooltipPos && (
              <div
                style={{
                  left: Math.min(tooltipPos.x + 12, (containerRef.current?.clientWidth || 800) - 260),
                  top: tooltipPos.y + 12,
                }}
                className="absolute z-20 pointer-events-none w-64 bg-slate-950/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-sm text-xs text-slate-200"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                  <div className="font-bold flex items-center gap-1.5 text-slate-100">
                    <span>{hoveredCell.countryFlag}</span>
                    <span>{hoveredCell.countryName}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{hoveredCell.score}/100</span>
                </div>
                <div className="text-slate-400 font-medium mb-1">
                  Sector: <span className="text-slate-200">{hoveredCell.sectorName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] mb-2">
                  <div>
                    <span className="text-slate-500">Regulations:</span>{' '}
                    <span className="font-semibold text-slate-300">{hoveredCell.regulationsCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Controls:</span>{' '}
                    <span className="font-semibold text-slate-300">{hoveredCell.mandatoryControlsCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Risk:</span>{' '}
                    <span
                      className={`font-semibold ${
                        hoveredCell.penaltyRisk === 'Extreme'
                          ? 'text-rose-400'
                          : hoveredCell.penaltyRisk === 'High'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {hoveredCell.penaltyRisk}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Level:</span>{' '}
                    <span className="font-semibold text-slate-300">Tier {hoveredCell.level}</span>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Click cell for full statutory breakdown
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Cell Inspector & Gap Analysis (4 cols on XL) */}
        <div className="xl:col-span-4 space-y-4">
          {selectedCell ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    {selectedCell.region}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      selectedCell.penaltyRisk === 'Extreme'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : selectedCell.penaltyRisk === 'High'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    }`}
                  >
                    {selectedCell.penaltyRisk} Penalty Exposure
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{selectedCell.countryFlag}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 leading-tight">
                      {selectedCell.countryName}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      {selectedCell.sectorName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Maturity Score Meter */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Regulatory Maturity Level</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {selectedCell.score} / 100
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${selectedCell.score}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{selectedCell.levelLabel}</span>
                  <span className="text-slate-300 font-medium">{selectedCell.enforcementStatus}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
                  <span className="text-slate-500 block text-[11px]">Active Regulations</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {selectedCell.regulationsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Statutory instruments</span>
                </div>
                <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3">
                  <span className="text-slate-500 block text-[11px]">Mandatory Controls</span>
                  <span className="text-lg font-bold text-slate-200 font-mono">
                    {selectedCell.mandatoryControlsCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Audit checklist items</span>
                </div>
              </div>

              {/* Primary Authorities */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Enforcing Regulatory Bodies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCell.primaryAuthorities.map((auth, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 rounded-md"
                    >
                      {auth}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Statutory Codes */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Primary Statutory Instruments
                </span>
                <div className="space-y-1.5">
                  {selectedCell.primaryRegulationCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-950/70 border border-slate-800 rounded-lg text-xs"
                    >
                      <span className="font-mono font-semibold text-slate-200">{code}</span>
                      {onSelectRegulation && (
                        <button
                          onClick={() => onSelectRegulation(code)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                        >
                          View Controls
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Risk Compliance Mandates */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Key Mandatory Controls
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedCell.keyMandates.map((mandate, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{mandate}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gap Analysis Summary */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1">
                <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Regional Gap & Adoption Assessment
                </span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {selectedCell.gapAnalysis}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleTriggerAiAnalysis(selectedCell)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Gap Analysis Memo
                </button>
                <button
                  onClick={() => {
                    if (onOpenAIChatWithPrompt) {
                      onOpenAIChatWithPrompt(
                        `What are the specific compliance obligations and audit criteria for ${selectedCell.countryName} in the sector ${selectedCell.sectorName}? Cite authorities like ${selectedCell.primaryAuthorities.join(', ')}.`
                      );
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  Ask Copilot About {selectedCell.countryName} {selectedCell.sectorName}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 space-y-2">
              <Flame className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">Select any cell on the heatmap</p>
              <p className="text-xs text-slate-500">
                Click a country-sector coordinate to inspect statutory instruments, enforcing authorities, and run AI gap memos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Maturity Analysis Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    AI Regulatory Maturity & Gap Analysis Memo
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedCell?.countryFlag} {selectedCell?.countryName} • {selectedCell?.sectorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300 font-sans">
              {isAiLoading ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Synthesizing Cross-Border Regulatory Intelligence...
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Benchmarking statutory frameworks with Autonomous AI Model and verifying against official MENAT gazette registries.
                    </p>
                  </div>
                </div>
              ) : aiAnalysisResult ? (
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none text-xs leading-relaxed">
                    {aiAnalysisResult.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('###') || paragraph.startsWith('####')) {
                        return (
                          <h4 key={idx} className="text-sm font-bold text-emerald-300 mt-4 mb-2">
                            {paragraph.replace(/^[#]+\s*/, '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                        const items = paragraph.split('\n');
                        return (
                          <ul key={idx} className="space-y-1 list-disc pl-4 text-slate-300">
                            {items.map((it, i) => (
                              <li key={i}>{it.replace(/^[-*]\s*/, '')}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="text-slate-300 text-xs">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>

                  {/* Cited Grounding Sources */}
                  {aiSources.length > 0 && (
                    <div className="pt-4 border-t border-slate-800">
                      <span className="text-xs font-semibold text-slate-400 block mb-2">
                        Official Gazette & Regulatory Sources Cited:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {aiSources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 text-emerald-400 hover:border-emerald-500/50 rounded-md transition-colors"
                          >
                            <span>{source.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-8">No analysis generated yet.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/60">
              <span className="text-[11px] text-slate-500">
                Powered by Autonomous AI Model &amp; Grounded MENAT Knowledge Engine
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowAiModal(false);
                    if (onOpenAIChatWithPrompt && selectedCell) {
                      onOpenAIChatWithPrompt(
                        `Elaborate further on the AI Gap Analysis memo for ${selectedCell.countryName} (${selectedCell.sectorName}). How should an enterprise address these specific audit requirements?`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Continue in Chat Copilot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
