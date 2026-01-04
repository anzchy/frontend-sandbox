import { create } from 'zustand';
import type { PanelWidths, PreviewError, ConsoleMessage, Theme } from '@/types';

interface UIStoreState {
  // Panel layout
  panelWidths: PanelWidths;
  theme: Theme;

  // Preview state
  consoleExpanded: boolean;
  previewErrors: PreviewError[];
  consoleLogs: ConsoleMessage[];
}

interface UIStoreActions {
  // Panel layout
  setPanelWidths: (widths: Partial<PanelWidths>) => void;
  setTheme: (theme: Theme) => void;

  // Console
  toggleConsole: () => void;
  setConsoleExpanded: (expanded: boolean) => void;

  // Preview messages
  addPreviewError: (error: PreviewError) => void;
  addConsoleLog: (log: ConsoleMessage) => void;
  clearPreviewErrors: () => void;
  clearConsoleLogs: () => void;
  clearAll: () => void;
}

export type UIStore = UIStoreState & UIStoreActions;

// Apply theme to document
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

const DEFAULT_PANEL_WIDTHS: PanelWidths = {
  fileExplorer: 15,
  editor: 45,
  preview: 40,
};

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  panelWidths: DEFAULT_PANEL_WIDTHS,
  theme: 'dark',
  consoleExpanded: false,
  previewErrors: [],
  consoleLogs: [],

  // Panel layout actions
  setPanelWidths: (widths) => {
    set((state) => ({
      panelWidths: { ...state.panelWidths, ...widths },
    }));
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  // Console actions
  toggleConsole: () => {
    set((state) => ({ consoleExpanded: !state.consoleExpanded }));
  },

  setConsoleExpanded: (expanded) => {
    set({ consoleExpanded: expanded });
  },

  // Preview message actions
  addPreviewError: (error) => {
    set((state) => ({
      previewErrors: [...state.previewErrors, error],
      consoleExpanded: true, // Auto-expand on error
    }));
  },

  addConsoleLog: (log) => {
    set((state) => ({
      consoleLogs: [...state.consoleLogs.slice(-99), log], // Keep last 100 logs
    }));
  },

  clearPreviewErrors: () => {
    set({ previewErrors: [] });
  },

  clearConsoleLogs: () => {
    set({ consoleLogs: [] });
  },

  clearAll: () => {
    set({ previewErrors: [], consoleLogs: [] });
  },
}));
