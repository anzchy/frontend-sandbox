import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Project, Result } from '@/types';
import { ok, err } from '@/types';

export const exportService = {
  async exportAsZip(project: Project): Promise<Result<void, string>> {
    try {
      const zip = new JSZip();

      // Add all project files to the ZIP
      for (const file of Object.values(project.files)) {
        zip.file(file.name, file.content);
      }

      // Generate the ZIP blob
      const blob = await zip.generateAsync({ type: 'blob' });

      // Create sanitized filename
      const projectName = project.name
        .replace(/[^a-zA-Z0-9-_\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();

      const filename = `${projectName || 'project'}.zip`;

      // Download the file
      saveAs(blob, filename);

      return ok(undefined);
    } catch (error) {
      return err(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
