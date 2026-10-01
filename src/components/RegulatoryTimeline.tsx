import React, { useState, useMemo } from 'react';
import { TimelineEvent, SectorType, RegulatoryCategory, Country } from '../types/regulatory';
import { REGULATORY_TIMELINE_EVENTS } from '../data/regulatoryTimelineData';
import { useAdmin } from '../context/AdminContext';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ChevronRight,
  ArrowRight,
  Download,
  CalendarClock,
  Sparkles,
  GitCompare,
  FileText,
  Shield,
  X,
  SlidersHorizontal,
  BookmarkCheck,
  CheckSquare,
  Square,
  Building2,
  Globe2,
  ShieldCheck,
} from 'lucide-react';
import { PendingChangesDock } from './AdminPanel/PendingChangesDock';

interface RegulatoryTimelineProps {
  countries: Country[];
  onSelectCountry?: (countryId: string) => void;
  onViewRegulation?: (regulationId: string) => void;
  onViewVersionDiff?: (diffId: string) => void;
  pinnedRegulationIds?: string[];
  onTogglePin?: (regulationId: string) => void;
}

// Current benchmark date: September 22, 2026
const CURRENT_DATE_STR = '2026-09-22';
const CURRENT_TIMESTAMP = new Date(CURRENT_DATE_STR).getTime();

