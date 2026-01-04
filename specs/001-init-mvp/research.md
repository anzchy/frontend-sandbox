# Research: Frontend Development Sandbox MVP

**Date**: 2026-01-03
**Feature**: 001-init-mvp
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing the frontend development sandbox. All "NEEDS CLARIFICATION" items from the Technical Context have been resolved.

---

## 1. Preview Mechanism

### Research Question
How to implement real-time code preview with proper isolation?

### Findings

#### Option A: Blob URL (Selected for MVP)
```typescript
const blob = new Blob([htmlContent], { type: 'text/html' });
const url = URL.createObjectURL(blob);
iframe.src = url;
```

**Pros**:
- Simple implementation, no Service Worker registration
- Instant updates, no caching issues
- Works in all modern browsers
- No CORS complications

**Cons**:
- Must inline all CSS/JS into single HTML
- Relative paths don't work naturally
- Memory cleanup required (revokeObjectURL)

#### Option B: Service Worker (Future Enhancement)
```typescript
// Intercept requests to /virtual/* and return from virtual file system
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/virtual/')) {
    event.respondWith(getFromVirtualFS(event.request));
  }
});
```

**Pros**:
- True file system simulation
- Relative paths work naturally
- Better for complex multi-file projects

**Cons**:
- Complex lifecycle management
- Registration delay on first load
- Harder to debug

### Decision
**Blob URL** for MVP. The added complexity of Service Worker is not justified for the initial scope. Can migrate to Service Worker in future if relative path resolution becomes a pain point.

### Implementation Notes
- Revoke previous Blob URL before creating new one to prevent memory leaks
- Use 500ms debounce to avoid excessive URL creation
- Handle `<link>` and `<script>` tags by inlining their content

---

## 2. Monaco Editor Integration

### Research Question
Best approach to integrate Monaco Editor with React?

### Findings

#### Option A: @monaco-editor/react (Selected)
Official React wrapper that handles loading and configuration.

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  language="html"
  theme="vs-dark"
  value={code}
  onChange={handleChange}
/>
```

**Pros**:
- Handles lazy loading automatically
- TypeScript types included
- Active maintenance
- Simple API

**Cons**:
- Additional dependency
- Less control over loading

#### Option B: Direct monaco-editor
```typescript
import * as monaco from 'monaco-editor';
const editor = monaco.editor.create(container, { ... });
```

**Pros**:
- Full control
- Smaller bundle if tree-shaking works

**Cons**:
- Manual webpack/vite configuration required
- Must handle Web Workers setup manually

### Decision
**@monaco-editor/react** wrapper for simplicity. The loading and configuration complexity is not worth the marginal bundle size savings.

### Configuration
```typescript
const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  wordWrap: 'on',
  automaticLayout: true,
  tabSize: 2,
  scrollBeyondLastLine: false,
};
```

---

## 3. State Management

### Research Question
How to manage application state (files, editor state, preview)?

### Findings

#### Option A: Zustand (Selected)
```typescript
import { create } from 'zustand';

interface ProjectStore {
  files: Map<string, FileContent>;
  activeFile: string;
  setActiveFile: (name: string) => void;
  updateFile: (name: string, content: string) => void;
}

const useProjectStore = create<ProjectStore>((set) => ({
  files: new Map(),
  activeFile: 'index.html',
  setActiveFile: (name) => set({ activeFile: name }),
  updateFile: (name, content) => set((state) => {
    const newFiles = new Map(state.files);
    newFiles.set(name, { ...newFiles.get(name), content });
    return { files: newFiles };
  }),
}));
```

**Pros**:
- Minimal boilerplate
- TypeScript-first design
- No providers needed
- Built-in middleware for persistence

**Cons**:
- Smaller ecosystem than Redux

#### Option B: Redux Toolkit
More structure but verbose for this project's scope.

#### Option C: React Context + useReducer
Built-in but performance issues with frequent updates.

### Decision
**Zustand** for its simplicity and TypeScript integration. The `persist` middleware handles localStorage automatically.

---

## 4. File Storage Format

### Research Question
How to structure project data in localStorage?

### Findings

#### Storage Schema
```typescript
interface StoredProject {
  version: 1;
  name: string;
  files: StoredFile[];
  activeFile: string;
  lastModified: number;
}

interface StoredFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'javascript' | 'json' | 'text';
}
```

#### Storage Key
```
frontend-sandbox:project
```

#### Size Considerations
- localStorage limit: ~5-10MB (browser dependent)
- Target max project size: 10MB (from spec)
- Single project for MVP (multi-project deferred)

### Decision
Use Zustand's `persist` middleware with custom storage adapter for JSON serialization. Include version field for future migrations.

---

## 5. ZIP Export

### Research Question
How to generate downloadable ZIP files client-side?

### Findings

#### Library: JSZip
```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function exportProject(files: Map<string, string>) {
  const zip = new JSZip();

  files.forEach((content, name) => {
    zip.file(name, content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'project.zip');
}
```

**Pros**:
- Well-maintained library
- Works in all browsers
- Streaming support for large files

### Decision
**JSZip + file-saver** combination. Simple, reliable, no alternatives needed.

---

## 6. Infinite Loop Detection

### Research Question
How to protect against user code causing infinite loops?

### Findings

#### Option A: Timeout-based Termination (Selected)
Use iframe's ability to be terminated via src change or removal.

```typescript
const EXECUTION_TIMEOUT = 3000; // 3 seconds

function runPreview() {
  const timeoutId = setTimeout(() => {
    iframe.src = 'about:blank';
    showError('Execution timeout: possible infinite loop');
  }, EXECUTION_TIMEOUT);

  iframe.onload = () => clearTimeout(timeoutId);
  iframe.src = blobUrl;
}
```

#### Option B: Code Instrumentation
Transform user code to add loop counters. Complex and fragile.

### Decision
**Timeout-based termination** for MVP. If the page doesn't finish loading in 3 seconds, assume infinite loop and terminate. Good enough for most cases.

---

## 7. Error Handling in Preview

### Research Question
How to capture and display JavaScript errors from user code?

### Findings

#### Approach: postMessage from iframe
```typescript
// Inject into preview HTML
const errorHandler = `
  <script>
    window.onerror = function(msg, url, line, col, error) {
      parent.postMessage({
        type: 'PREVIEW_ERROR',
        error: { message: msg, line: line, column: col }
      }, '*');
      return true;
    };
  </script>
`;
```

Main window listens:
```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'PREVIEW_ERROR') {
    displayError(event.data.error);
  }
});
```

### Decision
Inject error handler script into every preview. Display errors in a collapsible console panel below preview.

---

## 8. Default Project Template

### Research Question
What should the initial project contain?

### Decision
Three starter files:

**index.html**:
```html
<!DOCTYPE html>
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
</html>
```

**styles.css**:
```css
* {
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
}
```

**script.js**:
```javascript
console.log('Hello from JavaScript!');
```

---

## Summary

All technical unknowns have been resolved. Key decisions:

| Area | Choice | Rationale |
|------|--------|-----------|
| Preview | Blob URL | Simpler than Service Worker for MVP |
| Editor | @monaco-editor/react | Best DX, handles complexity |
| State | Zustand | Minimal boilerplate, persist middleware |
| Export | JSZip + file-saver | Industry standard |
| Loop Protection | 3s timeout | Simple, effective |
| Error Capture | postMessage | Clean iframe communication |

Ready to proceed to Phase 1: Data Model & Contracts.
