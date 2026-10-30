/** @jsxImportSource preact */
/**
 * Next.js-style Root HTML Shell Layout for Froot Website.
 */

import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  title?: string;
  description?: string;
  children: ComponentChildren;
}

export function RootLayout({
  title = 'Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework',
  description = 'Next-generation TypeScript web framework engineered for peak V8 performance, monomorphic inline caching, and multi-runtime execution across Node.js, Bun, Deno, and Edge.',
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#090d16" />

        {/* OpenGraph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />

        {/* Preconnect Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Real Tailwind CSS v4 Stylesheet */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-[#030712] text-slate-100 font-sans antialiased selection:bg-emerald-500/25 selection:text-emerald-200 min-h-screen">
        {children}
      </body>
    </html>
  );
}

