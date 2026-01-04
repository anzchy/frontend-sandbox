import type { ProjectFile } from '@/types';

/**
 * Generate preview HTML by combining all project files.
 * Inlines CSS and JS into the HTML entry file.
 */
export function generatePreviewHtml(
  files: Record<string, ProjectFile>,
  entryFile: string
): string {
  const htmlFile = files[entryFile];

  if (!htmlFile || htmlFile.type !== 'html') {
    return createEmptyHtml('No HTML entry file found');
  }

  let html = htmlFile.content;

  // Collect all CSS content
  const cssContent = Object.values(files)
    .filter((f) => f.type === 'css')
    .map((f) => f.content)
    .join('\n');

  // Collect all JS content
  const jsContent = Object.values(files)
    .filter((f) => f.type === 'javascript')
    .map((f) => f.content)
    .join('\n');

  // Inject error handler
  html = injectErrorHandler(html);

  // Inject CSS before </head>
  if (cssContent) {
    const styleTag = `<style>\n${cssContent}\n</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}\n</head>`);
    } else {
      html = `${styleTag}\n${html}`;
    }
  }

  // Inject JS before </body>
  if (jsContent) {
    const scriptTag = `<script>\n${jsContent}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      html = `${html}\n${scriptTag}`;
    }
  }

  return html;
}

/**
 * Create an empty HTML page with a message.
 */
function createEmptyHtml(message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #1e1e1e;
      color: #666;
    }
  </style>
</head>
<body>
  <p>${message}</p>
</body>
</html>`;
}

/**
 * Inject error handling script into HTML.
 * Captures runtime errors and sends them to parent window.
 */
export function injectErrorHandler(html: string): string {
  const errorScript = `<script>
(function() {
  // Capture uncaught errors
  window.onerror = function(msg, url, line, col, error) {
    window.parent.postMessage({
      type: 'PREVIEW_ERROR',
      error: {
        message: String(msg),
        line: line || null,
        column: col || null,
        stack: error ? error.stack : null,
        timestamp: Date.now()
      }
    }, '*');
    return false;
  };

  // Capture unhandled promise rejections
  window.onunhandledrejection = function(event) {
    window.parent.postMessage({
      type: 'PREVIEW_ERROR',
      error: {
        message: 'Unhandled Promise Rejection: ' + String(event.reason),
        line: null,
        column: null,
        timestamp: Date.now()
      }
    }, '*');
  };

  // Capture console messages
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  ['log', 'warn', 'error', 'info'].forEach(function(method) {
    console[method] = function() {
      originalConsole[method].apply(console, arguments);
      window.parent.postMessage({
        type: 'PREVIEW_CONSOLE',
        log: {
          type: method,
          args: Array.from(arguments).map(function(arg) {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
              return String(arg);
            }
          }),
          timestamp: Date.now()
        }
      }, '*');
    };
  });
})();
</script>`;

  // Inject after <head> or at the beginning
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n${errorScript}`);
  } else if (html.includes('<html>')) {
    return html.replace('<html>', `<html>\n<head>${errorScript}</head>`);
  } else {
    return `${errorScript}\n${html}`;
  }
}

/**
 * Create a Blob URL for the preview HTML.
 */
export function createBlobUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

/**
 * Revoke a previously created Blob URL.
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url);
}
