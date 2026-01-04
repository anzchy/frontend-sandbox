import { useEffect, useRef, useCallback, useState } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { buildHtml } from '@/utils/htmlBuilder';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { PreviewToolbar } from './PreviewToolbar';
import { ConsolePanel } from './ConsolePanel';
import './preview.css';

interface PreviewProps {
  className?: string;
}

export function Preview({ className }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const files = useProjectStore((state) => state.project?.files ?? {});
  const addPreviewError = useUIStore((state) => state.addPreviewError);
  const addConsoleLog = useUIStore((state) => state.addConsoleLog);
  const clearAll = useUIStore((state) => state.clearAll);
  const consoleExpanded = useUIStore((state) => state.consoleExpanded);

  // Create debounced refresh function
  const refreshPreview = useCallback(() => {
    if (!iframeRef.current) return;

    setIsLoading(true);
    clearAll();

    // Revoke previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // Build HTML from all files
    const html = buildHtml(files);

    // Create new blob URL
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    // Update iframe
    iframeRef.current.src = url;
  }, [files, clearAll]);

  const debouncedRefresh = useDebouncedCallback(refreshPreview, 300);

  // Refresh preview when files change
  useEffect(() => {
    debouncedRefresh();
  }, [files, debouncedRefresh]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        const { level, args, timestamp } = event.data;
        addConsoleLog({
          level,
          message: args.map((arg: unknown) => {
            if (typeof arg === 'object' && arg !== null && 'type' in arg) {
              const typed = arg as { type: string; message?: string };
              if (typed.type === 'error' && typed.message) {
                return typed.message;
              }
            }
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
          }).join(' '),
          timestamp,
        });
      } else if (event.data?.type === 'error') {
        addPreviewError({
          message: event.data.message,
          line: event.data.lineno,
          column: event.data.colno,
          stack: event.data.stack,
          timestamp: event.data.timestamp,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addPreviewError, addConsoleLog]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleManualRefresh = useCallback(() => {
    refreshPreview();
  }, [refreshPreview]);

  return (
    <div className={`preview-container ${className ?? ''}`}>
      <PreviewToolbar
        onRefresh={handleManualRefresh}
        isLoading={isLoading}
        url={blobUrlRef.current}
      />
      <div className={`preview-content ${consoleExpanded ? 'preview-content--with-console' : ''}`}>
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          title="Preview"
          sandbox="allow-scripts allow-modals"
          onLoad={handleIframeLoad}
        />
        {isLoading && (
          <div className="preview-loading">
            <div className="preview-loading__spinner" />
          </div>
        )}
      </div>
      {consoleExpanded && <ConsolePanel />}
    </div>
  );
}
