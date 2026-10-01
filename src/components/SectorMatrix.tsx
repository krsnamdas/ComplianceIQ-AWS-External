import React, { useState } from 'react';
import { Regulation, SectorType } from '../types/regulatory';
import { MENAT_COUNTRIES } from '../data/menatData';
import { SectorTrendChart } from './SectorTrendChart';
import {
  Building2,
  Cpu,
  Flame,
  Zap,
  CreditCard,
  Rocket,
  Car,
  Gamepad2,
  Cloud,
  Network,
  ShoppingCart,
  Landmark,
  Shield,
  Layers,
  ExternalLink,
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface SectorMatrixProps {
  regulations: Regulation[];
  onSelectRegulation: (regId: string) => void;
}

const SECTOR_METADATA: {
  name: SectorType;
  icon: any;
  category: string;
  keyConcerns: string;
}[] = [
  {
    name: 'Banking',
    icon: Landmark,
    category: 'Financial Services',
    keyConcerns: 'Mandatory SOC 24/7, Swift customer MFA, strict data localization in KSA/TR/EG, and 2-hour incident escalation.',
  },
  {
    name: 'Financial Services',
    icon: Building2,
    category: 'Financial Services',
    keyConcerns: 'Core ledger operational resilience, penetration test cadence, and third-party vendor cyber due diligence.',
  },
  {
    name: 'Payments',
    icon: CreditCard,
    category: 'Fintech & Payments',
    keyConcerns: 'Tokenization, PCI-DSS alignment, stored value escrow protection, and anti-tamper POS terminals.',
  },
  {
    name: 'Fintech',
    icon: Cpu,
    category: 'Fintech & Payments',
    keyConcerns: 'Open Banking FAPI 2.0 API security, customer consent management, and cloud migration non-objection approvals.',
  },
  {
    name: 'Government',
    icon: Shield,
    category: 'Public Sector',
    keyConcerns: 'Sovereign cloud mandates, four-tier data classification, zero trust bastion architecture, and critical asset defense.',
  },
  {
    name: 'Critical Infrastructure',
    icon: Layers,
    category: 'National Assets',
    keyConcerns: 'Classified asset inventory, physical-logical network isolation, certified 2-year audit cadence, and national CERT threat sharing.',
  },
  {
    name: 'Oil & Gas',
    icon: Flame,
    category: 'Energy & Industry',
    keyConcerns: 'NCA OTCC-1:2022 Purdue model isolation, SCADA / DCS telemetry diode protection, and safety instrumented systems defense.',
  },
  {
    name: 'Power & Energy',
    icon: Zap,
    category: 'Energy & Industry',
    keyConcerns: 'Grid substation automation cybersecurity, cellular smart meter encryption, and ISO 27019 energy standard conformance.',
  },
  {
    name: 'Utilities',
    icon: Zap,
    category: 'Public Infrastructure',
    keyConcerns: 'Water/electricity telemetry air-gapping, industrial DMZ enforcement, and field-service remote access vaulting.',
  },
  {
    name: 'Cloud & Hyperscalers',
    icon: Cloud,
    category: 'Digital Infrastructure',
    keyConcerns: 'Sovereign data residency, CSP Class C licensing (KSA CST), customer key custody (BYOK/HYOK), and tenant hypervisor isolation.',
  },
  {
    name: 'Telco',
    icon: Network,
    category: 'Communications',
    keyConcerns: 'BGP RPKI route origination, anti-DDoS scrubbing capacity, mandatory lawful intercept readiness, and 180-day metadata retention.',
  },
  {
    name: 'Digital Tech Startups',
    icon: Cpu,
    category: 'Innovation & AI',
    keyConcerns: 'Personal data protection laws (PDPL), explicit marketing opt-ins, DPIAs for automated profiling, and cross-border transfer approvals.',
  },
  {
    name: 'Retail & E-Commerce',
    icon: ShoppingCart,
    category: 'Commercial',
    keyConcerns: 'Consumer privacy, electronic transaction safety, explicit marketing consent, and safe storage of cardholder tokens.',
  },
  {
    name: 'Space & Aerospace',
    icon: Rocket,
    category: 'Deep Tech',
    keyConcerns: 'Post-quantum TT&C satellite uplink cryptography, orbital debris mitigation plans, and earth station physical perimeter defense.',
  },
  {
    name: 'Automotive',
    icon: Car,
    category: 'Industrial',
    keyConcerns: 'Connected vehicle telemetry protection, in-car SIM roaming rules, and safety bounds for autonomous vehicular software.',
  },
  {
    name: 'Gaming & Entertainment',
    icon: Gamepad2,
    category: 'Digital Consumer',
    keyConcerns: 'Minor/children data consent safeguards, anti-cheat kernel security, and localized cloud multiplayer server hosting.',
  },
];

export const SectorMatrix: React.FC<SectorMatrixProps> = ({ regulations, onSelectRegulation }) => {
  const [selectedSector, setSelectedSector] = useState<SectorType>('Banking');
  const [regSearchTerm, setRegSearchTerm] = useState<string>('');
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('all');

  const sectorMeta = SECTOR_METADATA.find((s) => s.name === selectedSector) || SECTOR_METADATA[0];

  // Regulations that apply to this sector
  const applicableRegs = regulations.filter((r) => r.targetSectors.includes(selectedSector));

  // Filtered applicable regulations for search & country
  const filteredRegs = applicableRegs.filter((r) => {
    if (selectedCountryFilter !== 'all' && r.countryId !== selectedCountryFilter) {
      return false;
    }
    if (regSearchTerm.trim()) {
      const q = regSearchTerm.toLowerCase();
      const codeMatch = r.code.toLowerCase().includes(q);
      const nameMatch = r.name.toLowerCase().includes(q);
      const scopeMatch = r.scopeSummary.toLowerCase().includes(q);
      const authMatch = r.authority.toLowerCase().includes(q) || r.authorityShort.toLowerCase().includes(q);
      return codeMatch || nameMatch || scopeMatch || authMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
                Cross-Sector Matrix
              </span>
              <span className="text-xs text-slate-400 font-mono">18 Regulated Verticals</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sector-Wise Compliance Applicability &amp; Regulatory Velocity Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Maps sovereign cybersecurity, data protection, AI, and operational resilience laws across 18 critical industries (such as Banking &amp; FinTech, Critical Infrastructure, Cloud &amp; Hyperscalers, Healthcare, and Oil &amp; Gas). Select any sector below to view specific statutory concerns, 12-month regulatory velocity, and all applicable sovereign acts.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>12-Month Historical Velocity Active</span>
          </div>
        </div>
      </div>

      {/* Sector Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {SECTOR_METADATA.map((sector) => {
          const Icon = sector.icon;
          const isSelected = sector.name === selectedSector;
          const count = regulations.filter((r) => r.targetSectors.includes(sector.name)).length;

          return (
            <button
              key={sector.name}
              onClick={() => setSelectedSector(sector.name)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/30 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {count}
                </span>
              </div>
              <span className="font-semibold text-xs mt-2 block truncate">{sector.name}</span>
            </button>
          );
        })}
      </div>

      {/* 12-Month Sector Regulatory Volume Trend Analysis Chart */}
      <SectorTrendChart
        selectedSector={selectedSector}
        regulations={regulations}
        onSelectSector={(sector) => setSelectedSector(sector)}
        onViewRegulation={onSelectRegulation}
      />

      {/* Selected Sector Deep Dive & Regulations Inventory */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {sectorMeta.category}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight">{sectorMeta.name} Sector In-Force Standards</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              <strong className="text-slate-200">Core MENAT Mandate Focus:</strong> {sectorMeta.keyConcerns}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-2xl font-extrabold text-emerald-400">{applicableRegs.length}</span>
              <span className="text-xs text-slate-400 block">Active Regulations</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar for Regulations in this Sector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search within ${sectorMeta.name} regulations...`}
              value={regSearchTerm}
              onChange={(e) => setRegSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">Jurisdiction:</span>
            <select
              value={selectedCountryFilter}
              onChange={(e) => setSelectedCountryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Jurisdictions ({applicableRegs.length})</option>
              {Array.from(new Set(applicableRegs.map((r) => r.countryId))).map((cid) => {
                const c = MENAT_COUNTRIES.find((cnt) => cnt.id === cid);
                const countInCountry = applicableRegs.filter((r) => r.countryId === cid).length;
                return (
                  <option key={cid} value={cid}>
                    {c?.flag} {c?.name} ({countInCountry})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Regulations List for Selected Sector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Enforceable Standards & Frameworks for {sectorMeta.name} ({filteredRegs.length})
            </h4>
            {regSearchTerm && (
              <button
                onClick={() => setRegSearchTerm('')}
                className="text-xs text-emerald-400 hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>

          {filteredRegs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
              <p className="text-sm font-semibold text-slate-300">No regulations match the current filter</p>
              <p className="text-xs text-slate-500">Try changing the search term or jurisdiction filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRegs.map((reg) => {
                const country = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);

                return (
                  <div
                    key={reg.id}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span>{country?.flag}</span>
                          <span className="font-semibold text-slate-300">{country?.name}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">{reg.code}</span>
                      </div>

                      <h5 className="font-bold text-sm text-white mt-1.5 group-hover:text-emerald-300 transition-colors">
                        {reg.name}
                      </h5>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {reg.scopeSummary}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {reg.controlStructure.totalControlsCount} Controls
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {reg.categoryLabel}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          {reg.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                        {reg.authorityShort}
                      </span>
                      <div className="flex items-center space-x-2">
                        <a
                          href={reg.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-medium text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 transition-colors"
                          title="Open official statutory portal or gazette"
                        >
                          <span>Official Gazette</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
