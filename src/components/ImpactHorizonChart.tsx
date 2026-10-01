import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Regulation, SectorType } from '../types/regulatory';
import { calculateUrgencyScore, UrgencyScoreResult } from '../utils/urgencyScore';
import { useAdmin } from '../context/AdminContext';
import {
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Maximize2,
  Info,
} from 'lucide-react';

interface ImpactHorizonChartProps {
  regulations: Regulation[];
  pinnedIds?: string[];
  onSelectRegulation?: (regulationId: string) => void;
}

interface HorizonDataPoint {
  regulation: Regulation;
  urgency: UrgencyScoreResult;
  isPinned: boolean;
}

export const ImpactHorizonChart: React.FC<ImpactHorizonChartProps> = ({
  regulations,
  pinnedIds = [],
  onSelectRegulation,
}) => {
  const { timelineEvents } = useAdmin();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [scopeMode, setScopeMode] = useState<'all' | 'pinned'>(pinnedIds.length > 0 ? 'pinned' : 'all');
  const [hoveredPoint, setHoveredPoint] = useState<HorizonDataPoint | null>(null);

  // Compute urgency scores for all eligible regulations (file-backed timeline)
  const dataPoints: HorizonDataPoint[] = useMemo(() => {
    return regulations.map((reg) => ({
      regulation: reg,
      urgency: calculateUrgencyScore(reg, timelineEvents),
      isPinned: pinnedIds.includes(reg.id),
    }));
  }, [regulations, pinnedIds, timelineEvents]);

  // Filter based on controls
  const filteredPoints = useMemo(() => {
    return dataPoints.filter((point) => {
      if (scopeMode === 'pinned' && !point.isPinned) return false;
      if (selectedTier !== 'all' && point.urgency.tier !== selectedTier) return false;
      if (selectedSector !== 'all') {
        const hasSector = point.regulation.targetSectors.includes(selectedSector as SectorType);
        if (!hasSector) return false;
      }
      return true;
    });
  }, [dataPoints, scopeMode, selectedTier, selectedSector]);

  // Aggregate statistics for the Impact Horizon
  const stats = useMemo(() => {
    const criticalCount = filteredPoints.filter((p) => p.urgency.tier === 'Critical').length;
    const highCount = filteredPoints.filter((p) => p.urgency.tier === 'High').length;
    const urgentDeadlines = filteredPoints.filter((p) => p.urgency.daysRemaining <= 60).length;
    const avgScore =
      filteredPoints.length > 0
        ? Math.round(filteredPoints.reduce((acc, p) => acc + p.urgency.score, 0) / filteredPoints.length)
        : 0;

    return { criticalCount, highCount, urgentDeadlines, avgScore };
  }, [filteredPoints]);

  // Extract available sectors
  const availableSectors = useMemo(() => {
    const set = new Set<string>();
    regulations.forEach((r) => r.targetSectors.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [regulations]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = Math.max(420, Math.min(520, width * 0.5));
    const margin = { top: 40, right: 35, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Glow filter for critical nodes
    const filter = defs.append('filter').attr('id', 'critical-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: Days remaining (0 to 320)
    const xScale = d3.scaleLinear().domain([0, 310]).range([0, innerWidth]);

    // Y Scale: Urgency score (0 to 100)
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Background Threshold Bands
    // 1. Critical Zone (80 - 100)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(100))
      .attr('width', innerWidth)
      .attr('height', yScale(80) - yScale(100))
      .attr('fill', '#ef4444')
      .attr('fill-opacity', 0.08);

    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', yScale(100) + 16)
      .attr('text-anchor', 'end')
      .attr('fill', '#f87171')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.05em')
      .text('CRITICAL EXPOSURE ZONE (80–100)');

    // 2. High Attention Zone (65 - 80)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(80))
      .attr('width', innerWidth)
      .attr('height', yScale(65) - yScale(80))
      .attr('fill', '#f59e0b')
      .attr('fill-opacity', 0.05);

    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', yScale(80) + 16)
      .attr('text-anchor', 'end')
      .attr('fill', '#fbbf24')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('letter-spacing', '0.05em')
      .text('HEIGHTENED SUPERVISION (65–79)');

    // 3. Moderate & Monitored Zone (0 - 65)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(65))
      .attr('width', innerWidth)
      .attr('height', yScale(0) - yScale(65))
      .attr('fill', '#10b981')
      .attr('fill-opacity', 0.03);

    // 60-Day Imminent Milestone Vertical Boundary
    g.append('line')
      .attr('x1', xScale(60))
      .attr('x2', xScale(60))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.5);

    g.append('text')
      .attr('x', xScale(60) + 6)
      .attr('y', innerHeight - 8)
      .attr('fill', '#f59e0b')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('60-Day Imminent Horizon');

    // Horizontal Gridlines
    const yGridTicks = [20, 40, 60, 80, 100];
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yGridTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#334155')
      .attr('stroke-width', 0.6)
      .attr('stroke-dasharray', '2,2');

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([30, 60, 90, 180, 270])
      .tickFormat((d) => `${d}d`);

    const yAxis = d3.axisLeft(yScale).tickValues([20, 40, 60, 80, 100]);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .call((ax) => ax.select('.domain').attr('stroke', '#475569'));

    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .attr('font-size', '10px')
      .call((ax) => ax.select('.domain').attr('stroke', '#475569'));

    // Axis Labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text('Timeline Horizon to Next Statutory Milestone (Days Remaining)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text('Urgency Score (0 - 100)');

    // Guidance line group (for hover crosshairs)
    const crosshairsGroup = g.append('g').attr('class', 'crosshairs').style('display', 'none');
    const xGuide = crosshairsGroup
      .append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');
    const yGuide = crosshairsGroup
      .append('line')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    // Node Groups
    const nodeGroups = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredPoints)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('transform', (d) => `translate(${xScale(d.urgency.daysRemaining)},${yScale(d.urgency.score)})`)
      .style('cursor', 'pointer');

    // Colors mapping
    const getNodeColor = (tier: string) => {
      switch (tier) {
        case 'Critical':
          return '#ef4444';
        case 'High':
          return '#f59e0b';
        case 'Moderate':
          return '#eab308';
        case 'Monitored':
        default:
          return '#10b981';
      }
    };

    // Node Outer Glow / Ring for Critical & Pinned
    nodeGroups
      .filter((d) => d.urgency.tier === 'Critical' || d.isPinned)
      .append('circle')
      .attr('r', (d) => (d.isPinned ? 14 : 11))
      .attr('fill', 'none')
      .attr('stroke', (d) => getNodeColor(d.urgency.tier))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', (d) => (d.isPinned ? '2,2' : 'none'));

    // Node Circle
    nodeGroups
      .append('circle')
      .attr('r', (d) => {
        const controls = d.regulation.controlStructure?.totalControlsCount || 30;
        return Math.min(13, Math.max(7, Math.sqrt(controls) * 1.3));
      })
      .attr('fill', (d) => getNodeColor(d.urgency.tier))
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('filter', (d) => (d.urgency.tier === 'Critical' ? 'url(#critical-glow)' : 'none'));

    // Regulation Code Label beside node.
    // With ~89 regulations clustered in the near-term / high-urgency quadrant the
    // always-on labels overlapped into an unreadable mass. We now only label
    // pinned (watchlist) items — a small, deliberately-chosen set — and let the
    // hover tooltip reveal the full name/authority/score for every other node.
    // A native <title> is also attached to each node group so the browser shows
    // the full regulation name on hover even before the React tooltip renders.
    nodeGroups
      .filter((d) => d.isPinned)
      .append('text')
      .attr('x', 12)
      .attr('y', 3)
      .attr('fill', '#e2e8f0')
      .attr('font-size', '9.5px')
      .attr('font-weight', '700')
      .text((d) => d.regulation.code)
      .attr('pointer-events', 'none');

    // Accessible native tooltip (code — name) on every node for quick identification.
    nodeGroups
      .append('title')
      .text((d) => `${d.regulation.code} — ${d.regulation.name}`);

    // Mouse Interactions
    nodeGroups
      .on('mouseenter', function (event, d) {
        d3.select(this).select('circle').transition().duration(150).attr('r', 16);
        setHoveredPoint(d);

        // Crosshairs
        crosshairsGroup.style('display', null);
        const xPos = xScale(d.urgency.daysRemaining);
        const yPos = yScale(d.urgency.score);

        xGuide.attr('x1', xPos).attr('x2', xPos).attr('y1', yPos).attr('y2', innerHeight);
        yGuide.attr('x1', 0).attr('x2', xPos).attr('y1', yPos).attr('y2', yPos);
      })
      .on('mouseleave', function (event, d) {
        const controls = d.regulation.controlStructure?.totalControlsCount || 30;
        const origR = Math.min(13, Math.max(7, Math.sqrt(controls) * 1.3));
        d3.select(this).select('circle').transition().duration(150).attr('r', origR);
        setHoveredPoint(null);
        crosshairsGroup.style('display', 'none');
      })
      .on('click', (event, d) => {
        if (onSelectRegulation) {
          onSelectRegulation(d.regulation.id);
        }
      });
  }, [filteredPoints]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Impact Horizon Risk Matrix</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  D3 Visual Scatter
                </span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-400 pl-10.5">
            Bivariate horizon mapping composite Urgency Scores (0–100) against statutory deadlines and audit milestones.
          </p>
        </div>

        {/* Quick Summary Metrics Badges */}
        <div className="flex flex-wrap items-center gap-2 pl-10 lg:pl-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2">
            <span className="text-slate-400">Avg Urgency:</span>
            <span className="font-mono font-bold text-amber-400">{stats.avgScore}/100</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span className="text-red-300 font-semibold">{stats.criticalCount} Critical Risks</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300 font-semibold">{stats.urgentDeadlines} &lt;60d Deadlines</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope Toggle */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setScopeMode('pinned')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scopeMode === 'pinned'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Watchlist Items ({dataPoints.filter((p) => p.isPinned).length})
            </button>
            <button
              type="button"
              onClick={() => setScopeMode('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                scopeMode === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Regulations ({dataPoints.length})
            </button>
          </div>

          {/* Sector Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">All Sectors</option>
              {availableSectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Tier Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">All Tiers</option>
              <option value="Critical">Critical (80-100)</option>
              <option value="High">High (65-79)</option>
              <option value="Moderate">Moderate (45-64)</option>
              <option value="Monitored">Monitored (&lt;45)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>Critical</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>High</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            <span>Moderate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Monitored</span>
          </span>
        </div>
      </div>

      {/* D3 Canvas Stage */}
      <div ref={containerRef} className="w-full relative bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
        <svg ref={svgRef} className="w-full h-auto block"></svg>

        {/* Hovered Point Card Floating Overlay */}
        {hoveredPoint && (
          <div className="absolute top-4 right-4 z-10 w-72 p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-2 pointer-events-none animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                {hoveredPoint.regulation.code}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  hoveredPoint.urgency.tier === 'Critical'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : hoveredPoint.urgency.tier === 'High'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                Score: {hoveredPoint.urgency.score} ({hoveredPoint.urgency.tier})
              </span>
            </div>

            <div className="font-bold text-white leading-tight">{hoveredPoint.regulation.name}</div>

            <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Authority</span>
                <span className="text-slate-300 font-medium">{hoveredPoint.regulation.authorityShort}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Milestone Due</span>
                <span className="text-amber-400 font-semibold">{hoveredPoint.urgency.targetDeadline}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sentiment</span>
                <span className="text-purple-300 font-medium">{hoveredPoint.urgency.sentiment}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sector Weight</span>
                <span className="text-slate-300 font-mono">{hoveredPoint.urgency.sectorMultiplier.toFixed(2)}x</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              {hoveredPoint.urgency.urgencyRationale}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>* Bubble size reflects mapped auditable control breadth. Hover a node for its full name &amp; score; click to open details. Watchlist items are labelled.</span>
        <span>Showing {filteredPoints.length} plotted statutory instruments</span>
      </div>
    </div>
  );
};
