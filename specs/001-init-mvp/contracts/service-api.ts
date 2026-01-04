/**
 * Service API Contracts
 *
 * This file defines the TypeScript interfaces for service modules.
 * Services are pure functions/classes that handle business logic.
 */

import type { Project, ProjectFile, Result } from './store-api';

// ============================================================================
// Storage Service
// ============================================================================

/**
 * Handles persistence to localStorage.
 */
export interface StorageService {
  /**
   * Load project from localStorage.
   * @returns Project if exists, null otherwise
   */
  loadProject(): Project | null;

  /**
   * Save project to localStorage.
   * @throws Error if project exceeds size limit
   */
  saveProject(project: Project): void;

  /**
   * Clear all stored data.
   */
  clearAll(): void;

  /**
   * Get storage usage in bytes.
   */
  getStorageUsage(): number;

  /**
   * Check if storage is available.
   */
  isAvailable(): boolean;
}

// Storage keys
export const STORAGE_KEYS = {
  PROJECT: 'frontend-sandbox:project',
  UI: 'frontend-sandbox:ui',
} as const;

// ============================================================================
// Export Service
// ============================================================================

/**
 * Handles exporting project as ZIP file.
 */
export interface ExportService {
  /**
   * Export project files as a ZIP.
   * @param files - Map of filename to content
   * @param projectName - Name for the ZIP file
   * @returns Promise that resolves when download starts
   */
  exportAsZip(files: Record<string, string>, projectName: string): Promise<void>;
}

// ============================================================================
// File Service
// ============================================================================

/**
 * Handles file validation and utilities.
 */
export interface FileService {
  /**
   * Validate filename.
   * @returns Result with void on success, error message on failure
   */
  validateFileName(name: string): Result<void, string>;

  /**
   * Detect file type from filename.
   */
  detectFileType(filename: string): ProjectFile['type'];

  /**
   * Get Monaco Editor language from file type.
   */
  getMonacoLanguage(type: ProjectFile['type']): string;

  /**
   * Get file icon for display.
   */
  getFileIcon(type: ProjectFile['type']): string;

  /**
   * Check if file can be deleted (not last file).
   */
  canDeleteFile(files: Record<string, ProjectFile>, fileId: string): boolean;

  /**
   * Generate unique filename if name already exists.
   */
  generateUniqueName(baseName: string, existingNames: string[]): string;
}

// File validation constants
export const FILE_VALIDATION = {
  MAX_FILENAME_LENGTH: 100,
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_PROJECT_SIZE: 10 * 1024 * 1024, // 10MB
  VALID_EXTENSIONS: ['html', 'htm', 'css', 'js', 'json', 'txt'],
  FILENAME_PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]+$/,
} as const;

// ============================================================================
// Preview Service
// ============================================================================

/**
 * Handles preview generation.
 */
export interface PreviewService {
  /**
   * Generate preview HTML by combining files.
   * @param files - All project files
   * @param entryFile - Entry HTML file name
   * @returns Combined HTML string with inlined CSS/JS
   */
  generatePreviewHtml(
    files: Record<string, ProjectFile>,
    entryFile: string
  ): string;

  /**
   * Create Blob URL for preview.
   * @param html - Combined HTML string
   * @returns Blob URL (caller must revoke when done)
   */
  createBlobUrl(html: string): string;

  /**
   * Revoke a previously created Blob URL.
   */
  revokeBlobUrl(url: string): void;

  /**
   * Inject error handling script into HTML.
   */
  injectErrorHandler(html: string): string;
}

// Preview constants
export const PREVIEW_CONFIG = {
  DEBOUNCE_MS: 500,
  TIMEOUT_MS: 3000,
  SANDBOX_ATTRS: 'allow-scripts allow-same-origin',
} as const;

// ============================================================================
// Project Service
// ============================================================================

/**
 * Handles project-level operations.
 */
export interface ProjectService {
  /**
   * Create default project with starter files.
   */
  createDefaultProject(): Project;

  /**
   * Migrate project from older version.
   */
  migrateProject(project: Project): Project;

  /**
   * Validate project structure.
   */
  validateProject(project: Project): Result<void, string[]>;

  /**
   * Calculate project size in bytes.
   */
  calculateProjectSize(project: Project): number;
}

// Default file templates
export const DEFAULT_FILES = {
  'index.html': {
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start editing to see your changes.</p>
  <script src="script.js"></script>
</body>
</html>`,
    type: 'html' as const,
  },
  'styles.css': {
    content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  background: #1a1a2e;
  color: #eee;
}

h1 {
  color: #00d9ff;
  margin-bottom: 1rem;
}`,
    type: 'css' as const,
  },
  'script.js': {
    content: `console.log('Hello from JavaScript!');`,
    type: 'javascript' as const,
  },
} as const;
