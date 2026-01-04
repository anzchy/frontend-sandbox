import { useUIStore } from '@/stores/uiStore';
import './preview.css';

interface PreviewToolbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  url: string | null;
}

export function PreviewToolbar({ onRefresh, isLoading, url }: PreviewToolbarProps) {
  const consoleExpanded = useUIStore((state) => state.consoleExpanded);
  const toggleConsole = useUIStore((state) => state.toggleConsole);
  const errorCount = useUIStore((state) => state.previewErrors.length);

  return (
    <div className="preview-toolbar">
      <div className="preview-toolbar__left">
        <button
          className="preview-toolbar__button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh preview (Ctrl+R)"
        >
          <span className={`preview-toolbar__icon ${isLoading ? 'preview-toolbar__icon--spinning' : ''}`}>
            🔄
          </span>
        </button>
        <div className="preview-toolbar__url">
          {url ? 'blob://preview' : 'No preview'}
        </div>
      </div>
      <div className="preview-toolbar__right">
        <button
          className={`preview-toolbar__button ${consoleExpanded ? 'preview-toolbar__button--active' : ''}`}
          onClick={toggleConsole}
          title="Toggle console"
        >
          <span className="preview-toolbar__icon">🖥️</span>
          {errorCount > 0 && (
            <span className="preview-toolbar__badge preview-toolbar__badge--error">
              {errorCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
