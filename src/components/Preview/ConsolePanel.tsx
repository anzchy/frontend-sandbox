import { useUIStore } from '@/stores/uiStore';
import type { ConsoleMessage, PreviewError } from '@/types';
import './preview.css';

export function ConsolePanel() {
  const logs = useUIStore((state) => state.consoleLogs);
  const errors = useUIStore((state) => state.previewErrors);
  const clearAll = useUIStore((state) => state.clearAll);

  const allMessages = [
    ...logs.map((log: ConsoleMessage) => ({
      type: 'log' as const,
      level: log.level,
      message: log.message,
      timestamp: log.timestamp,
    })),
    ...errors.map((error: PreviewError) => ({
      type: 'error' as const,
      level: 'error' as const,
      message: error.message,
      timestamp: error.timestamp,
      line: error.line,
      column: error.column,
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="console-panel">
      <div className="console-panel__header">
        <span className="console-panel__title">Console</span>
        <button
          className="console-panel__clear"
          onClick={clearAll}
          title="Clear console"
        >
          🗑️ Clear
        </button>
      </div>
      <div className="console-panel__content">
        {allMessages.length === 0 ? (
          <div className="console-panel__empty">No console output</div>
        ) : (
          allMessages.map((msg, index) => (
            <div
              key={index}
              className={`console-panel__message console-panel__message--${msg.level}`}
            >
              <span className="console-panel__level">
                {msg.level === 'error' ? '❌' : msg.level === 'warn' ? '⚠️' : 'ℹ️'}
              </span>
              <span className="console-panel__text">{msg.message}</span>
              {'line' in msg && msg.line && (
                <span className="console-panel__location">
                  Line {msg.line}{msg.column ? `:${msg.column}` : ''}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
