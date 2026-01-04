# State Management

This project uses [Zustand](https://github.com/pmndrs/zustand) for state management with two stores:

1. **projectStore** - Project data with localStorage persistence
2. **uiStore** - UI state (theme, console panel)

## Project Store

### State Shape

```typescript
interface ProjectStoreState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface Project {
  id: string;
  name: string;
  files: Record<string, ProjectFile>;
  activeFileId: string;
  entryFile: string;
  createdAt: string;
  updatedAt: string;
  version: 1;
}

interface ProjectFile {
  id: string;        // Same as filename
  name: string;      // Filename with extension
  content: string;   // File content
  type: FileType;    // 'html' | 'css' | 'javascript' | 'json' | 'text'
  updatedAt: string; // ISO timestamp
}
```

### Actions

```typescript
interface ProjectStoreActions {
  // Lifecycle
  loadProject: () => void;
  saveProject: () => void;
  resetProject: () => void;

  // File CRUD
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
```

### Persistence

The store uses Zustand's `persist` middleware:

```typescript
export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'frontend-sandbox-project',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ project: state.project }),
    }
  )
);
```

**Key points:**
- Only `project` is persisted (not `isLoading` or `error`)
- Storage key: `frontend-sandbox-project`
- Auto-saves on every state change

### Usage Examples

```typescript
// Select specific state (causes re-render only when this changes)
const activeFileId = useProjectStore((state) => state.project?.activeFileId);

// Select action (stable reference, no re-renders)
const updateFile = useProjectStore((state) => state.updateFile);

// Derive data with useMemo to avoid infinite loops
const filesRecord = useProjectStore((state) => state.project?.files);
const files = useMemo(() =>
  filesRecord ? Object.values(filesRecord) : [],
  [filesRecord]
);
```

## UI Store

### State Shape

```typescript
interface UIStoreState {
  panelWidths: PanelWidths;
  theme: Theme;
  consoleExpanded: boolean;
  previewErrors: PreviewError[];
  consoleLogs: ConsoleMessage[];
}

type Theme = 'dark' | 'light' | 'cream';

interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

interface PreviewError {
  message: string;
  line: number | null;
  column: number | null;
  stack?: string;
  timestamp: number;
}
```

### Actions

```typescript
interface UIStoreActions {
  setPanelWidths: (widths: Partial<PanelWidths>) => void;
  setTheme: (theme: Theme) => void;
  toggleConsole: () => void;
  setConsoleExpanded: (expanded: boolean) => void;
  addPreviewError: (error: PreviewError) => void;
  addConsoleLog: (log: ConsoleMessage) => void;
  clearPreviewErrors: () => void;
  clearConsoleLogs: () => void;
  clearAll: () => void;
}
```

### Theme Application

Theme changes are applied via CSS data attribute:

```typescript
function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

setTheme: (theme) => {
  applyTheme(theme);
  set({ theme });
},
```

### Console Log Limit

To prevent memory issues, only the last 100 logs are kept:

```typescript
addConsoleLog: (log) => {
  set((state) => ({
    consoleLogs: [...state.consoleLogs.slice(-99), log],
  }));
},
```

## Result Type Pattern

File operations return a `Result` type for explicit error handling:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Usage
const result = createFile('script.js');
if (result.ok) {
  console.log('Created:', result.value.name);
} else {
  console.error('Error:', result.error);
}
```

## Common Patterns

### Avoiding Re-render Loops

**Problem**: Zustand selectors that create new objects/arrays cause infinite re-renders.

```typescript
// BAD - creates new array every render
const files = useProjectStore((state) =>
  state.project ? Object.values(state.project.files) : []
);

// GOOD - stable reference + useMemo
const filesRecord = useProjectStore((state) => state.project?.files);
const files = useMemo(() =>
  filesRecord ? Object.values(filesRecord) : [],
  [filesRecord]
);
```

### Selecting Multiple Values

```typescript
// Option 1: Multiple selectors (fine for few values)
const activeFileId = useProjectStore((s) => s.project?.activeFileId);
const files = useProjectStore((s) => s.project?.files);

// Option 2: Shallow equality (for objects)
import { shallow } from 'zustand/shallow';
const { files, activeFileId } = useProjectStore(
  (s) => ({ files: s.project?.files, activeFileId: s.project?.activeFileId }),
  shallow
);
```

### Derived State

For complex derived state, use `useMemo` in components:

```typescript
const filesRecord = useProjectStore((s) => s.project?.files);

const sortedFiles = useMemo(() => {
  if (!filesRecord) return [];
  return Object.values(filesRecord)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [filesRecord]);
```
