# Implementation Plan: Frontend Development Sandbox MVP

**Branch**: `001-init-mvp` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-init-mvp/spec.md`

## Summary

Build a browser-based frontend development sandbox that enables real-time HTML/CSS/JS editing with live preview. Core approach uses Monaco Editor for code editing, Blob URL-based iframe sandboxing for preview isolation (simpler than Service Worker for MVP), and localStorage for persistence. Key deliverables: 3-panel layout (file explorer, editor, preview), multi-file project support, 500ms debounced preview updates, and ZIP export capability.

## Technical Context

**Language/Version**: TypeScript 5.3+, ES2022 target
**Primary Dependencies**: React 18, Monaco Editor, Zustand (state), JSZip (export)
**Storage**: localStorage (browser), no backend required
**Testing**: Vitest + React Testing Library + Playwright (E2E)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
**Project Type**: Single web application (pure frontend SPA)
**Performance Goals**: 500ms preview update latency, <3s initial load, 60fps UI interactions
**Constraints**: <5MB bundle size, offline-capable after initial load, no external API dependencies
**Scale/Scope**: Single user, 5+ files per project, 500 lines per file, 10MB total project limit

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Simplicity | ✅ PASS | Using Blob URL instead of Service Worker for MVP |
| Test-First | ✅ PASS | Vitest + RTL + Playwright planned |
| Library-First | ✅ PASS | Core logic in separate modules (editor, preview, storage) |
| No Premature Optimization | ✅ PASS | Starting with simple approach, optimize if needed |

*Note: Constitution template not yet filled for this project. Above gates are inferred from best practices.*

## Project Structure

### Documentation (this feature)

```text
specs/001-init-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal API contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Editor/
│   │   ├── Editor.tsx           # Monaco editor wrapper
│   │   ├── EditorTabs.tsx       # File tabs component
│   │   └── editor.css
│   ├── Preview/
│   │   ├── Preview.tsx          # Iframe preview with Blob URL
│   │   ├── PreviewToolbar.tsx   # Refresh, URL display
│   │   └── preview.css
│   ├── FileExplorer/
│   │   ├── FileExplorer.tsx     # File tree with CRUD
│   │   ├── FileItem.tsx         # Individual file entry
│   │   └── file-explorer.css
│   └── Layout/
│       ├── SplitPane.tsx        # Resizable panels
│       ├── Header.tsx           # App header with export button
│       └── layout.css
├── stores/
│   ├── projectStore.ts          # Zustand: files, active file
│   └── editorStore.ts           # Zustand: editor state, cursor
├── hooks/
│   ├── useDebounce.ts           # Debounce preview updates
│   ├── useLocalStorage.ts       # Persistence hook
│   └── usePreview.ts            # Preview generation logic
├── services/
│   ├── storageService.ts        # localStorage abstraction
│   ├── exportService.ts         # ZIP generation with JSZip
│   └── fileService.ts           # File validation, MIME types
├── types/
│   └── index.ts                 # TypeScript interfaces
├── utils/
│   ├── fileUtils.ts             # File name validation, icons
│   └── htmlBuilder.ts           # Combine HTML/CSS/JS for preview
├── App.tsx
├── main.tsx
└── index.css

tests/
├── unit/
│   ├── stores/                  # Store logic tests
│   ├── services/                # Service tests
│   └── utils/                   # Utility tests
├── integration/
│   ├── Editor.test.tsx          # Editor component tests
│   ├── Preview.test.tsx         # Preview component tests
│   └── FileExplorer.test.tsx    # File explorer tests
└── e2e/
    ├── basic-workflow.spec.ts   # Create, edit, preview flow
    ├── file-management.spec.ts  # CRUD operations
    └── export.spec.ts           # ZIP export flow
```

**Structure Decision**: Single web application structure chosen because:
1. Pure frontend SPA with no backend requirements (FR-021)
2. All logic runs client-side (localStorage, Blob URL preview)
3. Simple deployment as static files

## Complexity Tracking

No violations detected. All technical choices align with simplicity principle:
- Blob URL over Service Worker (simpler, sufficient for MVP)
- Zustand over Redux (lighter, less boilerplate)
- localStorage over IndexedDB (simpler API, sufficient for 10MB limit)

## Key Technical Decisions

### Preview Mechanism: Blob URL vs Service Worker

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Blob URL | Simple, no registration, instant updates | Cross-file references need manual resolution | ✅ MVP |
| Service Worker | True file system, real URLs | Complex registration, lifecycle management | Future |

**Decision**: Use Blob URL for MVP. The preview component will:
1. Collect all file contents from store
2. Inline CSS via `<style>` tags
3. Inline JS via `<script>` tags
4. Generate combined HTML string
5. Create Blob URL and set as iframe src

### Editor: Monaco vs CodeMirror

| Editor | Pros | Cons | Decision |
|--------|------|------|----------|
| Monaco | VS Code experience, rich API, TypeScript support | Large bundle (~2MB) | ✅ Selected |
| CodeMirror 6 | Lighter, mobile-friendly | Less familiar UX | Alternative |

**Decision**: Monaco Editor provides the best developer experience and matches user expectations from VS Code. Bundle size acceptable for this use case.

### State Management: Zustand vs Redux vs Context

| Solution | Pros | Cons | Decision |
|----------|------|------|----------|
| Zustand | Minimal boilerplate, TypeScript-first | Less ecosystem | ✅ Selected |
| Redux Toolkit | Rich ecosystem, devtools | Verbose for simple state | Rejected |
| React Context | Built-in, no deps | Performance issues, prop drilling | Rejected |

**Decision**: Zustand provides the right balance of simplicity and power for this project's scope.

## Implementation Phases

### Phase 1: Core Editor (P1 User Story)
- Monaco Editor integration
- Single file editing
- Basic preview with Blob URL
- 500ms debounced updates

### Phase 2: Multi-File Support (P2 User Story)
- File explorer component
- File switching
- Cross-file reference resolution in preview
- File type icons

### Phase 3: File Operations (P3 User Story)
- Create new file
- Rename file
- Delete file (with protection for last file)

### Phase 4: Persistence (P4 User Story)
- localStorage save on change
- Load on app start
- Default project template

### Phase 5: Export (P5 User Story)
- JSZip integration
- Download trigger
- File structure preservation

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@monaco-editor/react": "^4.6.0",
    "zustand": "^4.4.0",
    "jszip": "^3.10.0",
    "file-saver": "^2.0.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/file-saver": "^2.0.7",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```
