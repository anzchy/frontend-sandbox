import { useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { getFileIcon } from '@/services/fileService';
import '../FileExplorer/file-explorer.css';

export function EditorTabs() {
  const filesRecord = useProjectStore((state) => state.project?.files);
  const activeFileId = useProjectStore((state) => state.project?.activeFileId);
  const setActiveFile = useProjectStore((state) => state.setActiveFile);

  // Memoize files array and sorting to avoid infinite loops
  const sortedFiles = useMemo(() => {
    if (!filesRecord) return [];
    const files = Object.values(filesRecord);
    const order: Record<string, number> = { html: 0, css: 1, javascript: 2, json: 3, text: 4 };
    return [...files].sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5));
  }, [filesRecord]);

  return (
    <div className="editor-tabs">
      {sortedFiles.map((file) => (
        <button
          key={file.id}
          className={`editor-tab ${file.id === activeFileId ? 'editor-tab--active' : ''}`}
          onClick={() => setActiveFile(file.id)}
        >
          <span className="editor-tab__icon">{getFileIcon(file.type)}</span>
          <span className="editor-tab__name">{file.name}</span>
        </button>
      ))}
    </div>
  );
}
