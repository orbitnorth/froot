/** @jsxImportSource preact */
/**
 * Next.js-style Documentation Layout Component.
 * Critical Requirement: NO TOP NAVBAR!
 * Navigation is entirely handled by the left sidebar.
 */
import type { ComponentChildren } from 'preact';
export interface DocsLayoutProps {
    currentSlug: string;
    children: ComponentChildren;
}
export declare function DocsLayout({ currentSlug, children }: DocsLayoutProps): import("preact").JSX.Element;
//# sourceMappingURL=DocsLayout.d.ts.map