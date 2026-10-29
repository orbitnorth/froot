/** @jsxImportSource preact */
/**
 * Next.js-style Document Article Page Component.
 */
import type { DocItem } from '../data/docs-nav.js';
export interface DocsPageProps {
    title: string;
    category: string;
    summary: string;
    markdownHtml: string;
    prev?: DocItem | undefined;
    next?: DocItem | undefined;
}
export declare function DocsPage({ title, category, summary, markdownHtml, prev, next, }: DocsPageProps): import("preact").JSX.Element;
//# sourceMappingURL=DocsPage.d.ts.map