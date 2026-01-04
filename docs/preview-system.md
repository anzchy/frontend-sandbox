# Preview System

The preview system renders user code in a sandboxed iframe with console capture and error handling.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Preview Component                        │
├─────────────────────────────────────────────────────────────┤
│  PreviewToolbar                                              │
│  [Refresh] [Clear Console]                    [Toggle Console]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    <iframe>                                  │
│                  (Blob URL)                                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ConsolePanel (collapsible)                                  │
│  > log: Hello World                                          │
│  > error: Uncaught TypeError...                              │
└─────────────────────────────────────────────────────────────┘
```

## HTML Builder

The `htmlBuilder.ts` utility bundles all project files into a single HTML document.

### Process

1. Find the entry HTML file (usually `index.html`)
2. Parse the HTML and identify CSS/JS references
3. Inline CSS into `<style>` tags
4. Inline JS into `<script>` tags
5. Inject error handler and console interceptor
6. Return complete HTML string

### Example Output

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Project</title>

  <!-- Injected error handler -->
  <script>
    (function() {
      window.onerror = function(msg, url, line, col, error) {
        parent.postMessage({
          type: 'preview-error',
          payload: { message: msg, line: line, column: col, stack: error?.stack }
        }, '*');
        return true;
      };

      // Console interception
      ['log', 'warn', 'error', 'info'].forEach(function(level) {
        var original = console[level];
        console[level] = function() {
          var args = Array.prototype.slice.call(arguments);
          parent.postMessage({
            type: 'preview-console',
            payload: { level: level, message: args.map(String).join(' ') }
          }, '*');
          original.apply(console, args);
        };
      });
    })();
  </script>

  <!-- Inlined CSS -->
  <style>
    body { font-family: sans-serif; }
  </style>
</head>
<body>
  <h1>Hello World</h1>

  <!-- Inlined JS -->
  <script>
    console.log('Hello from JavaScript!');
  </script>
</body>
</html>
```

### File Resolution

CSS and JS files are resolved by filename:

```html
<!-- In HTML -->
<link rel="stylesheet" href="styles.css">
<script src="script.js"></script>

<!-- Resolved to -->
project.files['styles.css']
project.files['script.js']
```

## Blob URL Approach

Instead of a service worker, we use Blob URLs for simplicity:

```typescript
// Create Blob from HTML string
const blob = new Blob([html], { type: 'text/html' });

// Generate URL
const url = URL.createObjectURL(blob);

// Set iframe src
iframe.src = url;

// Cleanup when done
URL.revokeObjectURL(url);
```

### Advantages

- No service worker registration needed
- Works immediately, no waiting
- Simple to implement and debug
- Compatible with all browsers

### Limitations

- New URL generated on every update
- Cannot load external resources via relative paths
- All resources must be inlined

## Console Capture

### Message Types

```typescript
// From preview to parent
interface PreviewConsoleMessage {
  type: 'preview-console';
  payload: {
    level: 'log' | 'warn' | 'error' | 'info';
    message: string;
  };
}

interface PreviewErrorMessage {
  type: 'preview-error';
  payload: {
    message: string;
    line: number | null;
    column: number | null;
    stack?: string;
  };
}
```

### Message Listener

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'preview-console') {
      addConsoleLog({
        level: event.data.payload.level,
        message: event.data.payload.message,
        timestamp: Date.now(),
      });
    }
    if (event.data?.type === 'preview-error') {
      addPreviewError({
        ...event.data.payload,
        timestamp: Date.now(),
      });
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## Error Handling

### Compile-time Errors

Syntax errors are caught during HTML building:

```typescript
try {
  const html = buildPreviewHtml(files, entryFile);
  // ...
} catch (error) {
  addPreviewError({
    message: error.message,
    line: null,
    column: null,
    timestamp: Date.now(),
  });
}
```

### Runtime Errors

Runtime errors are caught by the injected `window.onerror`:

```javascript
window.onerror = function(msg, url, line, col, error) {
  parent.postMessage({
    type: 'preview-error',
    payload: {
      message: String(msg),
      line: line,
      column: col,
      stack: error?.stack
    }
  }, '*');
  return true; // Prevent default error handling
};
```

### Unhandled Promise Rejections

```javascript
window.onunhandledrejection = function(event) {
  parent.postMessage({
    type: 'preview-error',
    payload: {
      message: 'Unhandled Promise Rejection: ' + event.reason,
      line: null,
      column: null
    }
  }, '*');
};
```

## Debouncing

Preview updates are debounced to avoid excessive rebuilds:

```typescript
const debouncedBuildPreview = useDebouncedCallback(() => {
  // Cleanup old Blob URL
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }

  // Build new preview
  const html = buildPreviewHtml(files, entryFile);
  const blob = new Blob([html], { type: 'text/html' });
  setBlobUrl(URL.createObjectURL(blob));
}, 500);

// Trigger on file changes
useEffect(() => {
  debouncedBuildPreview();
}, [files, entryFile]);
```

## Sandbox Security

The iframe uses sandbox attributes for security:

```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  src={blobUrl}
/>
```

| Attribute | Allowed | Purpose |
|-----------|---------|---------|
| `allow-scripts` | Yes | JavaScript execution |
| `allow-same-origin` | Yes | Required for Blob URL |
| `allow-forms` | No | Block form submissions |
| `allow-popups` | No | Block window.open |
| `allow-modals` | No | Block alert/confirm |
| `allow-top-navigation` | No | Block parent navigation |

## Console Panel UI

```typescript
interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
}

// Rendering with level-based styling
{consoleLogs.map((log, index) => (
  <div key={index} className={`console-message console-message--${log.level}`}>
    <span className="console-message__level">{log.level}</span>
    <span className="console-message__text">{log.message}</span>
  </div>
))}
```

### Styling by Level

```css
.console-message--log { color: var(--text-primary); }
.console-message--info { color: var(--accent-primary); }
.console-message--warn { color: var(--warning-color); }
.console-message--error { color: var(--error-color); }
```
