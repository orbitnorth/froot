/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { DocsLayout } from '../../components/DocsLayout.js';

export interface DocsAppLayoutProps {
  currentPath?: string | undefined;
  children: ComponentChildren;
}

export default function DocsNestedLayout({ currentPath, children }: DocsAppLayoutProps) {
  // Nested layout inside RootLayout - pure UI embedding without duplicate <html><head><body>
  return <DocsLayout currentPath={currentPath}>{children}</DocsLayout>;
}
