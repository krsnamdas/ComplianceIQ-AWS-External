import React from 'react';
import { X, Scale, Sparkles, ShieldCheck, AlertCircle, BookOpen, Layers } from 'lucide-react';

interface ConfidenceLevelLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfidenceLevelLegendModal: React.FC<ConfidenceLevelLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Compliance Requirement Confidence Methodology</span>
              </h3>
              <p className="text-xs text-slate-400">
                AI scoring criteria for Mandatory vs. Guideline labels &amp; statistical confidence intervals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* 1. Classification Scoring Tiers */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Classification Scoring Scale</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Mandatory */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-rose-300 uppercase text-xs">Mandatory</span>
                  <span className="font-mono text-[11px] font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.2 rounded border border-rose-800">
                    90% - 99%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Primary statute or sovereign decree with statutory penalties. Triggered by modal imperatives (<code className="text-rose-200">shall</code>, <code className="text-rose-200">must</code>, <code className="text-rose-200">required</code>).
                </p>
              </div>

              {/* Conditional */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-300 uppercase text-xs">Conditional</span>
                  <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                    80% - 89%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Strictly mandatory once threshold triggers are met (e.g. processing citizen telemetry, critical national infrastructure, cross-border data transfer).
                </p>
              </div>

              {/* Guideline */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-300 uppercase text-xs">Guideline</span>
                  <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-800">
                    70% - 79%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Advisory recommendations, ethical frameworks, or best practices (<code className="text-indigo-200">should</code>, <code className="text-indigo-200">recommended</code>, <code className="text-indigo-200">encouraged</code>).
                </p>
              </div>
            </div>
          </div>

          {/* 2. Confidence Interval Calculation Formula */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>How the Autonomous AI Model Calculates the Confidence Interval</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The AI derives the statistical confidence interval <code className="font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">[L_bound - U_bound]</code> via a 4-factor statutory jurist matrix:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="font-bold text-white block">1. Legal Instrument Weight (40%)</span>
                <span className="text-slate-400">Royal Decree / Parliamentary Act &gt; Ministerial Order &gt; Regulatory Circular &gt; Guidance Memo.</span>
              </div>
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="font-bold text-white block">2. Deontic Modal Linguistic Verbs (30%)</span>
                <span className="text-slate-400">Strict imperative (&quot;shall/must&quot;) yields tight ±3% margins; ambiguous terms widen the interval to ±6%.</span>
              </div>
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="font-bold text-white block">3. Statutory Penal Liabilities (20%)</span>
                <span className="text-slate-400">Explicit monetary fines, stop-processing orders, or criminal exposure increases Mandatory confidence score.</span>
              </div>
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="font-bold text-white block">4. Multi-Standard Alignment (10%)</span>
                <span className="text-slate-400">Direct cross-walk to NIST CSF, ISO 27001, or CSA CCM specifications strengthens confidence calibration.</span>
              </div>
            </div>
          </div>

          {/* Reliability Guarantee */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300 leading-snug">
              <strong className="text-cyan-300">Auditor-Grade Verification:</strong> Confidence scores reflect objective statutory backing rather than speculative interpretations, ensuring defensible compliance roadmaps during formal audits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">Model: Autonomous Statutory AI Jurisprudence Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
