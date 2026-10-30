/** @jsx h */
/** @jsxFrag Fragment */
/**
 * Froot Framework Official Website & Documentation Hub.
 * Powered directly by @froot/fullstack (Next.js Alternative).
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { h, Fragment } from 'preact';
import { Froot } from 'frootjs';
import { createAppRouter, renderMarkdownFile } from '@froot/fullstack';
import { ALL_DOC_ITEMS, getAdjacentDocs } from './data/docs-nav.js';
import { RootLayout } from './components/RootLayout.js';
import { LandingPage } from './components/LandingPage.js';
import { DocsLayout } from './components/DocsLayout.js';
import { DocsPage } from './components/DocsPage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentDocsDir = path.resolve(__dirname, '../content/docs');

export const app = new Froot();
export const router = createAppRouter(app);

// Enable built-in Tailwind CSS v4 pipeline (watches in dev, serves /styles.css)
await router.enableTailwind({
  input: path.resolve(__dirname, 'styles.css'),
  output: path.resolve(__dirname, '../dist/styles.css'),
});

// 1. Next.js-style Layout for Docs (/docs/*)
// CRITICAL: NO TOP NAVBAR! Navigation is in the left sidebar.
router.layout('/docs', ({ children, currentPath }) => {
  return (
    <RootLayout
      title="Froot Framework Documentation"
      description="Comprehensive documentation and guides for Froot Framework."
    >
      <DocsLayout currentPath={currentPath}>
        {children}
      </DocsLayout>
    </RootLayout>
  );
});

// 2. Landing Page Route (/) with top frosted-glass navbar
router.page('/', () => {
  return (
    <RootLayout
      title="Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework"
      description="Engineered for 120,000+ req/sec, monomorphic inline caching, and multi-runtime execution."
    >
      <LandingPage />
    </RootLayout>
  );
});

// 3. Dynamic Documentation Route (/docs and /docs/:slug)
router.page(
  '/docs/:slug?',
  async ({ params }) => {
    const rawSlug = params['slug'] ? params['slug'].trim() : '';
    const currentDoc =
      ALL_DOC_ITEMS.find((d) => {
        if (!rawSlug || rawSlug === 'overview') {
          return d.id === 'overview' || d.slug === '/docs';
        }
        return d.id === rawSlug || d.slug === `/docs/${rawSlug}`;
      }) ?? ALL_DOC_ITEMS[0];

    if (!currentDoc) {
      throw new Error(`Documentation article not found for slug: ${rawSlug}`);
    }

    // Load Markdown file from disk via @froot/fullstack engine
    const docFile = path.join(contentDocsDir, `${currentDoc.id}.md`);
    const { frontmatter, html } = await renderMarkdownFile(docFile);

    // Resolve adjacent docs for Next.js-style pagination cards
    const { prev, next } = getAdjacentDocs(currentDoc.slug);

    return (
      <DocsPage
        title={frontmatter['title'] || currentDoc.title}
        category={frontmatter['category'] || 'Documentation'}
        summary={frontmatter['summary'] || currentDoc.summary}
        markdownHtml={html}
        prev={prev}
        next={next}
      />
    );
  },
  {
    generateStaticParams: () => {
      return [
        { slug: '' },
        ...ALL_DOC_ITEMS.filter((d) => d.id !== 'overview').map((d) => ({
          slug: d.id,
        })),
      ];
    },
  }
);
