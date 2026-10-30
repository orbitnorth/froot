/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { DocsLayout } from '../../components/DocsLayout.js';

// Next.js layout isolation: Prevents root navbar from leaking into documentation
export const isolate = true;

export interface DocsAppLayoutProps {
  currentPath?: string | undefined;
  children: ComponentChildren;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export default function DocsRootLayout({ currentPath, children, metadata }: DocsAppLayoutProps) {
  const title = metadata?.title || 'Froot Framework Documentation';
  const description =
    metadata?.description || 'Comprehensive documentation and guides for Froot Framework.';

  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#070b13" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-[#030712] text-slate-100 font-sans antialiased selection:bg-emerald-500/25 selection:text-emerald-200 min-h-screen">
        <DocsLayout currentPath={currentPath}>{children}</DocsLayout>
      </body>
    </html>
  );
}
