import React, { useState, useMemo } from 'react';
import { Regulation, SectorType } from '../types/regulatory';
import { MENAT_COUNTRIES } from '../data/menatData';
import { analyzeControlMandate } from '../utils/mandateConfidence';
import {
  Download,
  Search,
  Filter,
  Layers,
  ExternalLink,
  Check,
  FileSpreadsheet,
  FileCode,
  FileText,
  Shield,
  BookOpen,
} from 'lucide-react';

interface ControlsCrosswalkProps {
  regulations: Regulation[];
  onOpenExportModal: () => void;
}

export const ControlsCrosswalk: React.FC<ControlsCrosswalkProps> = ({
  regulations,
  onOpenExportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<'all' | 'nist' | 'iso' | 'ccm'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flatten all controls
  const allControls = useMemo(() => {
    const list: any[] = [];
    for (const reg of regulations) {
      const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
      for (const ctrl of reg.sampleControls) {
        list.push({
          ...ctrl,
          regulationName: reg.name,
          regulationCode: reg.code,
          countryId: reg.countryId,
          countryName: countryObj?.name || reg.countryId.toUpperCase(),
          countryFlag: countryObj?.flag || '🌐',
          authority: reg.authorityShort,
          officialUrl: reg.officialUrl,
        });
      }
    }
    return list;
  }, [regulations]);

  // Filter logic
  const filteredControls = useMemo(() => {
    return allControls.filter((c) => {
      if (selectedCountry !== 'all' && c.countryId !== selectedCountry) return false;
      if (selectedSector !== 'all' && !c.applicableSectors.includes(selectedSector as SectorType)) {
        return false;
      }
      if (selectedStandard === 'nist' && !c.mapping.nistCsf) return false;
      if (selectedStandard === 'iso' && !c.mapping.iso27001) return false;
      if (selectedStandard === 'ccm' && !c.mapping.csaCcm) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.clauseReference.toLowerCase().includes(q) ||
          c.regulationCode.toLowerCase().includes(q) ||
          c.domainName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allControls, selectedCountry, selectedSector, selectedStandard, searchTerm]);

  // Direct CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Country',
      'Authority',
      'Regulation Code',
      'Regulation Name',
      'Clause Reference',
      'Control Code',
      'Control Title',
      'Control Description',
      'Domain Name',
      'Mandatory Level',
      'Applicable Sectors',
      'NIST CSF 2.0 Mapping',
      'ISO/IEC 27001:2022 Mapping',
      'CSA CCM v4 Mapping',
      'Official URL',
    ];

    const escapeCsv = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;

    const rows = filteredControls.map((c) => [
      escapeCsv(c.countryName),
      escapeCsv(c.authority),
      escapeCsv(c.regulationCode),
      escapeCsv(c.regulationName),
      escapeCsv(c.clauseReference),
      escapeCsv(c.code),
      escapeCsv(c.title),
      escapeCsv(c.description),
      escapeCsv(c.domainName),
      escapeCsv(c.mandatoryLevel),
      escapeCsv(c.applicableSectors.join('; ')),
      escapeCsv(c.mapping.nistCsf || 'N/A'),
      escapeCsv(c.mapping.iso27001 || 'N/A'),
      escapeCsv(c.mapping.csaCcm || 'N/A'),
      escapeCsv(c.officialUrl),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MENAT_Controls_Mapping_Crosswalk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct JSON Export
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredControls, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.setAttribute('download', `MENAT_Controls_Mapping_Crosswalk_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyClause = (clause: string, id: string) => {
    navigator.clipboard.writeText(clause);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
              Crosswalk Engine
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              {filteredControls.length} Controls Cataloged
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Controls Crosswalk &amp; Global Standards Mapping
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Cross-references statutory articles across all {MENAT_COUNTRIES.length} sovereign MENAT nations directly to global security frameworks (NIST CSF 2.0, ISO/IEC 27001:2022, CIS Controls v8, and CSA Cloud Controls Matrix). Use this tool to eliminate duplicative compliance audits, map existing technical controls to local laws, and export harmonized evidence workpapers.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenExportModal}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
            title="Open Bulk Compliance PDF Report Generator with Crosswalk Data"
          >
            <FileText className="w-4 h-4" />
            <span>Bulk PDF Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search clause, control title, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Standard Mapping Filter */}
          <div>
            <select
              value={selectedStandard}
              onChange={(e: any) => setSelectedStandard(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Global Mapping: All Frameworks</option>
              <option value="nist">NIST Cybersecurity Framework 2.0</option>
              <option value="iso">ISO/IEC 27001:2022 (A.5, A.7, A.8)</option>
              <option value="ccm">Cloud Security Alliance (CCM v4)</option>
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Jurisdiction: All {MENAT_COUNTRIES.length} Countries</option>
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
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Sector: All Critical & Tech Sectors</option>
              <option value="Banking">Banking & FS</option>
              <option value="Payments">Payments & Fintech</option>
              <option value="Government">Government & Public</option>
              <option value="Critical Infrastructure">Critical Infrastructure</option>
              <option value="Utilities">Utilities & Power</option>
              <option value="Oil & Gas">Oil & Gas (Hydrocarbons)</option>
              <option value="Cloud & Hyperscalers">Cloud & Hyperscalers</option>
              <option value="Telco">Telecommunications</option>
              <option value="Retail & E-Commerce">Retail & E-Commerce</option>
              <option value="Digital Tech Startups">Digital Tech Startups</option>
              <option value="Space & Aerospace">Space & Aerospace</option>
              <option value="Automotive">Automotive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controls List Cards */}
      <div className="space-y-4">
        {filteredControls.map((ctrl) => (
          <div
            key={ctrl.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-3"
          >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">{ctrl.countryFlag}</span>
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {ctrl.code}
                </span>
                <span className="font-bold text-sm text-white">{ctrl.title}</span>
                {(() => {
                  const mandate = analyzeControlMandate(ctrl);
                  return (
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 shrink-0 ${
                        mandate.level === 'Mandatory'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : mandate.level === 'Conditional'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                      }`}
                      title={mandate.rationale}
                    >
                      <span>{mandate.level}</span>
                      <span className="font-mono opacity-90 font-medium">
                        ({mandate.confidenceScore}% confident [{mandate.confidenceInterval}])
                      </span>
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyClause(ctrl.clauseReference, ctrl.id)}
                  title="Copy Clause Reference"
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono flex items-center space-x-1 border border-slate-700 transition-colors"
                >
                  {copiedId === ctrl.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <span>Clause: {ctrl.clauseReference}</span>
                    </>
                  )}
                </button>

                <a
                  href={ctrl.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="View Official Source"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Regulation context */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{ctrl.regulationCode}</span>
              <span>•</span>
              <span>{ctrl.authority}</span>
              <span>•</span>
              <span>Domain: {ctrl.domainName}</span>
              {ctrl.subDomainName && (
                <>
                  <span>•</span>
                  <span>Sub: {ctrl.subDomainName}</span>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              {ctrl.description}
            </p>

            {/* Sector Applicability */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[11px] text-slate-400 font-semibold mr-1 self-center">Applies To:</span>
              {ctrl.applicableSectors.map((sector: string) => (
                <span
                  key={sector}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium border border-slate-700/60"
                >
                  {sector}
                </span>
              ))}
            </div>

            {/* Global Mapping Crosswalk Tags */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span>Global Alignment:</span>
              </span>

              {ctrl.mapping.nistCsf && (
                <div className="px-2 py-1 rounded bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-mono flex items-center space-x-1">
                  <span className="text-blue-400 font-bold">NIST CSF 2.0:</span>
                  <span>{ctrl.mapping.nistCsf}</span>
                </div>
              )}

              {ctrl.mapping.iso27001 && (
                <div className="px-2 py-1 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 text-xs font-mono flex items-center space-x-1">
                  <span className="text-purple-400 font-bold">ISO/IEC 27001:2022:</span>
                  <span>{ctrl.mapping.iso27001}</span>
                </div>
              )}

              {ctrl.mapping.csaCcm && (
                <div className="px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-mono flex items-center space-x-1">
                  <span className="text-cyan-400 font-bold">CSA CCM v4:</span>
                  <span>{ctrl.mapping.csaCcm}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
