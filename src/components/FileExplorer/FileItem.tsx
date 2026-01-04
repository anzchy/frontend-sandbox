import { useState, useRef, useEffect } from 'react';
import type { ProjectFile, Result } from '@/types';
import { getFileIcon } from '@/services/fileService';
import './file-explorer.css';

interface FileItemProps {
  file: ProjectFile;
  isActive: boolean;
  onClick: () => void;
  onRename: (newName: string) => Result<void, string>;
  onDelete: () => Result<void, string>;
  canDelete: boolean;
}

export function FileItem({
  file,
  isActive,
  onClick,
  onRename,
  onDelete,
  canDelete,
}: FileItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleStartRename = () => {
    setEditName(file.name);
    setIsEditing(true);
    setShowContextMenu(false);
    setError(null);
  };

  const handleRename = () => {
    if (editName === file.name) {
      setIsEditing(false);
      return;
    }

    const result = onRename(editName);
    if (result.ok) {
      setIsEditing(false);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(file.name);
      setError(null);
    }
  };

  const handleDelete = () => {
    setShowContextMenu(false);
    if (window.confirm(`Delete "${file.name}"?`)) {
      const result = onDelete();
      if (!result.ok) {
        setError(result.error);
      }
    }
  };

  return (
    <>
      <div
        className={`file-item ${isActive ? 'file-item--active' : ''}`}
        onClick={!isEditing ? onClick : undefined}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleStartRename}
      >
        <span className="file-item__icon">{getFileIcon(file.type)}</span>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="file-item__input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="file-item__name">{file.name}</span>
        )}
      </div>

      {error && (
        <div className="file-item__error">{error}</div>
      )}

      {showContextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="context-menu__item" onClick={handleStartRename}>
            ✏️ Rename
          </button>
          {canDelete && (
            <button className="context-menu__item context-menu__item--danger" onClick={handleDelete}>
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </>
  );
}
