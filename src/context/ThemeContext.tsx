import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'complianceiq_theme_v1';
/** Legacy key from the previous "brighter display" toggle (migrated on load). */
const LEGACY_BRIGHT_KEY = 'complianceiq_bright_mode_v1';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextValue {
  /** Active color theme: 'dark' (Warm Graphite) or 'light' (Light Executive). */
  theme: ThemeMode;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;

  /** @deprecated Back-compat alias. `brightMode === true` means light theme. */
  brightMode: boolean;
  /** @deprecated Back-compat alias for `toggleTheme`. */
  toggleBrightMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    // Migrate the legacy brightness flag: "bright" ~= light.
    const legacy = localStorage.getItem(LEGACY_BRIGHT_KEY);
    if (legacy === 'true') return 'light';
  } catch {
    // localStorage unavailable — fall through to default.
  }
  return 'dark'; // Dark (Warm Graphite) is the default.
}

/**
 * ThemeProvider manages the app color theme.
 *
 * The palette is defined once in `index.css` via a Tailwind v4 `@theme` token
 * layer; `html.light` overrides those tokens with the light palette. Rather than
 * editing ~1,800 hardcoded color classes across 43 components, flipping the root
 * class re-skins the whole app.
 *
 * We also toggle the `dark` class on <html> so Tailwind's `dark:` variant tracks
 * the *app* theme (a few components — e.g. ControlInterpreter — use `dark:`
 * utilities). This keeps those components consistent with the chosen theme
 * instead of following the OS `prefers-color-scheme`.
 *
 * The choice persists to localStorage so it survives reloads.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    // `light` class drives our palette token overrides (see index.css).
    // We ALSO keep the `dark` class present at all times: exactly one component
    // (ControlInterpreter) is authored with Tailwind `dark:` variants that
    // reference the same slate/indigo tokens our theme layer controls. Forcing
    // its `dark:` branch to always apply means it inherits our light/dark token
    // values like every other component, instead of falling back to a stale
    // light branch that assumes the default (un-themed) color scale.
    root.classList.add('dark');
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // non-fatal
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => setThemeState(mode), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  );

  const value: ThemeContextValue = {
    theme,
    isLight: theme === 'light',
    toggleTheme,
    setTheme,
    // Back-compat aliases (bright === light)
    brightMode: theme === 'light',
    toggleBrightMode: toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
