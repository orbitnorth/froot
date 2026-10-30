/** @jsxImportSource preact */
import { getDoc } from 'frootkit';
import { DocsPage } from '../../components/DocsPage.js';
import { getAdjacentDocs } from '../../data/docs-nav.js';

export const metadata = {
  title: 'Overview — Froot Framework Documentation',
  description: 'Introduction to Froot Framework, design principles, and peak V8 architecture.',
};

export default async function DocsOverviewPage() {
  const { frontmatter, html, headings } = await getDoc('overview');
  const { prev, next } = getAdjacentDocs('overview');

  return (
    <DocsPage
      title={frontmatter['title'] || 'Overview'}
      category={frontmatter['category'] || 'Getting Started'}
      summary={frontmatter['summary'] || 'Introduction to Froot Framework, design principles, and peak V8 architecture.'}
      markdownHtml={html}
      headings={headings}
      prev={prev}
      next={next}
    />
  );
}
