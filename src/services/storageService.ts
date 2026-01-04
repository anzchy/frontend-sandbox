import type { Project, Result } from '@/types';
import { ok, err } from '@/types';

const STORAGE_KEY = 'frontend-sandbox-project';
const STORAGE_VERSION = 1;

interface StoredData {
  version: number;
  project: Project;
  savedAt: string;
}

export const storageService = {
  saveProject(project: Project): Result<void, string> {
    try {
      const data: StoredData = {
        version: STORAGE_VERSION,
        project,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return ok(undefined);
    } catch (error) {
      return err(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  loadProject(): Result<Project | null, string> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return ok(null);
      }

      const data: StoredData = JSON.parse(stored);

      // Version migration could go here
      if (data.version !== STORAGE_VERSION) {
        // For now, just return the project as-is
        // Future: add migration logic
      }

      return ok(data.project);
    } catch (error) {
      return err(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  clearProject(): Result<void, string> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return ok(undefined);
    } catch (error) {
      return err(`Failed to clear project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  hasStoredProject(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};
