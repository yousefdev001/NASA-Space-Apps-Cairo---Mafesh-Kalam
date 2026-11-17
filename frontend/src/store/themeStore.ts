import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SystemThemeMode = 'paper' | 'dark' | 'cyber';

interface ThemeState {
  mode: SystemThemeMode;
  setMode: (mode: SystemThemeMode) => void;
  toggleMode: () => void;
}

const applyThemeToDOM = (mode: SystemThemeMode) => {
  const root = document.documentElement;
  root.classList.remove('theme-paper', 'theme-dark-sketch', 'dark');

  if (mode === 'paper') {
    root.classList.add('theme-paper');
  } else if (mode === 'dark') {
    root.classList.add('dark', 'theme-dark-sketch');
  } else {
    // Cyber HUD
    root.classList.add('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'paper', // Default to the requested AuraMed Sketchbook Paper Mode
      setMode: (mode: SystemThemeMode) => {
        applyThemeToDOM(mode);
        set({ mode });
      },
      toggleMode: () => {
        const current = get().mode;
        const next: SystemThemeMode =
          current === 'paper' ? 'dark' : current === 'dark' ? 'cyber' : 'paper';
        applyThemeToDOM(next);
        set({ mode: next });
      },
    }),
    {
      name: 'auramed_system_theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.mode);
        }
      },
    }
  )
);

// Initialize on script load
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('auramed_system_theme');
  let initialMode: SystemThemeMode = 'paper';
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.state?.mode) initialMode = parsed.state.mode;
    } catch {
      // ignore
    }
  }
  applyThemeToDOM(initialMode);
}
