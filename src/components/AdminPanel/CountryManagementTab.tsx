import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Country } from '../../types/regulatory';
import {
  Globe2,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Building,
  Shield,
  Layers,
  MapPin,
  Flag,
  Info,
} from 'lucide-react';

export const CountryManagementTab: React.FC = () => {
  const { countries, addCountry, updateCountry, deleteCountry, resetCountriesToDefault, regulations } = useAdmin();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [macroRegionFilter, setMacroRegionFilter] = useState<'all' | 'Middle East' | 'North Africa, The Sahel, & Horn of Africa'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deletingCountry, setDeletingCountry] = useState<Country | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    code: string;
    flag: string;
    capital: string;
    macroRegion: 'Middle East' | 'North Africa, The Sahel, & Horn of Africa';
    region: 'GCC' | 'Middle East' | 'North Africa' | 'Levant & Other' | 'The Sahel' | 'Horn of Africa';
    primaryAuthoritiesInput: string;
    description: string;
  }>({
    id: '',
    name: '',
    code: '',
    flag: '🌐',
    capital: '',
    macroRegion: 'Middle East',
    region: 'Middle East',
    primaryAuthoritiesInput: '',
    description: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filtered Countries
  const filteredCountries = useMemo(() => {
    return countries.filter((c) => {
      if (macroRegionFilter !== 'all' && c.macroRegion !== macroRegionFilter) {
        return false;
      }
      if (regionFilter !== 'all' && c.region !== regionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesCapital = c.capital.toLowerCase().includes(q);
        const matchesAuth = c.primaryAuthorities.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesCapital && !matchesAuth) {
          return false;
        }
      }
      return true;
    });
  }, [countries, macroRegionFilter, regionFilter, searchQuery]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAdd = () => {
    setFormData({
      id: '',
      name: '',
      code: '',
      flag: '🌐',
      capital: '',
      macroRegion: 'Middle East',
      region: 'Middle East',
      primaryAuthoritiesInput: '',
      description: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Country) => {
    setEditingCountry(c);
    setFormData({
      id: c.id,
      name: c.name,
      code: c.code,
      flag: c.flag,
      capital: c.capital,
      macroRegion: c.macroRegion || 'Middle East',
      region: c.region,
      primaryAuthoritiesInput: c.primaryAuthorities.join(', '),
      description: c.description,
    });
    setFormError(null);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Country / Jurisdiction name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('ISO country code is required (e.g. SA, AE, TR, EG).');
      return;
    }

    const cleanId = (formData.id.trim() || formData.code.trim().toLowerCase().slice(0, 3)).replace(/[^a-z0-9]/g, '');
    if (!cleanId) {
      setFormError('A valid alphanumeric unique ID is required.');
      return;
    }

    if (countries.some((c) => c.id.toLowerCase() === cleanId.toLowerCase())) {
      setFormError(`A country with ID "${cleanId}" already exists. Please choose a distinct ID.`);
      return;
    }

    const authorities = formData.primaryAuthoritiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newCountry: Country = {
      id: cleanId,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      flag: formData.flag.trim() || '🌐',
      capital: formData.capital.trim() || 'Undisclosed',
      macroRegion: formData.macroRegion,
      region: formData.region,
      primaryAuthorities: authorities.length > 0 ? authorities : ['National Regulatory Authority'],
      description: formData.description.trim() || `Sovereign jurisdiction regulatory compliance profile for ${formData.name}.`,
      totalRegulationsCount: 0,
      techRegulationsCount: 0,
      nonTechRegulationsCount: 0,
    };

    addCountry(newCountry);
    setIsAddModalOpen(false);
    showToast(`Jurisdiction "${newCountry.name}" added successfully.`);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;

    if (!formData.name.trim()) {
      setFormError('Country / Jurisdiction name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('ISO country code is required.');
      return;
    }

    const authorities = formData.primaryAuthoritiesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Partial<Country> = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      flag: formData.flag.trim() || '🌐',
      capital: formData.capital.trim() || 'Undisclosed',
      macroRegion: formData.macroRegion,
      region: formData.region,
      primaryAuthorities: authorities.length > 0 ? authorities : editingCountry.primaryAuthorities,
      description: formData.description.trim() || editingCountry.description,
    };

    updateCountry(editingCountry.id, updates);
    setEditingCountry(null);
    showToast(`Jurisdiction "${formData.name}" amended successfully.`);
  };

  const handleConfirmDelete = () => {
    if (!deletingCountry) return;
    deleteCountry(deletingCountry.id);
    showToast(`Jurisdiction "${deletingCountry.name}" removed from registry.`);
    setDeletingCountry(null);
  };

  // Metrics
  const gccCount = countries.filter((c) => c.region === 'GCC').length;
  const northAfricaCount = countries.filter((c) => c.macroRegion === 'North Africa, The Sahel, & Horn of Africa').length;
  const middleEastCount = countries.filter((c) => c.macroRegion === 'Middle East').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header and Control Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Jurisdictions &amp; Sovereign Countries Manager</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  MODULAR NO-CODE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Directly add, modify, amend, or remove sovereign jurisdictions and authorities without code changes.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sovereign Jurisdiction</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all sovereign jurisdictions to the default 24-state MENAT baseline?')) {
                  resetCountriesToDefault();
                  showToast('Reset all jurisdictions to default system baseline.');
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset to 24 Sovereign States baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Jurisdictions</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-white">{countries.length}</span>
              <span className="text-[11px] text-slate-400">Sovereign States</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">GCC Sovereign Bloc</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-cyan-400">{gccCount}</span>
              <span className="text-[11px] text-slate-400">Member States</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Middle East Macro</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-amber-400">{middleEastCount}</span>
              <span className="text-[11px] text-slate-400">States</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">North Africa / Sahel / Horn</span>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-xl font-bold text-emerald-400">{northAfricaCount}</span>
              <span className="text-[11px] text-slate-400">States</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search jurisdiction name, ISO code, capital, authority..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={macroRegionFilter}
              onChange={(e) => setMacroRegionFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Macro-Region: All Sovereign Regions</option>
              <option value="Middle East">Middle East</option>
              <option value="North Africa, The Sahel, & Horn of Africa">North Africa, The Sahel, &amp; Horn of Africa</option>
            </select>
          </div>

          <div>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="all">Sub-Region: All Sub-Regions</option>
              <option value="GCC">GCC (Gulf Cooperation Council)</option>
              <option value="Middle East">Middle East (General)</option>
              <option value="North Africa">North Africa</option>
              <option value="The Sahel">The Sahel</option>
              <option value="Horn of Africa">Horn of Africa</option>
              <option value="Levant & Other">Levant &amp; Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jurisdictions Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            Configured Jurisdictions ({filteredCountries.length} of {countries.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Real-time synchronization with active Regulations &amp; Crawlers
          </span>
        </div>

        {filteredCountries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No jurisdictions match the current search or regional filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredCountries.map((country) => {
              const countryRegs = regulations.filter((r) => r.countryId.toLowerCase() === country.id.toLowerCase());
              return (
                <div
                  key={country.id}
                  className="p-5 hover:bg-slate-850/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5 min-w-[280px]">
                    <span className="text-3xl select-none" role="img" aria-label={country.name}>
                      {country.flag}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white">{country.name}</h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                          {country.code}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300">
                          ID: {country.id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{country.capital}</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">{country.region}</span>
                        {country.macroRegion && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">{country.macroRegion}</span>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 max-w-xl">
                        {country.description}
                      </p>
                    </div>
                  </div>

                  {/* Authorities & Regulation Badges */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                        Primary Regulatory Authorities
                      </span>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {country.primaryAuthorities.slice(0, 5).map((auth, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60"
                          >
                            {auth}
                          </span>
                        ))}
                        {country.primaryAuthorities.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                            +{country.primaryAuthorities.length - 5}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-center sm:text-right shrink-0">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">
                        Regulations Tracked
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                          {countryRegs.length} Active
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({countryRegs.filter((r) => r.isTech).length} Tech / {countryRegs.filter((r) => !r.isTech).length} Corp)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenEdit(country)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                        title="Amend Jurisdiction Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Amend</span>
                      </button>

                      <button
                        onClick={() => setDeletingCountry(country)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Jurisdiction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Jurisdiction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add New Sovereign Jurisdiction</h3>
                <p className="text-xs text-slate-400">
                  Register a sovereign country or regulatory zone without touching code.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Jurisdiction / Sovereign Country Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Türkiye, Jordan, Morocco"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ISO Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="e.g. TR, JO, MA"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Unique System ID
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Flag Emoji
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 🇹🇷 or 🇯🇴"
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-center text-base focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Capital City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ankara, Amman"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Macro-Region
                  </label>
                  <select
                    value={formData.macroRegion}
                    onChange={(e) => setFormData({ ...formData, macroRegion: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Middle East">Middle East</option>
                    <option value="North Africa, The Sahel, & Horn of Africa">
                      North Africa, The Sahel, &amp; Horn of Africa
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sub-Region
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="GCC">GCC (Gulf Cooperation Council)</option>
                    <option value="Middle East">Middle East</option>
                    <option value="North Africa">North Africa</option>
                    <option value="The Sahel">The Sahel</option>
                    <option value="Horn of Africa">Horn of Africa</option>
                    <option value="Levant & Other">Levant &amp; Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Primary Regulatory Authorities (comma-separated) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BDDK, KVKK, BTK, Central Bank"
                  value={formData.primaryAuthoritiesInput}
                  onChange={(e) => setFormData({ ...formData, primaryAuthoritiesInput: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Authorities entered here will be tracked in regulatory feeds, crosswalks, and crawler queues.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jurisdiction Profile &amp; Regulatory Posture
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of statutory cybersecurity posture, legal framework, and compliance requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Sovereign Jurisdiction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Jurisdiction Modal */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-white relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setEditingCountry(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-800">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Amend Sovereign Jurisdiction: {editingCountry.name}</h3>
                <p className="text-xs text-slate-400">
                  Update sovereign authorities, region classification, or posture description.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Jurisdiction / Sovereign Country Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ISO Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Flag Emoji
                  </label>
                  <input
                    type="text"
                    value={formData.flag}
                    onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-center text-base focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Capital City
                  </label>
                  <input
                    type="text"
                    value={formData.capital}
                    onChange={(e) => setFormData({ ...formData, capital: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Macro-Region
                  </label>
                  <select
                    value={formData.macroRegion}
                    onChange={(e) => setFormData({ ...formData, macroRegion: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Middle East">Middle East</option>
                    <option value="North Africa, The Sahel, & Horn of Africa">
                      North Africa, The Sahel, &amp; Horn of Africa
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sub-Region
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="GCC">GCC (Gulf Cooperation Council)</option>
                    <option value="Middle East">Middle East</option>
                    <option value="North Africa">North Africa</option>
                    <option value="The Sahel">The Sahel</option>
                    <option value="Horn of Africa">Horn of Africa</option>
                    <option value="Levant & Other">Levant &amp; Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Primary Regulatory Authorities (comma-separated) *
                </label>
                <input
                  type="text"
                  value={formData.primaryAuthoritiesInput}
                  onChange={(e) => setFormData({ ...formData, primaryAuthoritiesInput: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Jurisdiction Profile &amp; Regulatory Posture
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Jurisdiction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCountry && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 text-white relative animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-white mb-2">
              Delete Sovereign Jurisdiction?
            </h3>

            <p className="text-xs text-slate-300 text-center leading-relaxed mb-4">
              Are you sure you want to delete{' '}
              <strong className="text-white">{deletingCountry.name} ({deletingCountry.code})</strong>?
            </p>

            {regulations.filter((r) => r.countryId.toLowerCase() === deletingCountry.id.toLowerCase()).length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                <span className="font-bold block mb-1">Notice:</span>
                There are {regulations.filter((r) => r.countryId.toLowerCase() === deletingCountry.id.toLowerCase()).length} regulations associated with this country. Deleting the jurisdiction will remove it from navigation filters.
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCountry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Deletion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
