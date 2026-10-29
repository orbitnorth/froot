/**
 * Froot Framework Official Website & Next.js-Style Documentation Hub.
 * Zero HTML inside TypeScript files: Pure logic and component template composition.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot, createAppRouter, renderFile, renderMarkdownFile } from '../../dist/index.js';
import { DOCS_NAV, ALL_DOC_ITEMS, getAdjacentDocs } from './data/docs-nav.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, '../templates');
const componentsDir = path.resolve(templatesDir, 'components');
const contentDocsDir = path.resolve(__dirname, '../content/docs');

export const app = new Froot();
export const router = createAppRouter(app);

// 1. Landing Page Route
router.page('/', async () => {
  return renderFile(path.join(templatesDir, 'landing.html'));
});

// 2. Next.js-Style Dynamic Documentation Route (/docs and /docs/:slug)
router.page(
  '/docs/:slug?',
  async ({ params }) => {
    const rawSlug = params['slug'] ? params['slug'].trim() : '';
    const currentDoc = ALL_DOC_ITEMS.find((d) => {
      if (!rawSlug || rawSlug === 'overview') {
        return d.id === 'overview' || d.slug === '/docs';
      }
      return d.id === rawSlug || d.slug === `/docs/${rawSlug}`;
    }) ?? ALL_DOC_ITEMS[0];

    if (!currentDoc) {
      throw new Error(`Documentation article not found for slug: ${rawSlug}`);
    }

    // Markdown file on disk
    const docFile = path.join(contentDocsDir, `${currentDoc.id}.md`);
    const { frontmatter, html } = await renderMarkdownFile(docFile);

    // Render Sidebar Navigation by category and items using HTML component templates
    const sidebarCategoryBlocks = await Promise.all(
      DOCS_NAV.map(async (cat) => {
        const itemRows = await Promise.all(
          cat.items.map(async (item) => {
            const isActive = item.id === currentDoc.id;
            const activeClass = isActive
              ? 'bg-emerald-500/10 text-emerald-400 font-semibold border-l-2 border-emerald-400 pl-2.5'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60';

            return renderFile(path.join(componentsDir, 'nav-item.html'), {
              href: item.slug,
              search_title: item.title.toLowerCase(),
              title: item.title,
              badge: '',
              active_class: activeClass,
            });
          })
        );

        return renderFile(path.join(componentsDir, 'nav-category.html'), {
          category_title: cat.title,
          items: itemRows.join('\n'),
        });
      })
    );

    // Render Previous / Next Pagination Cards using HTML component templates
    const { prev, next } = getAdjacentDocs(currentDoc.slug);
    let prevCard = '';
    let nextCard = '';

    if (prev) {
      prevCard = await renderFile(path.join(componentsDir, 'pagination-prev.html'), {
        href: prev.slug,
        title: prev.title,
      });
    }

    if (next) {
      nextCard = await renderFile(path.join(componentsDir, 'pagination-next.html'), {
        href: next.slug,
        title: next.title,
      });
    }

    let paginationHtml = '';
    if (prevCard || nextCard) {
      paginationHtml = await renderFile(path.join(componentsDir, 'pagination-container.html'), {
        prev_card: prevCard,
        next_card: nextCard,
      });
    }

    // Render Master Docs Template (NO top navbar, sidebar on left)
    return renderFile(path.join(templatesDir, 'docs.html'), {
      doc_title: frontmatter['title'] || currentDoc.title,
      doc_category: frontmatter['category'] || 'Documentation',
      doc_summary: frontmatter['summary'] || currentDoc.summary,
      doc_content: html,
      sidebar_links: sidebarCategoryBlocks.join('\n'),
      pagination: paginationHtml,
    });
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
