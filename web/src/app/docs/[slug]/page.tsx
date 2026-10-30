/** @jsxImportSource preact */
import { getDoc } from '@froot/fullstack';
import { DocsPage } from '../../../components/DocsPage.js';
import { ALL_DOC_ITEMS, getAdjacentDocs } from '../../../data/docs-nav.js';

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
  const { frontmatter, html, headings } = await getDoc(slug);
  const { prev, next } = getAdjacentDocs(slug);

  return (
    <DocsPage
      title={frontmatter['title'] || slug}
      category={frontmatter['category'] || 'Documentation'}
      summary={frontmatter['summary'] || ''}
      markdownHtml={html}
      headings={headings}
      prev={prev}
      next={next}
    />
  );
}
