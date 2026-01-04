import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project, ProjectFile, Result } from '@/types';
import { ok, err } from '@/types';
import { detectFileType, validateFileName } from '@/services/fileService';

// Default project files
const DEFAULT_FILES: Record<string, ProjectFile> = {
  'index.html': {
    id: 'index.html',
    name: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Start editing to see your changes.</p>
  <script src="script.js"></script>
</body>
</html>`,
    type: 'html',
    updatedAt: new Date().toISOString(),
  },
  'styles.css': {
    id: 'styles.css',
    name: 'styles.css',
    content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  padding: 2rem;
  background: #1a1a2e;
  color: #eee;
}

h1 {
  color: #00d9ff;
  margin-bottom: 1rem;
}`,
    type: 'css',
    updatedAt: new Date().toISOString(),
  },
  'script.js': {
    id: 'script.js',
    name: 'script.js',
    content: `console.log('Hello from JavaScript!');`,
    type: 'javascript',
    updatedAt: new Date().toISOString(),
  },
};

function createDefaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'My Project',
    files: { ...DEFAULT_FILES },
    activeFileId: 'index.html',
    entryFile: 'index.html',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

interface ProjectStoreState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
}

interface ProjectStoreActions {
  // Project lifecycle
  loadProject: () => void;
  saveProject: () => void;
  resetProject: () => void;

  // File operations
  createFile: (name: string, content?: string) => Result<ProjectFile, string>;
  updateFile: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => Result<void, string>;
  deleteFile: (id: string) => Result<void, string>;

  // Navigation
  setActiveFile: (id: string) => void;
  setEntryFile: (id: string) => void;

  // Getters
  getFile: (id: string) => ProjectFile | undefined;
  getActiveFile: () => ProjectFile | undefined;
  getAllFiles: () => ProjectFile[];
}

export type ProjectStore = ProjectStoreState & ProjectStoreActions;

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // Initial state
      project: createDefaultProject(),
      isLoading: false,
      error: null,

      // Project lifecycle
      loadProject: () => {
        // Persist middleware handles loading automatically
        const existingProject = get().project;
        if (!existingProject) {
          set({ project: createDefaultProject() });
        }
      },

      saveProject: () => {
        // Persist middleware handles saving automatically
      },

      resetProject: () => {
        set({ project: createDefaultProject(), error: null });
      },

      // File operations
      createFile: (name: string, content = '') => {
        const project = get().project;
        if (!project) return err('No project loaded');

        // Validate filename
        const validation = validateFileName(name);
        if (!validation.ok) return validation;

        // Check for duplicates
        if (project.files[name]) {
          return err(`File "${name}" already exists`);
        }

        const newFile: ProjectFile = {
          id: name,
          name,
          content,
          type: detectFileType(name),
          updatedAt: new Date().toISOString(),
        };

        set({
          project: {
            ...project,
            files: { ...project.files, [name]: newFile },
            updatedAt: new Date().toISOString(),
          },
        });

        return ok(newFile);
      },

      updateFile: (id: string, content: string) => {
        const project = get().project;
        if (!project) return;

        const file = project.files[id];
        if (!file) return;

        set({
          project: {
            ...project,
            files: {
              ...project.files,
              [id]: {
                ...file,
                content,
                updatedAt: new Date().toISOString(),
              },
            },
            updatedAt: new Date().toISOString(),
          },
        });
      },

      renameFile: (id: string, newName: string) => {
        const project = get().project;
        if (!project) return err('No project loaded');

        const file = project.files[id];
        if (!file) return err('File not found');

        // Validate new filename
        const validation = validateFileName(newName);
        if (!validation.ok) return validation;

        // Check for duplicates
        if (newName !== id && project.files[newName]) {
          return err(`File "${newName}" already exists`);
        }

        // Create new files object without old key
        const { [id]: _, ...restFiles } = project.files;

        const renamedFile: ProjectFile = {
          ...file,
          id: newName,
          name: newName,
          type: detectFileType(newName),
          updatedAt: new Date().toISOString(),
        };

        set({
          project: {
            ...project,
            files: { ...restFiles, [newName]: renamedFile },
            activeFileId: project.activeFileId === id ? newName : project.activeFileId,
            entryFile: project.entryFile === id ? newName : project.entryFile,
            updatedAt: new Date().toISOString(),
          },
        });

        return ok(undefined);
      },

      deleteFile: (id: string) => {
        const project = get().project;
        if (!project) return err('No project loaded');

        const fileCount = Object.keys(project.files).length;
        if (fileCount <= 1) {
          return err('Cannot delete the last file');
        }

        if (!project.files[id]) {
          return err('File not found');
        }

        const { [id]: _, ...restFiles } = project.files;
        const remainingFileIds = Object.keys(restFiles);

        // If deleting active file, switch to another
        let newActiveFileId = project.activeFileId;
        if (project.activeFileId === id) {
          newActiveFileId = remainingFileIds[0] ?? '';
        }

        // If deleting entry file, pick a new one
        let newEntryFile = project.entryFile;
        if (project.entryFile === id) {
          newEntryFile = remainingFileIds.find((f) => f.endsWith('.html')) ?? remainingFileIds[0] ?? '';
        }

        set({
          project: {
            ...project,
            files: restFiles,
            activeFileId: newActiveFileId,
            entryFile: newEntryFile,
            updatedAt: new Date().toISOString(),
          },
        });

        return ok(undefined);
      },

      // Navigation
      setActiveFile: (id: string) => {
        const project = get().project;
        if (!project) return;

        if (project.files[id]) {
          set({
            project: {
              ...project,
              activeFileId: id,
            },
          });
        }
      },

      setEntryFile: (id: string) => {
        const project = get().project;
        if (!project) return;

        if (project.files[id]) {
          set({
            project: {
              ...project,
              entryFile: id,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      // Getters
      getFile: (id: string) => {
        return get().project?.files[id];
      },

      getActiveFile: () => {
        const project = get().project;
        if (!project) return undefined;
        return project.files[project.activeFileId];
      },

      getAllFiles: () => {
        const project = get().project;
        if (!project) return [];
        return Object.values(project.files);
      },
    }),
    {
      name: 'frontend-sandbox-project',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ project: state.project }),
    }
  )
);
