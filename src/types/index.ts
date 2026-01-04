// ============================================================================
// Result Type (for error handling)
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

// ============================================================================
// File Types
// ============================================================================

export type FileType = 'html' | 'css' | 'javascript' | 'json' | 'text';

export interface ProjectFile {
  id: string;
  name: string;
  content: string;
  type: FileType;
  updatedAt: string;
}

// ============================================================================
// Project Types
// ============================================================================

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

// ============================================================================
// Store Types
// ============================================================================

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
// Editor Types
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

// ============================================================================
// Preview Types
// ============================================================================

export interface PreviewError {
  message: string;
  line: number | null;
  column: number | null;
  stack?: string;
  timestamp: number;
}

export interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

export interface PreviewStoreState {
  blobUrl: string | null;
  isLoading: boolean;
  errors: PreviewError[];
  logs: ConsoleMessage[];
}

// ============================================================================
// UI Types
// ============================================================================

export interface PanelWidths {
  fileExplorer: number;
  editor: number;
  preview: number;
}

export type Theme = 'dark' | 'light' | 'cream';

export interface UIStoreState {
  panelWidths: PanelWidths;
  theme: Theme;
  consoleExpanded: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const FILE_VALIDATION = {
  MAX_FILENAME_LENGTH: 100,
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_PROJECT_SIZE: 10 * 1024 * 1024, // 10MB
  VALID_EXTENSIONS: ['html', 'htm', 'css', 'js', 'json', 'txt'],
  FILENAME_PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]+$/,
} as const;

export const PREVIEW_CONFIG = {
  DEBOUNCE_MS: 500,
  TIMEOUT_MS: 3000,
  SANDBOX_ATTRS: 'allow-scripts allow-same-origin',
} as const;

export const STORAGE_KEYS = {
  PROJECT: 'frontend-sandbox:project',
  UI: 'frontend-sandbox:ui',
} as const;
