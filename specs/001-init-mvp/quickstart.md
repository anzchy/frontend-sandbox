# Quickstart: Frontend Development Sandbox MVP

**Date**: 2026-01-03
**Feature**: 001-init-mvp

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or pnpm 8+
- Modern browser (Chrome, Firefox, Safari, Edge)

## Project Setup

### 1. Initialize Project

```bash
# Create new Vite project with React + TypeScript
npm create vite@latest frontend-sandbox -- --template react-ts

# Navigate to project
cd frontend-sandbox

# Install dependencies
npm install
```

### 2. Install Core Dependencies

```bash
# Monaco Editor (with React wrapper)
npm install @monaco-editor/react

# State management
npm install zustand

# ZIP export
npm install jszip file-saver
npm install -D @types/file-saver
```

### 3. Install Dev Dependencies

```bash
# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D jsdom

# Linting (if not already included)
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Project Structure

Create the following directory structure:

```bash
# Create directories
mkdir -p src/components/{Editor,Preview,FileExplorer,Layout}
mkdir -p src/{stores,hooks,services,types,utils}
mkdir -p tests/{unit,integration,e2e}
```

Expected structure:
```
frontend-sandbox/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   ├── Preview/
│   │   ├── FileExplorer/
│   │   └── Layout/
│   ├── stores/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

### TypeScript Config

```json
// tsconfig.json - ensure these options
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Test Setup

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
```

## Development Workflow

### Start Development Server

```bash
npm run dev
# Opens at http://localhost:5173
```

### Run Tests

```bash
# Unit + Integration tests
npm run test

# Watch mode
npm run test -- --watch

# E2E tests
npx playwright test
```

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Initial Implementation Order

1. **Types first** (`src/types/index.ts`)
   - Define all interfaces from data-model.md

2. **Services** (`src/services/`)
   - `storageService.ts` - localStorage operations
   - `fileService.ts` - file validation
   - `previewService.ts` - HTML generation

3. **Stores** (`src/stores/`)
   - `projectStore.ts` - project state
   - `uiStore.ts` - UI preferences

4. **Components** (in order)
   - `Layout/SplitPane.tsx` - resizable panels
   - `Editor/Editor.tsx` - Monaco wrapper
   - `Preview/Preview.tsx` - iframe preview
   - `FileExplorer/FileExplorer.tsx` - file list

5. **App integration** (`src/App.tsx`)
   - Combine all components

## Key Implementation Notes

### Monaco Editor

```typescript
// Minimal working example
import Editor from '@monaco-editor/react';

function CodeEditor({ value, onChange, language }) {
  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
}
```

### Preview with Blob URL

```typescript
// Minimal working example
function Preview({ html }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Revoke previous URL
    if (blobUrl) URL.revokeObjectURL(blobUrl);

    // Create new URL
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      src={blobUrl || 'about:blank'}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
}
```

### Zustand Store with Persistence

```typescript
// Minimal working example
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectStore {
  files: Record<string, { name: string; content: string }>;
  activeFileId: string;
  updateFile: (id: string, content: string) => void;
}

const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      files: { /* default files */ },
      activeFileId: 'index.html',
      updateFile: (id, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [id]: { ...state.files[id], content },
          },
        })),
    }),
    { name: 'frontend-sandbox:project' }
  )
);
```

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] Monaco Editor loads and displays syntax highlighting
- [ ] Preview iframe renders HTML content
- [ ] File changes persist after page refresh
- [ ] ZIP export downloads correctly
- [ ] All tests pass: `npm run test`

## Troubleshooting

### Monaco Editor Worker Issues

If Monaco shows loading spinner forever:
```typescript
// Add to main.tsx before ReactDOM.render
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker: () => new editorWorker(),
};
```

### localStorage Full

Handle with try-catch:
```typescript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('Storage full. Please export and clear project.');
  }
}
```

### iframe Security Errors

Ensure sandbox attribute is correct:
```html
<iframe sandbox="allow-scripts allow-same-origin" />
```

Do NOT add `allow-top-navigation` or `allow-popups` for security.
