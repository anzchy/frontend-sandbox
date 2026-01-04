import { useCallback, useRef, useMemo } from 'react';
import MonacoEditor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import { getMonacoLanguage } from '@/services/fileService';
import './editor.css';

const BASE_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  padding: { top: 12 },
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
  smoothScrolling: true,
  cursorSmoothCaretAnimation: 'on',
};

interface EditorProps {
  className?: string;
}

export function Editor({ className }: EditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const theme = useUIStore((state) => state.theme);

  // Determine Monaco theme based on app theme
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  const editorOptions = useMemo(() => ({
    ...BASE_EDITOR_OPTIONS,
    theme: monacoTheme,
  }), [monacoTheme]);

  const activeFile = useProjectStore((state) => {
    const project = state.project;
    if (!project || !project.activeFileId) return null;
    return project.files[project.activeFileId] ?? null;
  });

  const updateFile = useProjectStore((state) => state.updateFile);

  // Debounced update function to avoid too many state updates
  const debouncedUpdate = useDebouncedCallback((content: string) => {
    if (activeFile) {
      updateFile(activeFile.id, content);
    }
  }, 300);

  const handleEditorMount: OnMount = useCallback((editor) => {
    editorRef.current = editor;
    editor.focus();
  }, []);

  const handleEditorChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      debouncedUpdate(value);
    }
  }, [debouncedUpdate]);

  if (!activeFile) {
    return (
      <div className={`editor-placeholder ${className ?? ''}`}>
        <div className="editor-placeholder__content">
          <span className="editor-placeholder__icon">📝</span>
          <p>Select a file to start editing</p>
        </div>
      </div>
    );
  }

  const language = getMonacoLanguage(activeFile.type);

  return (
    <div className={`editor-container ${className ?? ''}`}>
      <MonacoEditor
        height="100%"
        language={language}
        value={activeFile.content}
        options={editorOptions}
        onMount={handleEditorMount}
        onChange={handleEditorChange}
        loading={
          <div className="editor-loading">
            <div className="editor-loading__spinner" />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
}
