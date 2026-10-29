/**
 * Zero-dependency HTML Template File Engine for Froot.
 * Keeps TypeScript files 100% free of embedded HTML markup.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const templateCache = new Map<string, string>();

export interface ViewOptions {
  cache?: boolean;
}

/**
 * Loads a .html template from disk and interpolates variables (e.g. {{title}}, {{content}}).
 * This ensures TypeScript files contain only pure logic and no embedded HTML strings.
 */
export async function renderFile(
  filePath: string,
  data: Record<string, string | number | boolean | null | undefined> = {},
  options: ViewOptions = {}
): Promise<string> {
  const resolved = path.resolve(filePath);
  const useCache = options.cache ?? process.env.NODE_ENV === 'production';

  let template = useCache ? templateCache.get(resolved) : undefined;
  if (!template) {
    template = await fs.readFile(resolved, 'utf8');
    if (useCache) {
      templateCache.set(resolved, template);
    }
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

/** Clears in-memory template cache (useful during development/testing) */
export function clearTemplateCache(): void {
  templateCache.clear();
}