export const RegulatoryTimeline: React.FC<RegulatoryTimelineProps> = ({
  countries,
  onSelectCountry,
  onViewRegulation,
  onViewVersionDiff,
  pinnedRegulationIds = [],
  onTogglePin,
}) => {
  const {
    effectiveTimelineEvents,
    isCurrentUserAdmin,
    pendingTimelineEdits,
    pendingRegulationEdits,
    stageTimelineEdit,
    unstageTimelineEdit,
    stageRegulationEdit,
    unstageRegulationEdit,
    hasPendingEdits,
    totalPendingEditsCount,
    applyPendingEdits,
    discardPendingEdits,
    regulations,
    benchmarkDate,
  } = useAdmin();

  // Configurable benchmark "current date" anchor (falls back to module default).
  const CURRENT_DATE_STR_LOCAL = benchmarkDate || CURRENT_DATE_STR;
  const CURRENT_TIMESTAMP_LOCAL = new Date(CURRENT_DATE_STR_LOCAL).getTime();

  const activeTimelineEvents = useMemo(() => {
    return effectiveTimelineEvents && effectiveTimelineEvents.length > 0
      ? effectiveTimelineEvents
      : REGULATORY_TIMELINE_EVENTS;
  }, [effectiveTimelineEvents]);

  // View mode: 'gantt' | 'feed' | 'quarterly'
  const [viewMode, setViewMode] = useState<'gantt' | 'feed' | 'quarterly'>('gantt');

  // Horizon range: 'upcoming' | 'all' | 'historical'
  const [horizon, setHorizon] = useState<'upcoming' | 'all' | 'historical'>('all');

  // Grouping in Gantt: 'country' | 'category' | 'flat'
  const [groupBy, setGroupBy] = useState<'country' | 'category' | 'flat'>('country');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected event for detail drawer
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // User interactive checklist state: eventId -> Record<string, boolean>
  const [checklistProgress, setChecklistProgress] = useState<Record<string, Record<number, boolean>>>({});

  // Horizon date limits (in timestamps)
  const timeBoundaries = useMemo(() => {
    if (horizon === 'upcoming') {
      // Focus on 2026-01-01 to 2027-12-31
      const start = new Date('2026-01-01').getTime();
      const end = new Date('2027-12-31').getTime();
      return { start, end };
    }
    if (horizon === 'historical') {
      // 2021-01-01 to 2025-12-31
      const start = new Date('2021-01-01').getTime();
      const end = new Date('2025-12-31').getTime();
      return { start, end };
    }
    // 'all': 2022-01-01 to 2028-06-30
    const start = new Date('2022-01-01').getTime();
    const end = new Date('2028-06-30').getTime();
    return { start, end };
  }, [horizon]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return activeTimelineEvents.filter((evt) => {
      // Horizon filter
      const evtStart = new Date(evt.startDate).getTime();
      const evtDeadline = new Date(evt.deadlineDate).getTime();

      if (horizon === 'upcoming') {
        // Must end after or equal to 2026-01-01 and start before 2027-12-31
        if (evtDeadline < new Date('2026-01-01').getTime()) return false;
      } else if (horizon === 'historical') {
        // Must have deadline before current date
        if (evtDeadline > CURRENT_TIMESTAMP_LOCAL) return false;
      }

      // Country filter
      if (selectedCountryFilter !== 'all' && evt.countryId !== selectedCountryFilter) {
        return false;
      }

      // Event Type filter
      if (selectedEventType !== 'all' && evt.eventType !== selectedEventType) {
        return false;
      }

      // Urgency filter
      if (selectedUrgency !== 'all' && evt.urgency !== selectedUrgency) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && evt.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesCode = evt.regulationCode.toLowerCase().includes(q);
        const matchesAuth = evt.authority.toLowerCase().includes(q);
        const matchesCountry = evt.countryName.toLowerCase().includes(q);
        const matchesDesc = evt.description.toLowerCase().includes(q);
        const matchesSectors = evt.targetSectors.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesAuth && !matchesCountry && !matchesDesc && !matchesSectors) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
  }, [activeTimelineEvents, horizon, selectedCountryFilter, selectedEventType, selectedUrgency, selectedCategory, searchQuery]);

  // Selected event
  const selectedEvent = useMemo(() => {
    return activeTimelineEvents.find((e) => e.id === selectedEventId) || null;
  }, [activeTimelineEvents, selectedEventId]);

  // Calculate days remaining helper
  const getDaysRemaining = (deadlineStr: string) => {
    const deadlineTime = new Date(deadlineStr).getTime();
    const diffMs = deadlineTime - CURRENT_TIMESTAMP_LOCAL;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Toggle checklist item
  const toggleChecklistItem = (eventId: string, index: number) => {
    setChecklistProgress((prev) => {
      const eventState = prev[eventId] || {};
      return {
        ...prev,
        [eventId]: {
          ...eventState,
          [index]: !eventState[index],
        },
      };
    });
  };

  // Export to iCalendar (.ics)
  const handleExportICS = () => {
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MENAT ReguIntel//Regulatory Timeline//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ].join('\r\n');

    filteredEvents.forEach((evt) => {
      const d = new Date(evt.deadlineDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dtstamp = `${year}${month}${day}`;

      icsContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:menat-reg-${evt.id}@reguintel.ai`,
        `DTSTAMP:${dtstamp}T000000Z`,
        `DTSTART;VALUE=DATE:${dtstamp}`,
        `SUMMARY:[${evt.countryFlag} ${evt.regulationCode}] ${evt.title.replace(/,/g, '\\,')}`,
        `DESCRIPTION:${evt.description.replace(/\n/g, ' ')}\\n\\nAuthority: ${evt.authority}\\nUrgency: ${evt.urgency}\\nOfficial URL: ${evt.officialUrl}`,
        `URL:${evt.officialUrl}`,
        `STATUS:CONFIRMED`,
        'BEGIN:VALARM',
        'TRIGGER:-P30D',
        'ACTION:DISPLAY',
        `DESCRIPTION:30-Day Reminder: ${evt.title.replace(/,/g, '\\,')} Deadline`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MENAT_Regulatory_Deadlines_${CURRENT_DATE_STR_LOCAL}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Country',
      'Regulation Code',
      'Title',
      'Authority',
      'Category',
      'Event Type',
      'Start Date',
      'Deadline Date',
      'Days Remaining (from Sep 2026)',
      'Urgency',
      'Official Reference',
      'Official URL',
    ];

    const rows = filteredEvents.map((evt) => [
      `"${evt.countryName}"`,
      `"${evt.regulationCode}"`,
      `"${evt.title.replace(/"/g, '""')}"`,
      `"${evt.authority}"`,
      `"${evt.categoryLabel}"`,
      `"${evt.eventType}"`,
      `"${evt.startDate}"`,
      `"${evt.deadlineDate}"`,
      getDaysRemaining(evt.deadlineDate),
      `"${evt.urgency}"`,
      `"${evt.officialReference}"`,
      `"${evt.officialUrl}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MENAT_Regulatory_Timeline_${CURRENT_DATE_STR_LOCAL}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group events for Gantt
  const groupedEvents = useMemo(() => {
    if (groupBy === 'flat') {
      return [{ groupTitle: 'All Chronological Events', events: filteredEvents }];
    }

    if (groupBy === 'country') {
      const map: Record<string, { groupTitle: string; flag: string; events: TimelineEvent[] }> = {};
      filteredEvents.forEach((evt) => {
        if (!map[evt.countryId]) {
          map[evt.countryId] = {
            groupTitle: evt.countryName,
            flag: evt.countryFlag,
            events: [],
          };
        }
        map[evt.countryId].events.push(evt);
      });
      return Object.values(map).sort((a, b) => a.groupTitle.localeCompare(b.groupTitle));
    }

    // groupBy === 'category'
    const map: Record<string, { groupTitle: string; events: TimelineEvent[] }> = {};
    filteredEvents.forEach((evt) => {
      if (!map[evt.category]) {
        map[evt.category] = {
          groupTitle: evt.categoryLabel,
          events: [],
        };
      }
      map[evt.category].events.push(evt);
    });
    return Object.values(map).sort((a, b) => a.groupTitle.localeCompare(b.groupTitle));
  }, [filteredEvents, groupBy]);

  // Quarterly Buckets for Quarterly view
  const quarterlyBuckets = useMemo(() => {
    const buckets: {
      id: string;
      label: string;
      timeRange: string;
      events: TimelineEvent[];
    }[] = [
      { id: 'q3-2026', label: 'Q3 2026', timeRange: 'Jul 2026 – Sep 2026', events: [] },
      { id: 'q4-2026', label: 'Q4 2026 (Imminent)', timeRange: 'Oct 2026 – Dec 2026', events: [] },
      { id: 'q1-2027', label: 'Q1 2027', timeRange: 'Jan 2027 – Mar 2027', events: [] },
      { id: 'q2-2027', label: 'Q2 2027', timeRange: 'Apr 2027 – Jun 2027', events: [] },
      { id: 'later-2027', label: 'H2 2027 & Beyond', timeRange: 'Jul 2027 – 2028', events: [] },
      { id: 'historical', label: 'Historical Milestones', timeRange: '2021 – Mid 2026 (Passed)', events: [] },
    ];

    filteredEvents.forEach((evt) => {
      const d = new Date(evt.deadlineDate);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12

      if (year < 2026 || (year === 2026 && month <= 6)) {
        buckets[5].events.push(evt);
      } else if (year === 2026 && month >= 7 && month <= 9) {
        buckets[0].events.push(evt);
      } else if (year === 2026 && month >= 10 && month <= 12) {
        buckets[1].events.push(evt);
      } else if (year === 2027 && month >= 1 && month <= 3) {
        buckets[2].events.push(evt);
      } else if (year === 2027 && month >= 4 && month <= 6) {
        buckets[3].events.push(evt);
      } else {
        buckets[4].events.push(evt);
      }
    });

    return buckets;
  }, [filteredEvents]);

  // Gantt Axis Timeline points (Quarters / Years)
  const timelineAxisYears = useMemo(() => {
    const startYear = new Date(timeBoundaries.start).getFullYear();
    const endYear = new Date(timeBoundaries.end).getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }
    return years;
  }, [timeBoundaries]);

  // Current date position percentage on Gantt timeline
  const todayPositionPct = useMemo(() => {
    const { start, end } = timeBoundaries;
    if (CURRENT_TIMESTAMP_LOCAL < start) return 0;
    if (CURRENT_TIMESTAMP_LOCAL > end) return 100;
    return ((CURRENT_TIMESTAMP_LOCAL - start) / (end - start)) * 100;
  }, [timeBoundaries]);

  // Helper to calculate event left & width on Gantt bar
  const getEventGanttCoords = (startDateStr: string, deadlineDateStr: string) => {
    const { start, end } = timeBoundaries;
    const totalDuration = end - start;

    let sTime = new Date(startDateStr).getTime();
    let eTime = new Date(deadlineDateStr).getTime();

    // Clamp for display
    const clampedStart = Math.max(sTime, start);
    const clampedEnd = Math.min(eTime, end);

    if (clampedEnd < start || clampedStart > end) {
      return { visible: false, leftPct: 0, widthPct: 0 };
    }

    const leftPct = ((clampedStart - start) / totalDuration) * 100;
    const rawWidthPct = ((clampedEnd - clampedStart) / totalDuration) * 100;
    // ensure minimum visible width of 1.5% so single-day milestones are visible
    const widthPct = Math.max(rawWidthPct, 1.8);

    return { visible: true, leftPct, widthPct };
  };

  // Helper for transition start marker
  const getTransitionMarkerPct = (transitionDateStr?: string) => {
    if (!transitionDateStr) return null;
    const { start, end } = timeBoundaries;
    const tTime = new Date(transitionDateStr).getTime();
    if (tTime < start || tTime > end) return null;
    return ((tTime - start) / (end - start)) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CalendarClock className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                MENAT Regulatory Timeline & Statutory Deadlines
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Active 2026 Radar</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Interactive chronological Gantt tracker monitoring regulatory enforcement deadlines, transition grace periods, and historical decree milestones across 24 MENAT jurisdictions.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <button
              onClick={handleExportICS}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
              title="Download iCalendar file to sync deadlines with Google Calendar or Outlook"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export iCalendar (.ics)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
              title="Export all regulatory timeline rows into spreadsheet format"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* View Switcher & Horizon Selector */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Primary View Switcher */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Gantt Chart View</span>
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'feed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chronological Feed</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                {filteredEvents.length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center space-x-1.5 transition-colors ${
                viewMode === 'quarterly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Quarterly Matrix</span>
            </button>
          </div>

          {/* Horizon & Grouping Controls */}
          <div className="flex items-center space-x-3 text-xs">
            {/* Horizon Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="px-2 text-slate-500 font-medium text-[11px]">Horizon:</span>
              <button
                onClick={() => setHorizon('upcoming')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  horizon === 'upcoming' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                2026–2027 Deadlines
              </button>
              <button
                onClick={() => setHorizon('all')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  horizon === 'all' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Horizons (2022–2028)
              </button>
              <button
                onClick={() => setHorizon('historical')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  horizon === 'historical' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Historical Milestones
              </button>
            </div>

            {/* Gantt Grouping Dropdown (only active in gantt view) */}
            {viewMode === 'gantt' && (
              <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[11px]">Group by:</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="country" className="bg-slate-900">Country</option>
                  <option value="category" className="bg-slate-900">Regulatory Domain</option>
                  <option value="flat" className="bg-slate-900">Flat Stream</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Pending Changes Banner */}
      {isCurrentUserAdmin && hasPendingEdits && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/70 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-950/40 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Timeline Pending Changes
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/40">
                  {totalPendingEditsCount} Pending
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Statutory deadline and regulatory status modifications are staged. Click "Apply Changes" below or in the floating dock to persist atomically.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={discardPendingEdits}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={applyPendingEdits}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-950/60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search decrees, authorities, topics, sectors (e.g. FAPI, PQC, PDPL, TÜBİTAK)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Country Filter */}
        <select
          value={selectedCountryFilter}
          onChange={(e) => setSelectedCountryFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All 24 Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>

        {/* Event Type Filter */}
        <select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Event Types</option>
          <option value="Enforcement Deadline">Enforcement Deadlines</option>
          <option value="Grace Period Expiry">Grace Period Expiries</option>
          <option value="Compliance Audit Window">Compliance Audit Windows</option>
          <option value="Public Consultation">Public Consultations</option>
          <option value="Major Overhaul">Major Overhauls</option>
          <option value="Statutory Enactment">Statutory Enactments</option>
        </select>

        {/* Urgency Filter */}
        <select
          value={selectedUrgency}
          onChange={(e) => setSelectedUrgency(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">All Urgency Levels</option>
          <option value="Critical">🚨 Critical</option>
          <option value="High">⚠️ High</option>
          <option value="Medium">⚡ Medium</option>
        </select>

        {/* Reset Filter Button */}
        {(selectedCountryFilter !== 'all' ||
          selectedEventType !== 'all' ||
          selectedUrgency !== 'all' ||
          selectedCategory !== 'all' ||
          searchQuery) && (
          <button
            onClick={() => {
              setSelectedCountryFilter('all');
              setSelectedEventType('all');
              setSelectedUrgency('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* VIEW 1: GANTT CHART VIEW */}
      {viewMode === 'gantt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Gantt Header Legend & Axis Ruler */}
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <span className="font-semibold text-white flex items-center space-x-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Timeline Lanes</span>
              </span>

              {/* Legend Badges */}
              <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-2 rounded bg-emerald-500/80 inline-block" />
                  <span>Regulatory Lifecycle Span</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-2 rounded bg-amber-500/60 inline-block border border-dashed border-amber-400" />
                  <span>Transition / Grace Period</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
                  <span>Statutory Deadline Cutoff</span>
                </span>
              </div>
            </div>

            {/* Present Marker Pill */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">Current Radar Anchor:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>September 22, 2026</span>
              </span>
            </div>
          </div>

          {/* Gantt Timeline Viewport (Horizontal Scrollable Container) */}
          <div className="overflow-x-auto min-w-full">
            <div className="min-w-[900px] lg:min-w-[1100px] p-4 relative">
              {/* Timeline Header Ruler */}
              <div className="relative h-10 border-b border-slate-800 mb-4 flex items-center select-none">
                <div className="w-72 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400 pl-2">
                  Jurisdiction & Regulation
                </div>
                <div className="flex-1 relative h-full flex items-center">
                  {/* Year & Quarter Grid Lines */}
                  {timelineAxisYears.map((year, idx) => {
                    const yearStart = new Date(`${year}-01-01`).getTime();
                    const { start, end } = timeBoundaries;
                    const leftPct = ((yearStart - start) / (end - start)) * 100;
                    if (leftPct < 0 || leftPct > 100) return null;

                    return (
                      <div
                        key={year}
                        className="absolute top-0 bottom-0 border-l border-slate-800 flex flex-col justify-between"
                        style={{ left: `${leftPct}%` }}
                      >
                        <span className="text-[11px] font-mono font-bold text-slate-300 pl-1.5 bg-slate-900/90 rounded px-1 -translate-y-1">
                          {year}
                        </span>
                        <div className="flex space-x-4 pl-1 text-[9px] text-slate-500 font-mono">
                          <span>Q1</span>
                          <span>Q2</span>
                          <span>Q3</span>
                          <span>Q4</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Vertical 'Today' Benchmark Line on Header */}
                  {todayPositionPct >= 0 && todayPositionPct <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 z-20 flex flex-col items-center"
                      style={{ left: `${todayPositionPct}%` }}
                    >
                      <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-extrabold shadow-md -translate-y-2 whitespace-nowrap">
                        TODAY (SEP 2026)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vertical 'Today' Guide Line that cuts through all rows */}
              {todayPositionPct >= 0 && todayPositionPct <= 100 && (
                <div
                  className="absolute top-14 bottom-4 z-10 pointer-events-none border-l-2 border-dashed border-rose-500/70"
                  style={{ left: `calc(18rem + (100% - 18rem) * ${todayPositionPct / 100})` }}
                >
                  <div className="absolute top-1/2 -left-1.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20 animate-pulse" />
                </div>
              )}

              {/* Grouped Rows */}
              {groupedEvents.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  No regulatory timeline events match your current filter parameters.
                </div>
              ) : (
                groupedEvents.map((group) => (
                  <div key={group.groupTitle} className="mb-6 last:mb-0">
                    {/* Group Header */}
                    <div className="flex items-center space-x-2 py-1 px-2 mb-2 bg-slate-950/60 rounded border border-slate-800/80">
                      {'flag' in group && (
                        <span className="text-base select-none">{(group as any).flag}</span>
                      )}
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                        {group.groupTitle}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({group.events.length} {group.events.length === 1 ? 'event' : 'events'})
                      </span>
                    </div>

                    {/* Event Rows */}
                    <div className="space-y-2.5">
                      {group.events.map((evt) => {
                        const { visible, leftPct, widthPct } = getEventGanttCoords(evt.startDate, evt.deadlineDate);
                        if (!visible) return null;

                        const transitionPct = getTransitionMarkerPct(evt.transitionStartDate);
                        const daysRem = getDaysRemaining(evt.deadlineDate);
                        const isExpired = daysRem <= 0;
                        const isImminent = daysRem > 0 && daysRem <= 90;

                        return (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEventId(evt.id)}
                            className="flex items-center group cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors relative"
                          >
                            {/* Left Meta Column: Name & Details */}
                            <div className="w-72 shrink-0 pr-3">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors truncate">
                                  {evt.regulationCode}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold whitespace-nowrap ${
                                    evt.urgency === 'Critical'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : evt.urgency === 'High'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {evt.urgency}
                                </span>
                                {pendingTimelineEdits[evt.id] && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    ⚡ Staged
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-400 truncate mt-0.5" title={evt.title}>
                                {evt.title}
                              </div>

                              <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                                <span>{evt.authorityShort}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">
                                  Due: {evt.deadlineDate}
                                </span>
                              </div>
                            </div>

                            {/* Right Gantt Horizontal Track */}
                            <div className="flex-1 relative h-8 bg-slate-950/40 rounded border border-slate-800/60 overflow-hidden flex items-center">
                              {/* Horizontal Span Bar */}
                              <div
                                className={`absolute top-1.5 bottom-1.5 rounded transition-all shadow-sm flex items-center px-2 group-hover:brightness-110 ${
                                  isExpired
                                    ? 'bg-slate-700/80 border border-slate-600 text-slate-300'
                                    : isImminent
                                    ? 'bg-gradient-to-r from-amber-600/80 to-rose-600/90 border border-rose-500 text-white animate-pulse'
                                    : 'bg-emerald-600/80 border border-emerald-500 text-white'
                                } ${pendingTimelineEdits[evt.id] ? 'ring-2 ring-amber-400' : ''}`}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                              >
                                {/* Transition start hatch if applicable */}
                                {transitionPct !== null && transitionPct > leftPct && (
                                  <div
                                    className="absolute top-0 bottom-0 left-0 bg-white/10"
                                    style={{ width: `${((transitionPct - leftPct) / widthPct) * 100}%` }}
                                    title={`Transition Period Began: ${evt.transitionStartDate}`}
                                  />
                                )}

                                <div className="truncate text-[10px] font-semibold flex items-center space-x-1 z-10">
                                  <span>{evt.eventType}</span>
                                </div>

                                {/* Right Edge Deadline Milestone Pin */}
                                <div
                                  className={`absolute -right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md ${
                                    isExpired
                                      ? 'bg-slate-400'
                                      : isImminent
                                      ? 'bg-rose-500'
                                      : 'bg-emerald-400'
                                  }`}
                                  title={`Deadline Cutoff: ${evt.deadlineDate}`}
                                />
                              </div>

                              {/* Countdown Badge outside the bar if space allows */}
                              <div
                                className="absolute text-[10px] font-mono font-semibold pl-2 pointer-events-none whitespace-nowrap"
                                style={{
                                  left: `calc(${leftPct + widthPct}% + 8px)`,
                                }}
                              >
                                {isExpired ? (
                                  <span className="text-slate-500">Passed ({evt.deadlineDate})</span>
                                ) : isImminent ? (
                                  <span className="text-rose-400 font-bold">
                                    🚨 {daysRem} days remaining
                                  </span>
                                ) : (
                                  <span className="text-emerald-400">
                                    In {Math.round(daysRem / 30)} months ({evt.deadlineDate})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CHRONOLOGICAL FEED VIEW */}
      {viewMode === 'feed' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong>{filteredEvents.length}</strong> statutory milestones ordered by deadline date
            </span>
            <span className="font-mono text-emerald-400">
              Anchored to Present: September 2026
            </span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const daysRem = getDaysRemaining(evt.deadlineDate);
              const isExpired = daysRem <= 0;
              const isImminent = daysRem > 0 && daysRem <= 90;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`group bg-slate-900 border rounded-xl p-5 transition-all cursor-pointer hover:border-emerald-500/50 hover:shadow-lg ${
                    isImminent
                      ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 to-amber-950/20'
                      : isExpired
                      ? 'border-slate-800 opacity-90'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Left Meta & Content */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                        <span className="text-2xl select-none" role="img" aria-label={evt.countryName}>
                          {evt.countryFlag}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {evt.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-xs text-slate-300 font-semibold">
                              {evt.regulationCode}
                            </span>
                            {pendingTimelineEdits[evt.id] && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide inline-flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                <span>Pending Edit</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-300">{evt.authority}</span>
                            <span>•</span>
                            <span>{evt.countryName}</span>
                            <span>•</span>
                            <span className="text-slate-400">{evt.categoryLabel}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                        {evt.description}
                      </p>

                      {/* Milestones Progress preview */}
                      <div className="pt-2 flex items-center space-x-3 overflow-x-auto text-[11px]">
                        {evt.milestones.map((ms, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 shrink-0">
                            {ms.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-slate-600 bg-slate-800" />
                            )}
                            <span className={ms.completed ? 'text-slate-300' : 'text-slate-500'}>
                              {ms.label} ({ms.date})
                            </span>
                            {idx < evt.milestones.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Deadline & Urgency Card */}
                    <div className="flex flex-col items-start md:items-end justify-between shrink-0 space-y-3">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                            evt.urgency === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : evt.urgency === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {evt.urgency} Urgency
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {evt.eventType}
                        </span>
                      </div>

                      <div className="text-left md:text-right">
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                          Statutory Deadline
                        </div>
                        <div className="text-base font-extrabold font-mono text-white mt-0.5">
                          {evt.deadlineDate}
                        </div>
                        <div className="mt-1">
                          {isExpired ? (
                            <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1 md:justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Enforced / Passed</span>
                            </span>
                          ) : isImminent ? (
                            <span className="text-xs font-bold text-rose-400 flex items-center space-x-1 md:justify-end animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              <span>{daysRem} Days Remaining</span>
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-400 md:justify-end">
                              ~{Math.round(daysRem / 30)} months remaining
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(evt.id);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                      >
                        <span>Inspect Checklist</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: QUARTERLY CALENDAR MATRIX */}
      {viewMode === 'quarterly' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quarterlyBuckets.map((bucket) => (
            <div
              key={bucket.id}
              className={`rounded-xl border p-4 flex flex-col justify-between ${
                bucket.id === 'q4-2026'
                  ? 'bg-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-base text-white">{bucket.label}</h3>
                    <p className="text-xs text-slate-400">{bucket.timeRange}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      bucket.events.length > 0
                        ? bucket.id === 'q4-2026'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {bucket.events.length} deadlines
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {bucket.events.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      No statutory deadlines recorded in this quarter.
                    </div>
                  ) : (
                    bucket.events.map((evt) => {
                      const daysRem = getDaysRemaining(evt.deadlineDate);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventId(evt.id)}
                          className="p-3 bg-slate-950/70 hover:bg-slate-800/80 rounded-lg border border-slate-800 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-sm select-none">{evt.countryFlag}</span>
                              <span className="font-bold text-xs text-white group-hover:text-emerald-400">
                                {evt.regulationCode}
                              </span>
                              {pendingTimelineEdits[evt.id] && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  ⚡ Staged
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-slate-300">
                              {evt.deadlineDate}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                            {evt.title}
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{evt.authorityShort}</span>
                            {daysRem > 0 ? (
                              <span className="text-amber-400 font-semibold">{daysRem} days left</span>
                            ) : (
                              <span className="text-slate-500 font-medium">Completed</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL / DRAWER FOR SELECTED EVENT */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setSelectedEventId(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-10">
              <div className="flex items-center space-x-2">
                <span className="text-3xl select-none">{selectedEvent.countryFlag}</span>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                      {selectedEvent.regulationCode}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        selectedEvent.urgency === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : selectedEvent.urgency === 'High'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {selectedEvent.urgency} Urgency
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {selectedEvent.eventType}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {selectedEvent.title}
                  </h2>
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedEvent.authority}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedEvent.countryName}</span>
                </span>
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Compliance Deadline Date
                </div>
                <div className="text-xl font-extrabold font-mono text-white mt-0.5">
                  {selectedEvent.deadlineDate}
                </div>
              </div>

              <div className="text-right">
                {getDaysRemaining(selectedEvent.deadlineDate) > 0 ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black text-rose-400 font-mono">
                      {getDaysRemaining(selectedEvent.deadlineDate)}
                    </span>
                    <span className="text-xs text-rose-300 leading-tight text-left">
                      Days Remaining<br />Until Enforcement
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Statutory Grace Period Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Administrator Statutory Controls (Live Edit & Atomic Staging) */}
            {isCurrentUserAdmin && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border-2 border-emerald-500/40 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Administrator Live Statutory Controls
                    </span>
                  </div>
                  {pendingTimelineEdits[selectedEvent.id] ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                      ⚡ Staged Edit
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Atomic Transaction Staged
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Statutory Deadline Date
                    </label>
                    <input
                      type="date"
                      value={selectedEvent.deadlineDate}
                      onChange={(e) =>
                        stageTimelineEdit(selectedEvent.id, { deadlineDate: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Grace / Transition Start
                    </label>
                    <input
                      type="date"
                      value={selectedEvent.transitionStartDate || ''}
                      onChange={(e) =>
                        stageTimelineEdit(selectedEvent.id, { transitionStartDate: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Enforcement Urgency
                    </label>
                    <select
                      value={selectedEvent.urgency}
                      onChange={(e) =>
                        stageTimelineEdit(selectedEvent.id, { urgency: e.target.value as any })
                      }
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Informational">Informational</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Statutory Status
                    </label>
                    <select
                      value={selectedEvent.status}
                      onChange={(e) =>
                        stageTimelineEdit(selectedEvent.id, { status: e.target.value as any })
                      }
                      className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="Imminent (<90 Days)">Imminent (&lt;90 Days)</option>
                      <option value="Upcoming (2026-2027)">Upcoming (2026-2027)</option>
                      <option value="In Consultation">In Consultation</option>
                      <option value="Completed / Active">Completed / Active</option>
                      <option value="Long-Term Horizon (2027+)">Long-Term Horizon (2027+)</option>
                    </select>
                  </div>
                </div>

                {/* Linked Regulation Status if applicable */}
                {selectedEvent.regulationId && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 block">
                        Linked Regulation Gazette Status ({selectedEvent.regulationCode})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Updates official status in directory and search indices
                      </span>
                    </div>
                    <select
                      value={
                        pendingRegulationEdits[selectedEvent.regulationId]?.status ||
                        regulations.find((r) => r.id === selectedEvent.regulationId)?.status ||
                        'Enacted'
                      }
                      onChange={(e) =>
                        stageRegulationEdit(selectedEvent.regulationId!, { status: e.target.value as any })
                      }
                      className="bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-semibold min-w-[150px]"
                    >
                      <option value="Enacted">Enacted</option>
                      <option value="Amended">Amended</option>
                      <option value="Draft / Public Consultation">Draft / Public Consultation</option>
                    </select>
                  </div>
                )}

                {/* Revert / Apply inline actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {hasPendingEdits
                      ? `${totalPendingEditsCount} unsaved statutory change(s) staged.`
                      : 'Changes made above are staged for atomic application.'}
                  </span>
                  <div className="flex items-center space-x-2">
                    {pendingTimelineEdits[selectedEvent.id] && (
                      <button
                        type="button"
                        onClick={() => unstageTimelineEdit(selectedEvent.id)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        Revert Item
                      </button>
                    )}
                    {hasPendingEdits && (
                      <button
                        type="button"
                        onClick={applyPendingEdits}
                        className="px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1 cursor-pointer shadow-md shadow-emerald-950/50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Apply Changes</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description & Intent */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Regulatory Scope & Intent
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80">
                {selectedEvent.description}
              </p>
            </div>

            {/* Chronological Milestones Flow */}
            <div className="mt-5 space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Statutory Milestone Progression
              </h4>
              <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                {selectedEvent.milestones.map((ms, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center space-x-2.5">
                      {ms.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 bg-slate-800 shrink-0" />
                      )}
                      <span className={ms.completed ? 'text-white font-medium' : 'text-slate-400'}>
                        {ms.label}
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{ms.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Penalties Structure */}
            {selectedEvent.penaltiesSummary && (
              <div className="mt-5 space-y-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-rose-400 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Statutory Penalties & Sanctions</span>
                </h4>
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg text-xs text-rose-200 leading-relaxed">
                  {selectedEvent.penaltiesSummary}
                </div>
              </div>
            )}

            {/* Actionable Compliance Checklist */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Actionable Compliance Checklist</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Interactive Session Tracker
                </span>
              </div>

              <div className="space-y-2">
                {selectedEvent.complianceChecklist.map((task, idx) => {
                  const isChecked = checklistProgress[selectedEvent.id]?.[idx] || false;
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChecklistItem(selectedEvent.id, idx)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 text-xs ${
                        isChecked
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <button className="mt-0.5 text-emerald-400 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <span className={isChecked ? 'line-through opacity-80' : ''}>
                        {task}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Sectors */}
            <div className="mt-5">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
                Applicable Sectors
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.targetSectors.map((sector) => (
                  <span
                    key={sector}
                    className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700"
                  >
                    {sector}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                {selectedEvent.versionDiffId && onViewVersionDiff && (
                  <button
                    onClick={() => {
                      const diffId = selectedEvent.versionDiffId!;
                      setSelectedEventId(null);
                      onViewVersionDiff(diffId);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>View Version Diff</span>
                  </button>
                )}

                {selectedEvent.regulationId && onViewRegulation && (
                  <button
                    onClick={() => {
                      const regId = selectedEvent.regulationId!;
                      setSelectedEventId(null);
                      onViewRegulation(regId);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Inspect Regulation Controls</span>
                  </button>
                )}

                {selectedEvent.regulationId && onTogglePin && (
                  <button
                    onClick={() => onTogglePin(selectedEvent.regulationId!)}
                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-colors border ${
                      pinnedRegulationIds.includes(selectedEvent.regulationId)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <BookmarkCheck className={`w-3.5 h-3.5 ${pinnedRegulationIds.includes(selectedEvent.regulationId) ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>
                      {pinnedRegulationIds.includes(selectedEvent.regulationId)
                        ? 'Pinned to Watchlist'
                        : 'Pin to Watchlist'}
                    </span>
                  </button>
                )}
              </div>

              <a
                href={selectedEvent.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              >
                <span>Official Gazette / Decree Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Admin Floating Staged Changes Dock */}
      {isCurrentUserAdmin && <PendingChangesDock viewContext="timeline" />}
    </div>
  );
};
