# Data Model: Frontend Development Sandbox MVP

**Date**: 2026-01-03
**Feature**: 001-init-mvp
**Status**: Complete

## Overview

This document defines the data model for the frontend development sandbox. All entities are client-side only with localStorage persistence.

---

## Core Entities

### 1. Project

The root entity representing a user's workspace.

```typescript
interface Project {
  /** Unique identifier (UUID) */
  id: string;

  /** Display name */
  name: string;

  /** Project files indexed by filename */
  files: Record<string, ProjectFile>;

  /** Currently active file for editing */
  activeFileId: string;

  /** Entry point file for preview (usually index.html) */
  entryFile: string;

  /** ISO timestamp of creation */
  createdAt: string;

  /** ISO timestamp of last modification */
  updatedAt: string;

  /** Schema version for migrations */
  version: 1;
}
```

**Constraints**:
- `name`: 1-50 characters, alphanumeric + spaces/hyphens
- `files`: At least 1 file required
- `entryFile`: Must exist in `files`
- `activeFileId`: Must exist in `files`

**Default Values**:
```typescript
const DEFAULT_PROJECT: Project = {
  id: crypto.randomUUID(),
  name: 'My Project',
  files: { /* see ProjectFile defaults */ },
  activeFileId: 'index.html',
  entryFile: 'index.html',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
};
```

---

### 2. ProjectFile

Individual file within a project.

```typescript
interface ProjectFile {
  /** Unique identifier (filename serves as ID) */
  id: string;

  /** Filename with extension (e.g., "index.html") */
  name: string;

  /** File content as string */
  content: string;

  /** Detected file type */
  type: FileType;

  /** ISO timestamp of last modification */
  updatedAt: string;
}

type FileType =
  | 'html'
  | 'css'
  | 'javascript'
  | 'json'
  | 'text';
```

**Constraints**:
- `name`: 1-100 characters, valid filename characters
- `name`: Unique within project
- `name`: Must have valid extension (.html, .css, .js, .json, .txt)
- `content`: Max 1MB (1,048,576 characters)

**Validation Rules**:
```typescript
const VALID_EXTENSIONS = ['html', 'htm', 'css', 'js', 'json', 'txt'];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_FILENAME_LENGTH = 100;

function validateFileName(name: string): boolean {
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]+$/;
  if (!regex.test(name)) return false;
  const ext = name.split('.').pop()?.toLowerCase();
  return VALID_EXTENSIONS.includes(ext || '');
}
```

---

### 3. EditorState

Current state of the code editor (transient, not persisted).

```typescript
interface EditorState {
  /** Currently displayed file */
  activeFileId: string;

  /** Cursor position */
  cursor: CursorPosition;

  /** Selected text range (null if no selection) */
  selection: SelectionRange | null;

  /** Scroll position */
  scrollTop: number;

  /** Undo/redo stacks managed by Monaco */
}

interface CursorPosition {
  line: number;   // 1-indexed
  column: number; // 1-indexed
}

interface SelectionRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

**Note**: EditorState is managed internally by Monaco Editor. Only `activeFileId` is persisted.

---

### 4. PreviewState

State of the preview panel (transient).

```typescript
interface PreviewState {
  /** Current Blob URL being displayed */
  blobUrl: string | null;

  /** Whether preview is currently loading */
  isLoading: boolean;

  /** JavaScript runtime errors from preview */
  errors: PreviewError[];

  /** Console log messages */
  logs: ConsoleMessage[];
}

interface PreviewError {
  message: string;
  line: number | null;
  column: number | null;
  stack?: string;
  timestamp: number;
}

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  args: string[];
  timestamp: number;
}
```

---

### 5. UIState

Application UI state (partially persisted).

```typescript
interface UIState {
  /** Panel widths as percentages */
  panelWidths: {
    fileExplorer: number;  // default: 15
    editor: number;        // default: 45
    preview: number;       // default: 40
  };

  /** Current theme */
  theme: 'dark' | 'light';

