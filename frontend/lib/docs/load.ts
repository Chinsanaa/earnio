import fs from 'fs';
import path from 'path';

/** In-app /docs slugs → canonical files under repo docs/ */
const DOC_SOURCES: Record<string, string> = {
  deployment: 'DEPLOYMENT.md',
  'qa-checklist': 'QA_MANUAL_CHECKLIST.md',
};

export function loadDocMarkdown(slug: string): string {
  const filename = DOC_SOURCES[slug];
  if (!filename) {
    throw new Error(`Doc not found: ${slug}`);
  }

  const filePath = path.join(process.cwd(), '..', 'docs', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Doc file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}
