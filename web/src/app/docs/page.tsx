/** @jsxImportSource preact */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdownFile } from '@froot/fullstack';
import { DocsPage } from '../../components/DocsPage.js';
import { getAdjacentDocs } from '../../data/docs-nav.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDocsDir = path.resolve(__dirname, '../../../content/docs');

export const metadata = {
  title: 'Overview — Froot Framework Documentation',
  description: 'Introduction to Froot Framework, design principles, and peak V8 architecture.',
};

export default async function DocsOverviewPage() {
  const filePath = path.join(contentDocsDir, 'overview.md');
  const { frontmatter, html } = await renderMarkdownFile(filePath);
  const { prev, next } = getAdjacentDocs('overview');

  return (
    <DocsPage
      title={frontmatter['title'] || 'Overview'}
      category={frontmatter['category'] || 'Getting Started'}
      summary={frontmatter['summary'] || 'Introduction to Froot Framework, design principles, and peak V8 architecture.'}
      markdownHtml={html}
      prev={prev}
      next={next}
    />
  );
}
