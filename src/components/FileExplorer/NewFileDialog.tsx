import { useState, useRef, useEffect } from 'react';
import type { ProjectFile, Result } from '@/types';
import './file-explorer.css';

interface NewFileDialogProps {
  onSubmit: (name: string) => Result<ProjectFile, string>;
  onClose: () => void;
}

const FILE_TEMPLATES = [
  { ext: '.html', label: 'HTML', icon: '📄' },
  { ext: '.css', label: 'CSS', icon: '🎨' },
  { ext: '.js', label: 'JavaScript', icon: '⚡' },
  { ext: '.json', label: 'JSON', icon: '📋' },
  { ext: '.txt', label: 'Text', icon: '📝' },
];

export function NewFileDialog({ onSubmit, onClose }: NewFileDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter a filename');
      return;
    }

    const result = onSubmit(name.trim());
    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleTemplateClick = (ext: string) => {
    const baseName = name.split('.')[0] || 'newfile';
    setName(baseName + ext);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="dialog__header">
          <h3 className="dialog__title">New File</h3>
          <button className="dialog__close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog__content">
            <div className="dialog__field">
              <label className="dialog__label">Filename</label>
              <input
                ref={inputRef}
                type="text"
                className="dialog__input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., script.js"
              />
              {error && <div className="dialog__error">{error}</div>}
            </div>

            <div className="dialog__field">
              <label className="dialog__label">Quick templates</label>
              <div className="dialog__templates">
                {FILE_TEMPLATES.map((template) => (
                  <button
                    key={template.ext}
                    type="button"
                    className="dialog__template-btn"
                    onClick={() => handleTemplateClick(template.ext)}
                  >
                    <span>{template.icon}</span>
                    <span>{template.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dialog__footer">
            <button type="button" className="dialog__btn dialog__btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dialog__btn dialog__btn--primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
