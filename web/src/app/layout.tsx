/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  children: ComponentChildren;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export default function RootLayout({ children, metadata }: RootLayoutProps) {
  const title =
    metadata?.title || 'Froot Framework — Ultra-Fast, Monomorphic TypeScript Web Framework';
  const description =
    metadata?.description ||
    'Engineered for 124,000+ req/sec, monomorphic inline caching, and multi-runtime execution.';

  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="theme-color" content="#030712" />
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
        {children}
      </body>
    </html>
  );
}