  /** Whether console is expanded */
  consoleExpanded: boolean;
}
```

**Persistence**: Panel widths and theme are persisted. Console state is transient.

---

## State Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application State                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    Project (persisted)                    │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │  │
│   │  │ ProjectFile │  │ ProjectFile │  │ ProjectFile │  ...  │  │
│   │  │ index.html  │  │ styles.css  │  │ script.js   │       │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘       │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│   ┌─────────────────┐ ┌─────────────┐ ┌─────────────┐          │
│   │   EditorState   │ │ PreviewState│ │   UIState   │          │
│   │   (transient)   │ │ (transient) │ │  (partial)  │          │
│   └─────────────────┘ └─────────────┘ └─────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Storage Schema

### localStorage Key Structure

| Key | Type | Description |
|-----|------|-------------|
| `frontend-sandbox:project` | `Project` | Main project data |
| `frontend-sandbox:ui` | `UIState` | UI preferences |

### Serialization

```typescript
// Save project
function saveProject(project: Project): void {
  const data = JSON.stringify(project);
  if (data.length > 10 * 1024 * 1024) {
    throw new Error('Project exceeds 10MB limit');
  }
  localStorage.setItem('frontend-sandbox:project', data);
}

// Load project
function loadProject(): Project | null {
  const data = localStorage.getItem('frontend-sandbox:project');
  if (!data) return null;

  const project = JSON.parse(data) as Project;

  // Migration check
  if (project.version < CURRENT_VERSION) {
    return migrateProject(project);
  }

  return project;
}
```

---

## Entity Lifecycle

### Project

```
                    ┌──────────────┐
                    │   Initial    │
                    │   (no data)  │
                    └──────┬───────┘
                           │ loadProject()
                           ▼
            ┌──────────────────────────────┐
            │         Check Storage         │
            └──────────────┬───────────────┘
                    ┌──────┴──────┐
                    │             │
              exists│             │ not exists
                    ▼             ▼
            ┌───────────┐   ┌───────────┐
            │   Load    │   │  Create   │
            │ Existing  │   │  Default  │
            └─────┬─────┘   └─────┬─────┘
                  │               │
                  └───────┬───────┘
                          ▼
                  ┌───────────────┐
                  │    Active     │
                  │   (editing)   │◄────────┐
                  └───────┬───────┘         │
                          │                 │
            ┌─────────────┼─────────────┐   │
            ▼             ▼             ▼   │
     ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  Edit    │  │  Add/    │  │  Export  │
     │  File    │  │  Delete  │  │  ZIP     │
     └────┬─────┘  └────┬─────┘  └──────────┘
          │             │
          └──────┬──────┘
                 │ auto-save (debounced)
                 ▼
          ┌──────────────┐
          │    Save      │──────────────────┘
          │  to Storage  │
          └──────────────┘
```

### ProjectFile

```
     ┌─────────────────┐
     │     Create      │
     │  (user action)  │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │     Active      │◄────────────┐
     │   (in editor)   │             │
     └────────┬────────┘             │
              │                      │
    ┌─────────┼─────────┐           │
    ▼         ▼         ▼           │
┌───────┐ ┌───────┐ ┌───────┐       │
│ Edit  │ │Rename │ │Switch │───────┘
└───┬───┘ └───┬───┘ └───────┘
    │         │
    └────┬────┘
         │ content/name change
         ▼
    ┌─────────┐
    │ Updated │
    │ (dirty) │
    └────┬────┘
         │ auto-save
         ▼
    ┌─────────┐
    │  Saved  │
    └─────────┘
         │
         │ delete (if not last file)
         ▼
    ┌─────────┐
    │ Deleted │
    └─────────┘
```

---

## File Type Detection

```typescript
function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, FileType> = {
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'js': 'javascript',
    'mjs': 'javascript',
    'json': 'json',
    'txt': 'text',
  };

  return typeMap[ext || ''] || 'text';
}

function getMonacoLanguage(type: FileType): string {
  const languageMap: Record<FileType, string> = {
    'html': 'html',
    'css': 'css',
    'javascript': 'javascript',
    'json': 'json',
    'text': 'plaintext',
  };

  return languageMap[type];
}
```

---

## Validation Summary

| Entity | Field | Validation |
|--------|-------|------------|
| Project | name | 1-50 chars, alphanumeric + space/hyphen |
| Project | files | At least 1 file |
| ProjectFile | name | Valid filename, unique in project |
| ProjectFile | name | Max 100 chars |
| ProjectFile | content | Max 1MB |
| ProjectFile | type | Must match extension |
| Total | - | Project size < 10MB |
