# File Operations

This document covers file management, validation, and related services.

## File Service (`fileService.ts`)

### File Type Detection

```typescript
const FILE_EXTENSIONS: Record<string, FileType> = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  json: 'json',
  txt: 'text',
};

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return FILE_EXTENSIONS[ext] ?? 'text';
}
```

### File Validation

```typescript
export const FILE_VALIDATION = {
  MAX_FILENAME_LENGTH: 100,
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  MAX_PROJECT_SIZE: 10 * 1024 * 1024, // 10MB
  VALID_EXTENSIONS: ['html', 'htm', 'css', 'js', 'json', 'txt'],
  FILENAME_PATTERN: /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]+$/,
};

export function validateFileName(name: string): Result<void, string> {
  // Check length
  if (name.length > FILE_VALIDATION.MAX_FILENAME_LENGTH) {
    return err(`Filename too long (max ${FILE_VALIDATION.MAX_FILENAME_LENGTH} chars)`);
  }

  // Check pattern
  if (!FILE_VALIDATION.FILENAME_PATTERN.test(name)) {
    return err('Invalid filename. Use letters, numbers, dots, hyphens, underscores.');
  }

  // Check extension
  const ext = name.split('.').pop()?.toLowerCase();
  if (!ext || !FILE_VALIDATION.VALID_EXTENSIONS.includes(ext)) {
    return err(`Invalid extension. Allowed: ${FILE_VALIDATION.VALID_EXTENSIONS.join(', ')}`);
  }

  return ok(undefined);
}
```

### Validation Rules

| Rule | Constraint |
|------|------------|
| Length | Max 100 characters |
| Pattern | Must start with alphanumeric, contain only `a-z`, `0-9`, `.`, `-`, `_` |
| Extension | Must be `.html`, `.htm`, `.css`, `.js`, `.json`, or `.txt` |
| Duplicates | No two files with same name |

### File Icons

```typescript
const FILE_ICONS: Record<FileType, string> = {
  html: '📄',
  css: '🎨',
  javascript: '⚡',
  json: '📋',
  text: '📝',
};

export function getFileIcon(type: FileType): string {
  return FILE_ICONS[type] ?? '📄';
}
```

### Monaco Language Mapping

```typescript
const MONACO_LANGUAGES: Record<FileType, string> = {
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  json: 'json',
  text: 'plaintext',
};

export function getMonacoLanguage(type: FileType): string {
  return MONACO_LANGUAGES[type] ?? 'plaintext';
}
```

## Store Operations

### Create File

```typescript
createFile: (name: string, content = '') => {
  const project = get().project;
  if (!project) return err('No project loaded');

  // Validate filename
  const validation = validateFileName(name);
  if (!validation.ok) return validation;

  // Check for duplicates
  if (project.files[name]) {
    return err(`File "${name}" already exists`);
  }

  const newFile: ProjectFile = {
    id: name,
    name,
    content,
    type: detectFileType(name),
    updatedAt: new Date().toISOString(),
  };

  set({
    project: {
      ...project,
      files: { ...project.files, [name]: newFile },
      updatedAt: new Date().toISOString(),
    },
  });

  return ok(newFile);
},
```

### Rename File

```typescript
renameFile: (id: string, newName: string) => {
  const project = get().project;
  if (!project) return err('No project loaded');

  const file = project.files[id];
  if (!file) return err('File not found');

  // Validate new filename
  const validation = validateFileName(newName);
  if (!validation.ok) return validation;

  // Check for duplicates
  if (newName !== id && project.files[newName]) {
    return err(`File "${newName}" already exists`);
  }

  // Remove old key, add new key
  const { [id]: _, ...restFiles } = project.files;

  const renamedFile: ProjectFile = {
    ...file,
    id: newName,
    name: newName,
    type: detectFileType(newName),
    updatedAt: new Date().toISOString(),
  };

  set({
    project: {
      ...project,
      files: { ...restFiles, [newName]: renamedFile },
      // Update references
      activeFileId: project.activeFileId === id ? newName : project.activeFileId,
      entryFile: project.entryFile === id ? newName : project.entryFile,
      updatedAt: new Date().toISOString(),
    },
  });

  return ok(undefined);
},
```

