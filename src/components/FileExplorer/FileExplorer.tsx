import { useState, useMemo } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { FileItem } from './FileItem';
import { NewFileDialog } from './NewFileDialog';
import './file-explorer.css';

export function FileExplorer() {
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);

  const filesRecord = useProjectStore((state) => state.project?.files);
  const activeFileId = useProjectStore((state) => state.project?.activeFileId);

  const files = useMemo(() =>
    filesRecord ? Object.values(filesRecord) : [],
    [filesRecord]
  );
  const setActiveFile = useProjectStore((state) => state.setActiveFile);
  const createFile = useProjectStore((state) => state.createFile);
  const renameFile = useProjectStore((state) => state.renameFile);
  const deleteFile = useProjectStore((state) => state.deleteFile);

  const handleFileClick = (fileId: string) => {
    setActiveFile(fileId);
  };

  const handleCreateFile = (name: string) => {
    const result = createFile(name);
    if (result.ok) {
      setActiveFile(result.value.id);
      setIsNewFileDialogOpen(false);
    }
    return result;
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    return renameFile(fileId, newName);
  };

  const handleDeleteFile = (fileId: string) => {
    return deleteFile(fileId);
  };

  // Sort files: HTML first, then CSS, then JS, then others
  const sortedFiles = useMemo(() => {
    const order: Record<string, number> = { html: 0, css: 1, javascript: 2, json: 3, text: 4 };
    return [...files].sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5));
  }, [files]);

  return (
    <div className="file-explorer">
      <div className="file-explorer__header">
        <span className="file-explorer__title">Files</span>
        <button
          className="file-explorer__add-btn"
          onClick={() => setIsNewFileDialogOpen(true)}
          title="New file"
        >
          +
        </button>
      </div>
      <div className="file-explorer__content">
        {sortedFiles.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            isActive={file.id === activeFileId}
            onClick={() => handleFileClick(file.id)}
            onRename={(newName) => handleRenameFile(file.id, newName)}
            onDelete={() => handleDeleteFile(file.id)}
            canDelete={files.length > 1}
          />
        ))}
      </div>

      {isNewFileDialogOpen && (
        <NewFileDialog
          onSubmit={handleCreateFile}
          onClose={() => setIsNewFileDialogOpen(false)}
        />
      )}
    </div>
  );
}
