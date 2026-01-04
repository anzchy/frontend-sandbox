import { FileType, FILE_VALIDATION, Result, ok, err } from '@/types';

/**
 * Validate a filename against project rules.
 */
export function validateFileName(name: string): Result<void, string> {
  if (!name || name.trim().length === 0) {
    return err('Filename cannot be empty');
  }

  if (name.length > FILE_VALIDATION.MAX_FILENAME_LENGTH) {
    return err(`Filename cannot exceed ${FILE_VALIDATION.MAX_FILENAME_LENGTH} characters`);
  }

  if (!FILE_VALIDATION.FILENAME_PATTERN.test(name)) {
    return err('Filename must start with alphanumeric and contain only letters, numbers, dots, hyphens, and underscores');
  }

  const ext = name.split('.').pop()?.toLowerCase() as typeof FILE_VALIDATION.VALID_EXTENSIONS[number] | undefined;
  if (!ext || !FILE_VALIDATION.VALID_EXTENSIONS.includes(ext as typeof FILE_VALIDATION.VALID_EXTENSIONS[number])) {
    return err(`Invalid file extension. Allowed: ${FILE_VALIDATION.VALID_EXTENSIONS.join(', ')}`);
  }

  return ok(undefined);
}

/**
 * Detect file type from filename extension.
 */
export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase();

  const typeMap: Record<string, FileType> = {
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'js': 'javascript',
    'mjs': 'javascript',
    'json': 'json',
    'txt': 'text',
  };

  return typeMap[ext ?? ''] ?? 'text';
}

/**
 * Get Monaco Editor language from file type.
 */
export function getMonacoLanguage(type: FileType): string {
  const languageMap: Record<FileType, string> = {
    'html': 'html',
    'css': 'css',
    'javascript': 'javascript',
    'json': 'json',
    'text': 'plaintext',
  };

  return languageMap[type];
}

/**
 * Get file icon for display.
 */
export function getFileIcon(type: FileType): string {
  const iconMap: Record<FileType, string> = {
    'html': '📄',
    'css': '🎨',
    'javascript': '⚡',
    'json': '📋',
    'text': '📝',
  };

  return iconMap[type];
}

/**
 * Check if file can be deleted (not the last file).
 */
export function canDeleteFile(fileCount: number): boolean {
  return fileCount > 1;
}

/**
 * Generate a unique filename if the name already exists.
 */
export function generateUniqueName(baseName: string, existingNames: string[]): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const dotIndex = baseName.lastIndexOf('.');
  const nameWithoutExt = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;
  const ext = dotIndex > 0 ? baseName.slice(dotIndex) : '';

  let counter = 1;
  let newName = `${nameWithoutExt}-${counter}${ext}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${nameWithoutExt}-${counter}${ext}`;
  }

  return newName;
}

/**
 * Validate file content size.
 */
export function validateFileSize(content: string): Result<void, string> {
  const sizeInBytes = new Blob([content]).size;

  if (sizeInBytes > FILE_VALIDATION.MAX_FILE_SIZE) {
    const sizeMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    return err(`File size (${sizeMB}MB) exceeds maximum of 1MB`);
  }

  return ok(undefined);
}
