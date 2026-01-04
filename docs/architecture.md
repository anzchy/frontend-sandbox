# Architecture Overview

## Directory Structure

```
src/
├── components/           # React components
│   ├── Editor/          # Monaco editor wrapper
│   │   ├── Editor.tsx
│   │   ├── EditorTabs.tsx
│   │   └── editor.css
│   ├── FileExplorer/    # File tree sidebar
│   │   ├── FileExplorer.tsx
│   │   ├── FileItem.tsx
│   │   ├── NewFileDialog.tsx
│   │   ├── file-explorer.css
│   │   └── index.ts
│   ├── Layout/          # App layout components
│   │   ├── Header.tsx
│   │   ├── SplitPane.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── layout.css
│   └── Preview/         # Live preview iframe
│       ├── Preview.tsx
│       ├── PreviewToolbar.tsx
│       ├── ConsolePanel.tsx
│       └── preview.css
├── hooks/               # Custom React hooks
│   └── useDebounce.ts
├── services/            # Business logic
│   ├── fileService.ts   # File validation & utilities
│   ├── storageService.ts # localStorage wrapper
│   └── exportService.ts  # ZIP export
├── stores/              # Zustand state stores
│   ├── projectStore.ts  # Project & file state
│   └── uiStore.ts       # UI state (theme, console)
├── types/               # TypeScript definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── htmlBuilder.ts   # Preview HTML bundler
├── App.tsx              # Root component
├── App.css              # App layout styles
├── main.tsx             # Entry point
└── index.css            # Global styles & themes
```

## Component Hierarchy

```
App
├── Header
│   └── ThemeSwitcher
├── SplitPane (3 panels)
│   ├── FileExplorer
│   │   ├── FileItem (per file)
│   │   └── NewFileDialog (modal)
│   ├── Editor Panel
│   │   ├── EditorTabs
│   │   └── Editor (Monaco)
│   └── Preview Panel
│       ├── PreviewToolbar
│       ├── iframe (preview)
│       └── ConsolePanel
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Event Handler                   │
│                  (onClick, onChange, etc.)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Zustand Store Action                     │
│            (createFile, updateFile, setTheme)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────────────┐
│    State Update         │  │    Persist Middleware           │
│    (immutable)          │  │    (localStorage sync)          │
└────────────┬────────────┘  └─────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Re-render                           │
│            (subscribed components only)                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Blob URL for Preview (vs Service Worker)

**Chosen**: Blob URL approach
**Reason**: Simpler implementation, no service worker registration needed, works in all browsers

```typescript
// htmlBuilder.ts creates a complete HTML document
const html = buildPreviewHtml(files, entryFile);
const blob = new Blob([html], { type: 'text/html' });
const url = URL.createObjectURL(blob);
// iframe.src = url
```

### 2. Zustand for State (vs Redux/Context)

**Chosen**: Zustand with persist middleware
**Reason**: Minimal boilerplate, built-in persistence, TypeScript-friendly

```typescript
// Simple selector pattern
const files = useProjectStore((state) => state.project?.files);
```

### 3. Monaco Editor (vs CodeMirror)

**Chosen**: Monaco Editor via @monaco-editor/react
**Reason**: VS Code experience, excellent TypeScript support, CDN loading

### 4. CSS Variables for Theming (vs CSS-in-JS)

**Chosen**: CSS custom properties with data-theme attribute
**Reason**: Zero runtime cost, easy to maintain, native browser support

```css
[data-theme="dark"] {
  --bg-primary: #1e1e1e;
}
```

### 5. File-based ID System

**Chosen**: Use filename as file ID
**Reason**: Simple, human-readable, no UUID collisions to handle

```typescript
const file = project.files['index.html']; // direct access
```

## Performance Considerations

### Debounced Updates

Editor changes are debounced (300ms) to avoid excessive state updates:

```typescript
const debouncedUpdate = useDebouncedCallback((content) => {
  updateFile(activeFile.id, content);
}, 300);
```

### Memoized Selectors

Zustand selectors that derive arrays must use `useMemo`:

```typescript
// BAD: Creates new array every render
const files = useStore(s => Object.values(s.project.files));

// GOOD: Stable reference
const filesRecord = useStore(s => s.project?.files);
const files = useMemo(() =>
  filesRecord ? Object.values(filesRecord) : [],
  [filesRecord]
);
```

### Preview Debounce

Preview rebuilds are debounced (500ms) to avoid iframe thrashing:

```typescript
const debouncedBuild = useDebouncedCallback(() => {
  const html = buildPreviewHtml(files, entryFile);
  setBlobUrl(URL.createObjectURL(new Blob([html])));
}, 500);
```

## Security Model

### Preview Sandbox

The iframe uses strict sandbox attributes:

```html
<iframe sandbox="allow-scripts allow-same-origin" />
```

- `allow-scripts`: Enable JavaScript execution
- `allow-same-origin`: Required for Blob URL to work
- No `allow-forms`, `allow-popups`, etc.

### Error Isolation

Runtime errors in preview don't crash the main app:

```typescript
// Injected into preview HTML
window.onerror = (msg, url, line, col, error) => {
  parent.postMessage({ type: 'error', payload: {...} }, '*');
  return true; // Prevent default error handling
};
```
