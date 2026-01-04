# Frontend Sandbox

A browser-based code editor and live preview environment for learning and prototyping HTML, CSS, and JavaScript. Inspired by [Scrimba](https://scrimba.com/).

## Features

- **Multi-file Support**: Create, rename, and delete HTML, CSS, JS, JSON, and TXT files
- **Monaco Editor**: VS Code's editor with syntax highlighting, IntelliSense, and bracket matching
- **Live Preview**: Real-time preview updates as you type (500ms debounce)
- **Console Output**: Capture and display `console.log`, `console.warn`, `console.error` from preview
- **Theme Switching**: Dark, Light, and Cream themes
- **Auto-save**: Project automatically persists to localStorage
- **Export as ZIP**: Download your entire project as a ZIP file
- **Resizable Panels**: Drag dividers to resize file explorer, editor, and preview

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Header                              │
│  [Project Name]              [Theme] [Reset] [Export]   │
├──────────┬──────────────────────┬───────────────────────┤
│   File   │       Editor         │       Preview         │
│ Explorer │                      │                       │
│          │   Monaco Editor      │   <iframe>            │
│  - HTML  │   (syntax highlight) │   (sandboxed)         │
│  - CSS   │                      │                       │
│  - JS    │                      │   ┌─────────────────┐ │
│          │                      │   │ Console Panel   │ │
│  [+ New] │                      │   │ logs/errors     │ │
└──────────┴──────────────────────┴───┴─────────────────┴─┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 18 |
| Editor | Monaco Editor (@monaco-editor/react) |
| State Management | Zustand with persist middleware |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | CSS Variables + BEM |
| Export | JSZip + FileSaver |

### Preview Isolation

The preview uses a **Blob URL** approach for security:

1. HTML, CSS, and JS files are bundled into a single HTML document
2. An error handler script is injected to capture runtime errors
3. Console methods are overridden to send logs to parent via `postMessage`
4. The bundled HTML is converted to a Blob URL
5. An iframe loads the Blob URL with sandbox attributes

```
User Code → HTML Builder → Blob URL → Sandboxed iframe
                ↓
         Error Handler Injection
                ↓
         Console Interception
```

### State Management

```
projectStore (Zustand + persist)
├── project: Project
│   ├── files: Record<string, ProjectFile>
│   ├── activeFileId: string
│   └── entryFile: string
└── actions: createFile, updateFile, renameFile, deleteFile

uiStore (Zustand)
├── theme: 'dark' | 'light' | 'cream'
├── consoleExpanded: boolean
└── consoleLogs: ConsoleMessage[]
```

## How to Use

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd frontend-sandbox

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Basic Usage

1. **Edit Files**: Click a file in the sidebar to open it in the editor
2. **Create Files**: Click the `+` button in the file explorer header
3. **Rename Files**: Double-click a file name or right-click → Rename
4. **Delete Files**: Right-click a file → Delete (cannot delete last file)
5. **Switch Themes**: Use the theme switcher in the header (🌙/☀️/🍂)
6. **Export Project**: Click "Export ZIP" to download all files
7. **Reset Project**: Click "Reset" to restore default files

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save (auto-saves, but triggers immediate save) |
| `Cmd/Ctrl + /` | Toggle comment |
| `Cmd/Ctrl + D` | Select next occurrence |
| `F1` | Command palette |

### Supported File Types

| Extension | Language | Icon |
|-----------|----------|------|
| `.html`, `.htm` | HTML | 📄 |
| `.css` | CSS | 🎨 |
| `.js` | JavaScript | ⚡ |
| `.json` | JSON | 📋 |
| `.txt` | Plain Text | 📝 |

## Troubleshooting

### Preview Not Updating

**Symptoms**: Code changes don't reflect in preview

**Solutions**:
1. Check browser console for errors
2. Click the refresh button in preview toolbar
3. Ensure your HTML file links CSS/JS correctly:
   ```html
   <link rel="stylesheet" href="styles.css">
   <script src="script.js"></script>
   ```

### Console Logs Not Appearing

**Symptoms**: `console.log` output not visible in Console Panel

**Solutions**:
1. Expand the Console Panel (click the header)
2. Check that JavaScript file is linked in HTML
3. Clear console and refresh preview

### Editor Not Loading

**Symptoms**: Blank editor area or loading spinner

**Solutions**:
1. Check network connectivity (Monaco loads from CDN)
2. Clear browser cache
3. Disable browser extensions that might block CDN

### Project Not Persisting

**Symptoms**: Changes lost after page refresh

**Solutions**:
1. Check if localStorage is available
2. Ensure not in private/incognito mode
3. Check localStorage quota (10MB limit)
4. Clear site data and try again

### Export ZIP Empty or Corrupt

**Symptoms**: Downloaded ZIP is empty or cannot be opened

**Solutions**:
1. Ensure project has at least one file
2. Check browser console for errors
3. Try a different browser

### Infinite Loop / Page Freeze

**Symptoms**: Browser tab becomes unresponsive

**Causes**: Usually infinite loops in JavaScript code

**Solutions**:
1. Close the tab and reopen
2. The preview sandbox has a 3-second timeout for script errors
3. Check your code for `while(true)` or recursive calls without base case

## Development

```bash
# Run tests
npm run test

# Lint code
npm run lint

# Type check
npm run build
```

## License

MIT
