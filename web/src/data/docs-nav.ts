/**
 * Documentation Navigation Tree and Metadata
 */

export interface DocItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
}

export interface DocCategory {
  title: string;
  items: DocItem[];
}

export const DOCS_NAV: DocCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        id: 'overview',
        slug: '/docs',
        title: 'Overview',
        summary: 'Introduction to Froot Framework, design principles, and peak V8 architecture.',
      },
      {
        id: 'quickstart',
        slug: '/docs/quickstart',
        title: 'Quickstart & CLI',
        summary: 'Create your first Froot project in seconds with create-frootjs.',
      },
      {
        id: 'templates',
        slug: '/docs/templates',
        title: 'Architecture Templates',
        summary: 'Detailed guide to MVC, Modular, Streaming, WebSocket, OpenAPI, and Minimal layouts.',
      },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      {
        id: 'router',
        slug: '/docs/router',
        title: 'Tri-Tier Router',
        summary: 'Zero-allocation routing with O(1) hash map, Radix tree, and compiled RegExp dispatch.',
      },
      {
        id: 'context',
        slug: '/docs/context',
        title: 'Context & Request',
        summary: 'Object pooling, param/query extraction, JSON parsing, and response constructors.',
      },
      {
        id: 'middleware',
        slug: '/docs/middleware',
        title: 'Middleware Pipeline',
        summary: 'Onion execution, CORS, Logger, Timing, Security headers, and Rate limiting.',
      },
    ],
  },
  {
    title: 'Production Batteries',
    items: [
      {
        id: 'streaming',
        slug: '/docs/streaming',
        title: 'Real-Time & SSE',
        summary: 'Server-Sent Events, streamSSE, and token-by-token LLM streaming with streamText.',
      },
      {
        id: 'websocket',
        slug: '/docs/websocket',
        title: 'WebSockets & Hubs',
        summary: 'Cross-runtime WebSocket upgrades, peer tracking, and pub/sub room hub.',
      },
      {
        id: 'openapi',
        slug: '/docs/openapi',
        title: 'OpenAPI 3.1 & Docs',
        summary: 'Automatic schema extraction, Standard Schema validation, and interactive Scalar UI.',
      },
      {
        id: 'jsx',
        slug: '/docs/jsx',
        title: 'Server JSX & HTML',
        summary: 'Zero-dependency native JSX engine, server component rendering, and HTML responses.',
      },
    ],
  },
  {
    title: 'Ecosystem & AI',
    items: [
      {
        id: 'database',
        slug: '/docs/database',
        title: 'Database & ORM',
        summary: 'Integrating Drizzle ORM (SQLite/better-sqlite3) and Prisma in Froot applications.',
      },
      {
        id: 'ai-agents',
        slug: '/docs/ai-agents',
        title: 'AI Agents & Schema',
        summary: 'Machine-readable CLI schema, AGENT.md generation, and llms.txt integration.',
      },
      {
        id: 'testing',
        slug: '/docs/testing',
        title: 'In-Memory Testing',
        summary: 'Zero-port unit testing with Vitest and Node:test using app.fetch(Request).',
      },
    ],
  },
];

/** Flatten all doc items into ordered array for prev/next pagination */
export const ALL_DOC_ITEMS: DocItem[] = DOCS_NAV.flatMap((cat) => cat.items);

export function getDocBySlug(slug: string): DocItem | undefined {
  return ALL_DOC_ITEMS.find((d) => d.slug === slug);
}

export function getAdjacentDocs(currentSlug: string): { prev?: DocItem; next?: DocItem } {
  const index = ALL_DOC_ITEMS.findIndex((d) => d.slug === currentSlug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? ALL_DOC_ITEMS[index - 1] : undefined,
    next: index < ALL_DOC_ITEMS.length - 1 ? ALL_DOC_ITEMS[index + 1] : undefined,
  };
}

