import type { ProjectFile } from '@/types';

/**
 * Build a complete HTML document from project files.
 * Combines HTML, CSS, and JavaScript into a single document.
 */
export function buildHtml(files: Record<string, ProjectFile>): string {
  const fileArray = Object.values(files);

  // Find the main HTML file (index.html or first .html file)
  const htmlFile = fileArray.find((f) => f.name === 'index.html')
    ?? fileArray.find((f) => f.type === 'html');

  // Collect all CSS files
  const cssFiles = fileArray.filter((f) => f.type === 'css');

  // Collect all JavaScript files
  const jsFiles = fileArray.filter((f) => f.type === 'javascript');

  // If no HTML file exists, create a basic one
  let htmlContent = htmlFile?.content ?? getDefaultHtml();

  // Inject CSS into <head>
  if (cssFiles.length > 0) {
    const cssContent = cssFiles.map((f) => f.content).join('\n\n');
    const styleTag = `<style>\n${cssContent}\n</style>`;

    // Insert before </head> if it exists
    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
    } else if (htmlContent.includes('<body')) {
      // Insert before <body> if no </head>
      htmlContent = htmlContent.replace(/<body/i, `${styleTag}\n<body`);
    } else {
      // Prepend if no structure
      htmlContent = `${styleTag}\n${htmlContent}`;
    }
  }

  // Inject error handler before other scripts
  const errorHandler = getErrorHandler();

  // Inject JavaScript before </body>
  if (jsFiles.length > 0 || errorHandler) {
    const jsContent = jsFiles.map((f) => f.content).join('\n\n');
    const scriptTag = `<script>\n${errorHandler}\n${jsContent}\n</script>`;

    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      // Append if no </body>
      htmlContent = `${htmlContent}\n${scriptTag}`;
    }
  }

  return htmlContent;
}

/**
 * Get a default HTML template when no HTML file exists.
 */
function getDefaultHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

/**
 * Get the error handler script that captures runtime errors.
 * This allows errors to be displayed in the console panel.
 */
function getErrorHandler(): string {
  return `
// Error handler injected by Frontend Sandbox
(function() {
  var originalConsoleError = console.error;
  var originalConsoleLog = console.log;
  var originalConsoleWarn = console.warn;

  function sendToParent(type, args) {
    try {
      window.parent.postMessage({
        type: 'console',
        level: type,
        args: Array.from(args).map(function(arg) {
          if (arg instanceof Error) {
            return { type: 'error', message: arg.message, stack: arg.stack };
          }
          try {
            return JSON.parse(JSON.stringify(arg));
          } catch (e) {
            return String(arg);
          }
        }),
        timestamp: Date.now()
      }, '*');
    } catch (e) {}
  }

  console.log = function() {
    sendToParent('log', arguments);
    originalConsoleLog.apply(console, arguments);
  };

  console.error = function() {
    sendToParent('error', arguments);
    originalConsoleError.apply(console, arguments);
  };

  console.warn = function() {
    sendToParent('warn', arguments);
    originalConsoleWarn.apply(console, arguments);
  };

  window.onerror = function(message, source, lineno, colno, error) {
    window.parent.postMessage({
      type: 'error',
      message: message,
      source: source,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : null,
      timestamp: Date.now()
    }, '*');
    return false;
  };

  window.onunhandledrejection = function(event) {
    window.parent.postMessage({
      type: 'error',
      message: 'Unhandled Promise Rejection: ' + (event.reason ? event.reason.message || event.reason : 'Unknown'),
      stack: event.reason ? event.reason.stack : null,
      timestamp: Date.now()
    }, '*');
  };
})();
`;
}

/**
 * Validate HTML structure for common issues.
 */
export function validateHtml(html: string): string[] {
  const warnings: string[] = [];

  if (!html.includes('<!DOCTYPE')) {
    warnings.push('Missing DOCTYPE declaration');
  }

  if (!html.includes('<html')) {
    warnings.push('Missing <html> tag');
  }

  if (!html.includes('<head')) {
    warnings.push('Missing <head> tag');
  }

  if (!html.includes('<body')) {
    warnings.push('Missing <body> tag');
  }

  return warnings;
}
