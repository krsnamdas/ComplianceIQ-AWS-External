import React from 'react';

interface ComplianceIQLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  showTagline?: boolean;
  variant?: 'shield' | 'full' | 'compact';
}

export const ComplianceIQLogo: React.FC<ComplianceIQLogoProps> = ({
  className = '',
  size = 40,
  showText = false,
  showTagline = false,
  variant = 'shield',
}) => {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md ${className}`}
      aria-label="ComplianceIQ Logo"
    >
      <defs>
        {/* Shield Ambient Glow */}
        <linearGradient id="ciq-shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* Deep Slate Shield Background */}
        <radialGradient id="ciq-shield-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="55%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        {/* Inner IQ Core Glow */}
        <linearGradient id="ciq-iq-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        {/* Neon Gold/Amber Spark Accent */}
        <linearGradient id="ciq-accent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <filter id="ciq-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hex-Shield Body */}
      <path
        d="M32 4L54 12V28C54 42.5 44.6 54.8 32 60C19.4 54.8 10 42.5 10 28V12L32 4Z"
        fill="url(#ciq-shield-bg)"
        stroke="url(#ciq-shield-gradient)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Subtle Inner Protective Contour */}
      <path
        d="M32 9L49 15.5V28C49 39.8 41.7 49.8 32 54.2C22.3 49.8 15 39.8 15 28V15.5L32 9Z"
        stroke="#10b981"
        strokeWidth="1"
        strokeOpacity="0.25"
        strokeDasharray="2 2"
      />

      {/* Stylized Outer "C" Arc for Compliance */}
      <path
        d="M36 20C28.5 20 22.5 25.5 22.5 32.5C22.5 39.5 28.5 45 36 45C39.5 45 42.6 43.6 44.8 41.3"
        stroke="url(#ciq-shield-gradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central "IQ" Neural Diamond & Optical Core */}
      <polygon
        points="34,26 40,32.5 34,39 28,32.5"
        fill="#0f172a"
        stroke="url(#ciq-iq-gradient)"
        strokeWidth="2"
      />

      {/* Inner Intelligence Point */}
      <circle cx="34" cy="32.5" r="2.2" fill="#38bdf8" filter="url(#ciq-glow)" />

      {/* "IQ" Spark / Radar Orbital Beam */}
      <path
        d="M38.5 37L44 42.5"
        stroke="url(#ciq-iq-gradient)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Compliance Verification Check Wing */}
      <path
        d="M26 31.5L31 36.5L43 23"
        stroke="#34d399"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ciq-glow)"
      />

      {/* Top Beacon - Sovereign Intelligence Indicator */}
      <circle cx="32" cy="14" r="2" fill="#10b981" />
      <circle cx="32" cy="14" r="4" stroke="#34d399" strokeWidth="0.8" strokeOpacity="0.6" />
    </svg>
  );

  if (!showText) {
    return icon;
  }

  return (
    <div className="flex items-center space-x-3">
      {icon}
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-lg tracking-tight text-white">
            Compliance<span className="text-cyan-400">IQ</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider font-mono">
            Platform
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-slate-400">
            Middle East, North Africa &amp; Türkiye Regulations &amp; Controls
          </p>
        )}
      </div>
    </div>
  );
};
