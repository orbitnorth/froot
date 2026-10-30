/** @jsxImportSource preact */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdownFile } from '@froot/fullstack';
import { DocsPage } from '../../../components/DocsPage.js';
import { ALL_DOC_ITEMS, getAdjacentDocs } from '../../../data/docs-nav.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDocsDir = path.resolve(__dirname, '../../../../content/docs');

export async function generateStaticParams() {
  // Generate all dynamic docs routes: /docs/quickstart, /docs/fullstack, etc.
  return ALL_DOC_ITEMS
    .filter((item) => item.id !== 'overview')
    .map((item) => ({ slug: item.id }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const slug = params.slug || 'quickstart';
  const item = ALL_DOC_ITEMS.find((d) => d.id === slug);
  const title = item ? `${item.title} — Froot Framework Docs` : 'Froot Framework Documentation';
  return { title };
}

export default async function DocSlugPage({ params }: { params: { slug: string } }) {
  const slug = params.slug || 'quickstart';
  const filePath = path.join(contentDocsDir, `${slug}.md`);
  const { frontmatter, html } = await renderMarkdownFile(filePath);
  const { prev, next } = getAdjacentDocs(slug);

  return (
    <DocsPage
      title={frontmatter['title'] || slug}
      category={frontmatter['category'] || 'Documentation'}
      summary={frontmatter['summary'] || ''}
      markdownHtml={html}
      prev={prev}
      next={next}
    />
  );
}