### Delete File

```typescript
deleteFile: (id: string) => {
  const project = get().project;
  if (!project) return err('No project loaded');

  // Prevent deleting last file
  const fileCount = Object.keys(project.files).length;
  if (fileCount <= 1) {
    return err('Cannot delete the last file');
  }

  if (!project.files[id]) {
    return err('File not found');
  }

  const { [id]: _, ...restFiles } = project.files;
  const remainingFileIds = Object.keys(restFiles);

  // Update activeFileId if needed
  let newActiveFileId = project.activeFileId;
  if (project.activeFileId === id) {
    newActiveFileId = remainingFileIds[0] ?? '';
  }

  // Update entryFile if needed
  let newEntryFile = project.entryFile;
  if (project.entryFile === id) {
    // Prefer another HTML file
    newEntryFile = remainingFileIds.find((f) => f.endsWith('.html'))
      ?? remainingFileIds[0] ?? '';
  }

  set({
    project: {
      ...project,
      files: restFiles,
      activeFileId: newActiveFileId,
      entryFile: newEntryFile,
      updatedAt: new Date().toISOString(),
    },
  });

  return ok(undefined);
},
```

## Export Service (`exportService.ts`)

### ZIP Export

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const exportService = {
  async exportAsZip(project: Project): Promise<Result<void, string>> {
    try {
      const zip = new JSZip();

      // Add all project files to ZIP
      for (const file of Object.values(project.files)) {
        zip.file(file.name, file.content);
      }

      // Generate ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Sanitize filename
      const projectName = project.name
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();

      const filename = `${projectName || 'project'}.zip`;

      // Download
      saveAs(blob, filename);

      return ok(undefined);
    } catch (error) {
      return err(`Failed to export: ${error.message}`);
    }
  },
};
```

## Storage Service (`storageService.ts`)

### Manual Storage Operations

While Zustand's persist middleware handles auto-save, the storage service provides manual control:

```typescript
const STORAGE_KEY = 'frontend-sandbox-project';
const STORAGE_VERSION = 1;

interface StoredData {
  version: number;
  project: Project;
  savedAt: string;
}

export const storageService = {
  saveProject(project: Project): Result<void, string> {
    try {
      const data: StoredData = {
        version: STORAGE_VERSION,
        project,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return ok(undefined);
    } catch (error) {
      return err(`Failed to save: ${error.message}`);
    }
  },

  loadProject(): Result<Project | null, string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return ok(null);

      const data: StoredData = JSON.parse(stored);
      return ok(data.project);
    } catch (error) {
      return err(`Failed to load: ${error.message}`);
    }
  },

  clearProject(): Result<void, string> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return ok(undefined);
    } catch (error) {
      return err(`Failed to clear: ${error.message}`);
    }
  },

  hasStoredProject(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};
```

## File Operations UI

### NewFileDialog

Quick templates for common file types:

```typescript
const FILE_TEMPLATES = [
  { ext: '.html', label: 'HTML', icon: '📄' },
  { ext: '.css', label: 'CSS', icon: '🎨' },
  { ext: '.js', label: 'JavaScript', icon: '⚡' },
  { ext: '.json', label: 'JSON', icon: '📋' },
  { ext: '.txt', label: 'Text', icon: '📝' },
];

// Click template button
const handleTemplateClick = (ext: string) => {
  const baseName = name.split('.')[0] || 'newfile';
  setName(baseName + ext);
};
```

### FileItem Context Menu

Right-click context menu for file operations:

```typescript
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  setContextMenuPos({ x: e.clientX, y: e.clientY });
  setShowContextMenu(true);
};

// Menu options
<div className="context-menu">
  <button onClick={handleStartRename}>✏️ Rename</button>
  {canDelete && (
    <button onClick={handleDelete}>🗑️ Delete</button>
  )}
</div>
```

### Inline Rename

Double-click to rename with inline editing:

```typescript
const handleStartRename = () => {
  setEditName(file.name);
  setIsEditing(true);
};

// Input with Enter to confirm, Escape to cancel
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') handleRename();
  if (e.key === 'Escape') {
    setIsEditing(false);
    setEditName(file.name);
  }
};
```
