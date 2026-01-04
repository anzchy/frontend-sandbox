/**
 * Store API Contracts
 *
 * This file defines the TypeScript interfaces for the Zustand stores.
 * These are internal APIs used by React components.
 */

// ============================================================================
// Project Store
// ============================================================================

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: 'html' | 'css' | 'javascript' | 'json' | 'text';
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  files: Record<string, ProjectFile>;
  activeFileId: string;
  entryFile: string;
  createdAt: string;
  updatedAt: string;
  version: 1;
}

export interface ProjectStoreState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

export interface ProjectStoreActions {
  // Project lifecycle
  loadProject: () => void;
  saveProject: () => void;
  resetProject: () => void;

  // File operations
  createFile: (name: string, content?: string) => Result<ProjectFile, string>;
  updateFile: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => Result<void, string>;
  deleteFile: (id: string) => Result<void, string>;

  // Navigation
  setActiveFile: (id: string) => void;
  setEntryFile: (id: string) => void;

  // Getters
  getFile: (id: string) => ProjectFile | undefined;
  getActiveFile: () => ProjectFile | undefined;
  getAllFiles: () => ProjectFile[];
}

export type ProjectStore = ProjectStoreState & ProjectStoreActions;

// ============================================================================
// Editor Store
// ============================================================================

export interface CursorPosition {
  line: number;
  column: number;
}

export interface SelectionRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface EditorStoreState {
  cursor: CursorPosition;
  selection: SelectionRange | null;
  scrollTop: number;
}

export interface EditorStoreActions {
  setCursor: (position: CursorPosition) => void;
  setSelection: (range: SelectionRange | null) => void;
  setScrollTop: (value: number) => void;
  reset: () => void;
}

export type EditorStore = EditorStoreState & EditorStoreActions;

// ============================================================================
// Preview Store
// ============================================================================

export interface PreviewError {
  message: string;
  line: number | null;
  column: number | null;
  stack?: string;
  timestamp: number;
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: number;
}

export interface PreviewStoreState {
  blobUrl: string | null;
  isLoading: boolean;
  errors: PreviewError[];
  logs: ConsoleMessage[];
}

export interface PreviewStoreActions {
  setBlobUrl: (url: string | null) => void;
  setLoading: (loading: boolean) => void;
  addError: (error: PreviewError) => void;
  addLog: (log: ConsoleMessage) => void;
  clearErrors: () => void;
  clearLogs: () => void;
  reset: () => void;
}

export type PreviewStore = PreviewStoreState & PreviewStoreActions;

// ============================================================================
// UI Store
// ============================================================================

export interface PanelWidths {
  fileExplorer: number;
  editor: number;
  preview: number;
}

export interface UIStoreState {
  panelWidths: PanelWidths;
  theme: 'dark' | 'light';
  consoleExpanded: boolean;
}

export interface UIStoreActions {
  setPanelWidths: (widths: Partial<PanelWidths>) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleConsole: () => void;
  setConsoleExpanded: (expanded: boolean) => void;
}

export type UIStore = UIStoreState & UIStoreActions;

// ============================================================================
// Utility Types
// ============================================================================

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}
