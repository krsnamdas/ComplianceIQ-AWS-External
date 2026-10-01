import React, { useState, useMemo, useEffect } from 'react';
import { MENAT_COUNTRIES, MENAT_REGULATIONS } from '../data/menatData';
import { Regulation, RegulatoryCategory } from '../types/regulatory';
import { generateComplianceReportPDF, PDFExportOptions } from '../utils/pdfReportGenerator';
import { useRBAC } from '../context/RBACContext';
import { useAdmin } from '../context/AdminContext';
import { ComplianceIQLogo } from './ComplianceIQLogo';
import {
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  CheckSquare,
  Square,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  Shield,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Lock,
  ShieldAlert,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedRegulationIds?: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  initialSelectedRegulationIds,
}) => {
  const { canExportReports, triggerRestrictedAction, setRole } = useRBAC();
  const { regulations, addAuditLog } = useAdmin();

  // Primary Export Format: PDF Compliance Report, CSV, or JSON
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  // Multi-regulation selection state
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(() => {
    if (initialSelectedRegulationIds && initialSelectedRegulationIds.length > 0) {
      return new Set(initialSelectedRegulationIds);
    }
    // Default preset: 6 premier flagship regulations across GCC
    const defaultIds = [
      'ksa-ecc-1', // NCA ECC
      'ksa-pdpl', // SDAIA PDPL
      'uae-desc-isr', // Dubai DESC ISR
      'uae-ai-guide', // UAE AI Principles
      'qatar-nia', // Qatar NIA v2.0
      'bahrain-cyber', // Bahrain CBB Operational Cyber
    ];
    // verify they exist in regulations
    const valid = regulations.filter((r) => defaultIds.includes(r.id)).map((r) => r.id);
    return new Set(valid.length > 0 ? valid : regulations.slice(0, 6).map((r) => r.id));
  });

  // Filter and search state for the regulation selector
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // PDF Report Customization Options
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [reportTitle, setReportTitle] = useState('ComplianceIQ - Regulatory Compliance & Crosswalk Audit Report');
  const [organizationName, setOrganizationName] = useState('Enterprise Governance, Risk & Compliance (GRC)');
  const [preparedBy, setPreparedBy] = useState('ComplianceIQ - Middle East, North Africa & Türkiye Regulations & Controls ');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [includeCrosswalk, setIncludeCrosswalk] = useState(true);
  const [includeOfficialReferences, setIncludeOfficialReferences] = useState(true);
  const [includeClauseDescriptions, setIncludeClauseDescriptions] = useState(true);
  const [filterMandatoryOnly, setFilterMandatoryOnly] = useState(false);

  // Status state
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<string | null>(null);

  // Sync initial selection when modal opens
  useEffect(() => {
    if (initialSelectedRegulationIds && initialSelectedRegulationIds.length > 0) {
      setSelectedRegIds(new Set(initialSelectedRegulationIds));
    }
  }, [initialSelectedRegulationIds, isOpen]);

  // Filtered regulations based on search, country, category
  const filteredRegulations = useMemo(() => {
    return regulations.filter((reg) => {
      if (filterCountry !== 'all' && reg.countryId !== filterCountry) return false;
      if (filterCategory !== 'all' && reg.category !== filterCategory) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const codeMatch = reg.code.toLowerCase().includes(query);
        const nameMatch = reg.name.toLowerCase().includes(query);
        const authMatch = reg.authority.toLowerCase().includes(query);
        const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
        const countryMatch = countryObj ? countryObj.name.toLowerCase().includes(query) : false;
        return codeMatch || nameMatch || authMatch || countryMatch;
      }
      return true;
    });
  }, [regulations, filterCountry, filterCategory, searchTerm]);

  // Quick stats about current selection
  const selectedRegulations = useMemo(() => {
    return regulations.filter((reg) => selectedRegIds.has(reg.id));
  }, [regulations, selectedRegIds]);

  const totalSelectedControls = useMemo(() => {
    return selectedRegulations.reduce((acc, reg) => {
      const controls = reg.sampleControls || [];
      if (filterMandatoryOnly) {
        return acc + controls.filter((c) => c.mandatoryLevel === 'Mandatory').length;
      }
      return acc + controls.length;
    }, 0);
  }, [selectedRegulations, filterMandatoryOnly]);

  const jurisdictionsCount = useMemo(() => {
    return new Set(selectedRegulations.map((r) => r.countryId)).size;
  }, [selectedRegulations]);

  if (!isOpen) return null;

  // Toggle single regulation
  const handleToggleRegulation = (id: string) => {
    const next = new Set(selectedRegIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRegIds(next);
  };

  // Select all currently filtered regulations
  const handleSelectAllFiltered = () => {
    const next = new Set(selectedRegIds);
    filteredRegulations.forEach((r) => next.add(r.id));
    setSelectedRegIds(next);
  };

  // Deselect all currently filtered regulations
  const handleDeselectAllFiltered = () => {
    const next = new Set(selectedRegIds);
    filteredRegulations.forEach((r) => next.delete(r.id));
    setSelectedRegIds(next);
  };

  // Clear all selections
  const handleClearAll = () => {
    setSelectedRegIds(new Set());
  };

  // Preset Selections
  const applyPreset = (type: 'cyber' | 'ai' | 'privacy' | 'gcc' | 'all') => {
    if (type === 'all') {
      setSelectedRegIds(new Set(MENAT_REGULATIONS.map((r) => r.id)));
      return;
    }

    if (type === 'cyber') {
      const cyberRegs = MENAT_REGULATIONS.filter(
        (r) => r.category === 'tech_cyber' || r.code.toLowerCase().includes('ecc') || r.code.toLowerCase().includes('cyber')
      );
      setSelectedRegIds(new Set(cyberRegs.map((r) => r.id)));
      return;
    }

    if (type === 'ai') {
      const aiRegs = MENAT_REGULATIONS.filter(
        (r) => r.category === 'tech_ai' || r.code.toLowerCase().includes('ai') || r.name.toLowerCase().includes('artificial intelligence')
      );
      setSelectedRegIds(new Set(aiRegs.map((r) => r.id)));
      return;
    }

    if (type === 'privacy') {
      const privacyRegs = MENAT_REGULATIONS.filter(
        (r) => r.category === 'tech_data_privacy' || r.name.toLowerCase().includes('data') || r.code.toLowerCase().includes('pdpl')
      );
      setSelectedRegIds(new Set(privacyRegs.map((r) => r.id)));
      return;
    }

    if (type === 'gcc') {
      const gccCountryIds = ['ksa', 'uae', 'qatar', 'bahrain', 'kuwait', 'oman'];
      const gccRegs = MENAT_REGULATIONS.filter((r) => gccCountryIds.includes(r.countryId));
      setSelectedRegIds(new Set(gccRegs.map((r) => r.id)));
      return;
    }
  };

  // PDF Generation & Download
  const handleGeneratePdf = (previewMode: boolean = false) => {
    if (selectedRegulations.length === 0) {
      alert('Please select at least one regulation to export.');
      return;
    }

    if (!previewMode && !canExportReports) {
      triggerRestrictedAction(
        'Export Compliance PDF Report',
        'Generating and downloading formal multi-jurisdiction compliance dossiers and crosswalk reports requires the Compliance Manager role. Analysts have view-only access.'
      );
      return;
    }

    setIsExporting(true);
    setExportStatusMessage(previewMode ? 'Rendering PDF preview...' : 'Generating multi-regulation compliance report...');

    setTimeout(() => {
      try {
        const options: PDFExportOptions = {
          reportTitle,
          organizationName,
          preparedBy,
          includeExecutiveSummary,
          includeCrosswalk,
          includeOfficialReferences,
          includeClauseDescriptions,
          filterMandatoryOnly,
        };

        const doc = generateComplianceReportPDF(selectedRegulations, options);

        if (previewMode) {
          const blobUrl = doc.output('bloburl');
          window.open(blobUrl, '_blank');
          setIsExporting(false);
          setExportStatusMessage('Preview opened in new tab');
          setTimeout(() => setExportStatusMessage(null), 3000);
        } else {
          const timestamp = new Date().toISOString().slice(0, 10);
          const filename = `ComplianceIQ_Report_${selectedRegulations.length}Regs_${timestamp}.pdf`;
          doc.save(filename);

          if (addAuditLog) {
            addAuditLog(
              'REGULATORY_DOWNLOAD',
              `${selectedRegulations.length} Regulations (${filename})`,
              `Downloaded formal compliance PDF report containing: ${selectedRegulations.map((r) => r.code).join(', ')}. Scope: ${selectedRegulations.map((r) => r.countryId.toUpperCase()).join(', ')}.`
            );
          }

          setIsExporting(false);
          setExportStatusMessage('PDF report downloaded successfully!');
          setTimeout(() => {
            setExportStatusMessage(null);
            onClose();
          }, 1200);
        }
      } catch (err: any) {
        console.error('PDF Generation Error:', err);
        alert(`Failed to generate PDF: ${err?.message || 'Unknown error'}`);
        setIsExporting(false);
        setExportStatusMessage(null);
      }
    }, 150);
  };

  // CSV or JSON Download
  const handleDownloadCsvOrJson = () => {
    if (!canExportReports) {
      triggerRestrictedAction(
        `Export ${selectedFormat.toUpperCase()} Controls Matrix`,
        `Exporting compliance controls spreadsheets and structured datasets requires the Compliance Manager role. Analysts have view-only access.`
      );
      return;
    }

    setIsExporting(true);
    setExportStatusMessage(`Preparing ${selectedFormat.toUpperCase()} file...`);

    // If specific regulations are selected, export those. Otherwise export based on dropdown filters
    const exportRows: any[] = [];
    const sourceRegs = selectedRegulations.length > 0 ? selectedRegulations : filteredRegulations;

    for (const reg of sourceRegs) {
      for (const ctrl of reg.sampleControls || []) {
        if (filterMandatoryOnly && ctrl.mandatoryLevel !== 'Mandatory') continue;

        exportRows.push({
          country_id: reg.countryId.toUpperCase(),
          authority: reg.authority,
          regulation_code: reg.code,
          regulation_name: reg.name,
          category: reg.category,
          is_tech_regulation: reg.isTech ? 'Tech' : 'Non-Tech',
          domain_number: ctrl.domainNumber,
          domain_name: ctrl.domainName,
          sub_domain: ctrl.subDomainName || '',
          control_code: ctrl.code,
          clause_reference: ctrl.clauseReference,
          control_title: ctrl.title,
          control_description: ctrl.description,
          mandatory_level: ctrl.mandatoryLevel,
          applicable_sectors: (ctrl.applicableSectors || []).join('; '),
          nist_csf_mapping: ctrl.mapping?.nistCsf || 'N/A',
          iso_27001_mapping: ctrl.mapping?.iso27001 || 'N/A',
          csa_ccm_mapping: ctrl.mapping?.csaCcm || 'N/A',
          official_reference_url: reg.officialUrl,
        });
      }
    }

    if (selectedFormat === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportRows, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `MENAT_Compliance_Controls_${sourceRegs.length}_Regs.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      // CSV
      const headers = [
        'Country',
        'Authority',
        'Regulation Code',
        'Regulation Name',
        'Category',
        'Tech / Non-Tech',
        'Domain #',
        'Domain Name',
        'Sub-Domain',
        'Control Code',
        'Clause Reference',
        'Control Title',
        'Control Description',
        'Mandatory Level',
        'Applicable Sectors',
        'NIST CSF 2.0 Mapping',
        'ISO/IEC 27001:2022 Mapping',
        'CSA CCM v4 Mapping',
        'Official Reference URL',
      ];

      const escapeCsv = (str: any) => {
        if (str === null || str === undefined) return '""';
        const clean = String(str).replace(/"/g, '""');
        return `"${clean}"`;
      };

      const csvLines = [headers.join(',')];
      for (const r of exportRows) {
        csvLines.push(
          [
            escapeCsv(r.country_id),
            escapeCsv(r.authority),
            escapeCsv(r.regulation_code),
            escapeCsv(r.regulation_name),
            escapeCsv(r.category),
            escapeCsv(r.is_tech_regulation),
            escapeCsv(r.domain_number),
            escapeCsv(r.domain_name),
            escapeCsv(r.sub_domain),
            escapeCsv(r.control_code),
            escapeCsv(r.clause_reference),
            escapeCsv(r.control_title),
            escapeCsv(r.control_description),
            escapeCsv(r.mandatory_level),
            escapeCsv(r.applicable_sectors),
            escapeCsv(r.nist_csf_mapping),
            escapeCsv(r.iso_27001_mapping),
            escapeCsv(r.csa_ccm_mapping),
            escapeCsv(r.official_reference_url),
          ].join(',')
        );
      }

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `ComplianceIQ_Controls_${sourceRegs.length}_Regs.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }

    if (addAuditLog) {
      addAuditLog(
        'REGULATORY_DOWNLOAD',
        `${sourceRegs.length} Regulations (${selectedFormat.toUpperCase()} Controls Matrix)`,
        `Exported ${selectedFormat.toUpperCase()} controls matrix (${exportRows.length} statutory clauses) for ${sourceRegs.map((r) => r.code).slice(0, 5).join(', ')}${sourceRegs.length > 5 ? '...' : ''}.`
      );
    }

    setTimeout(() => {
      setIsExporting(false);
      setExportStatusMessage(`${selectedFormat.toUpperCase()} exported successfully!`);
      setTimeout(() => {
        setExportStatusMessage(null);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <ComplianceIQLogo size={42} />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Compliance<span className="text-cyan-400">IQ</span> Export &amp; Report Generator
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  Audit Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Middle East, North Africa &amp; Türkiye Regulations &amp; Controls 
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Format 1: PDF Compliance Report */}
            <button
              type="button"
              onClick={() => setSelectedFormat('pdf')}
              className={`p-3 rounded-xl border flex items-center space-x-3 transition-all text-left relative ${
                selectedFormat === 'pdf'
                  ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedFormat === 'pdf'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold block text-xs sm:text-sm text-white">PDF Compliance Report</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Bulk
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate block">
                  Multi-law audit dossier with NIST/ISO/CCM crosswalk
                </span>
              </div>
            </button>

            {/* Format 2: CSV Spreadsheet */}
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-3 rounded-xl border flex items-center space-x-3 transition-all text-left ${
                selectedFormat === 'csv'
                  ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold block text-xs sm:text-sm text-white">CSV Spreadsheet</span>
                <span className="text-[10px] text-slate-400 truncate block">Excel & PowerBI audit matrix</span>
              </div>
            </button>

            {/* Format 3: JSON Dataset */}
            <button
              type="button"
              onClick={() => setSelectedFormat('json')}
              className={`p-3 rounded-xl border flex items-center space-x-3 transition-all text-left ${
                selectedFormat === 'json'
                  ? 'bg-gradient-to-r from-purple-950/70 to-slate-900 border-purple-500 text-white ring-2 ring-purple-500/30 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedFormat === 'json'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FileCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold block text-xs sm:text-sm text-white">JSON API Export</span>
                <span className="text-[10px] text-slate-400 truncate block">For GRC pipelines & SIEM ingestion</span>
              </div>
            </button>
          </div>
        </div>

        {/* Role Restriction Banner for Analysts */}
        {!canExportReports && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-300 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <span className="font-semibold text-white">Analyst Role (View-Only Mode):</span>{' '}
                <span className="text-amber-200/90">
                  Exporting PDF compliance dossiers, CSV sheets, and JSON schemas is restricted to Compliance Managers.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRole('compliance_manager')}
              className="self-start sm:self-auto px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer shrink-0 text-xs shadow-sm"
            >
              Switch to Manager
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Multi-Regulation Selection Control Panel */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-200 text-xs flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Regulations for Single-File Report</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  Select one or multiple statutory frameworks across any MENAT jurisdiction
                </p>
              </div>

              {/* Selection Counter Pill */}
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                  {selectedRegulations.length} of {MENAT_REGULATIONS.length} Selected
                </span>
                <span className="text-slate-500 text-[11px]">
                  ({totalSelectedControls} Controls in {jurisdictionsCount} Jurisdictions)
                </span>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400 text-[10px] font-semibold mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('gcc')}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              >
                Top GCC Regs
              </button>
              <button
                type="button"
                onClick={() => applyPreset('cyber')}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              >
                All Cybersecurity
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ai')}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              >
                AI & GenAI Governance
              </button>
              <button
                type="button"
                onClick={() => applyPreset('privacy')}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              >
                Data Privacy / PDPL
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2 py-0.5 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors border border-emerald-600/40"
              >
                Select All 73
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-0.5 rounded-md bg-slate-800/60 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors border border-slate-800"
              >
                Clear
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
              {/* Search text */}
              <div className="sm:col-span-6 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by code, name, authority (e.g. ECC, SAMA, SDAIA, DESC)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Country dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="all">All Jurisdictions ({MENAT_COUNTRIES.length})</option>
                  {MENAT_COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="all">All Domains</option>
                  <option value="tech_cyber">Cybersecurity</option>
                  <option value="tech_ai">AI & Machine Learning</option>
                  <option value="tech_data_privacy">Data Privacy & Sovereignty</option>
                  <option value="tech_cloud">Cloud & Infrastructure</option>
                  <option value="tech_fintech_payments">Fintech & Payments</option>
                  <option value="tech_operational_resilience">Operational Resilience</option>
                  <option value="tech_ot_ics">OT & Critical Systems</option>
                  <option value="non_tech_impact">Statutory & Governance</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Action Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Showing {filteredRegulations.length} matching regulations:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Select All Shown ({filteredRegulations.length})</span>
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="text-slate-400 hover:text-slate-200 hover:underline flex items-center space-x-1"
                >
                  <Square className="w-3 h-3" />
                  <span>Deselect Shown</span>
                </button>
              </div>
            </div>

            {/* Scrollable Regulation Cards Checklist */}
            <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-lg bg-slate-900/60 p-2">
              {filteredRegulations.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <Info className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                  <p>No regulations matched the current search or filters.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterCountry('all');
                      setFilterCategory('all');
                    }}
                    className="mt-2 text-emerald-400 hover:underline text-xs"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredRegulations.map((reg) => {
                  const isChecked = selectedRegIds.has(reg.id);
                  const countryObj = MENAT_COUNTRIES.find((c) => c.id === reg.countryId);
                  const sampleControlsCount = reg.sampleControls ? reg.sampleControls.length : 0;

                  return (
                    <div
                      key={reg.id}
                      onClick={() => handleToggleRegulation(reg.id)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}

                        {/* Country Flag */}
                        <span className="text-sm shrink-0" title={countryObj?.name}>
                          {countryObj?.flag || '🌐'}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-[11px] truncate">{reg.code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                              {reg.authorityShort || reg.authority}
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline-block truncate">
                              {reg.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {countryObj?.name} • {reg.categoryLabel || reg.category}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata badge */}
                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                            sampleControlsCount > 0
                              ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {sampleControlsCount} mapped controls
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PDF Report Customization Panel (Accordion) */}
          {selectedFormat === 'pdf' && (
            <div className="border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPdfSettings(!showPdfSettings)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center space-x-2 text-slate-200 font-semibold text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF Report Customization & Layout Settings</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Title, Organization, Crosswalk Tables)
                  </span>
                </div>
                <span className="text-xs text-emerald-400 hover:underline">
                  {showPdfSettings ? 'Hide Options ▲' : 'Configure Options ▼'}
                </span>
              </button>

              {showPdfSettings && (
                <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-900/40 animate-in fade-in duration-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Report Title Header:
                      </label>
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Target Organization / Client:
                      </label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">
                        Auditor / Prepared By:
                      </label>
                      <input
                        type="text"
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center space-x-2 text-slate-300 text-[11px] cursor-pointer py-1.5">
                        <input
                          type="checkbox"
                          checked={filterMandatoryOnly}
                          onChange={(e) => setFilterMandatoryOnly(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Filter: Mandatory Controls Only (omit recommended)</span>
                      </label>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <label className="flex items-center space-x-2 text-slate-300 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeExecutiveSummary}
                        onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Include Executive Summary & Coverage Metrics</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-300 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCrosswalk}
                        onChange={(e) => setIncludeCrosswalk(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Include Tri-Framework Crosswalk (NIST / ISO / CCM)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-300 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeOfficialReferences}
                        onChange={(e) => setIncludeOfficialReferences(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Include Statutory Gazette & Official URLs</span>
                    </label>

                    <label className="flex items-center space-x-2 text-slate-300 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeClauseDescriptions}
                        onChange={(e) => setIncludeClauseDescriptions(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>Include Detailed Clause Requirements Text</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Included Features Checklist Callout */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-slate-400 block text-[11px]">
              Ready for Export ({selectedFormat.toUpperCase()}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {selectedRegulations.length} Selected Frameworks across {jurisdictionsCount} Jurisdictions
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {totalSelectedControls} Controls with Tri-Framework Mappings (NIST CSF, ISO 27001, CSA CCM)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Official Enacting Authority & Verified Gazette References</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {selectedFormat === 'pdf'
                    ? 'Crisp Multi-Page Printable PDF with Page Numbering'
                    : 'Universal CSV / JSON ready for GRC Tools & Excel'}
                </span>
              </div>
            </div>
          </div>

          {/* Status message */}
          {exportStatusMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-center font-medium text-xs flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{exportStatusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 text-center sm:text-left">
            <span className="font-semibold text-slate-200">{selectedRegulations.length}</span> regulations selected{' '}
            {selectedRegulations.length === 0 && (
              <span className="text-amber-400 font-medium">(Select at least 1)</span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Cancel
            </button>

            {selectedFormat === 'pdf' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleGeneratePdf(true)}
                  disabled={isExporting || selectedRegulations.length === 0}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs flex items-center space-x-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                  title="Open report in new browser tab without saving file"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Preview PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!canExportReports) {
                      triggerRestrictedAction(
                        'Download PDF Compliance Report',
                        'Downloading official audit dossiers requires the Compliance Manager role. Elevate to Manager to download.'
                      );
                      return;
                    }
                    handleGeneratePdf(false);
                  }}
                  disabled={isExporting || selectedRegulations.length === 0}
                  className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-lg disabled:opacity-50 cursor-pointer ${
                    !canExportReports
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  }`}
                  title={!canExportReports ? 'Requires Compliance Manager Role' : 'Download PDF Report'}
                >
                  {!canExportReports ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isExporting
                      ? 'Generating Report...'
                      : !canExportReports
                      ? `Download PDF (Manager Only)`
                      : `Download PDF Report (${selectedRegulations.length})`}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!canExportReports) {
                    triggerRestrictedAction(
                      `Export ${selectedFormat.toUpperCase()} Controls Matrix`,
                      `Exporting statutory controls spreadsheets requires the Compliance Manager role. Elevate to Manager to download.`
                    );
                    return;
                  }
                  handleDownloadCsvOrJson();
                }}
                disabled={isExporting || (selectedRegulations.length === 0 && filteredRegulations.length === 0)}
                className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer ${
                  !canExportReports
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title={!canExportReports ? 'Requires Compliance Manager Role' : `Download ${selectedFormat.toUpperCase()}`}
              >
                {!canExportReports ? (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExporting
                    ? 'Exporting...'
                    : !canExportReports
                    ? `Download ${selectedFormat.toUpperCase()} (Manager Only)`
                    : `Download ${selectedFormat.toUpperCase()} (${
                        selectedRegulations.length > 0 ? selectedRegulations.length : filteredRegulations.length
                      } Regs)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
