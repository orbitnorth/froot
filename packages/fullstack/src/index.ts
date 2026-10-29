/**
 * @froot/fullstack - High-performance Next.js alternative for Froot and Preact.
 */

// Router & Layouts
export {
  createAppRouter,
  AppRouter,
  discoverRoutes,
  formatRouteSegment,
  parseRoutePattern,
  type Metadata,
  type PageProps,
  type LayoutProps,
  type LayoutOptions,
  type PageComponent,
  type LayoutComponent,
  type PageOptions,
  type StaticExportOptions,
  type StaticExportResult,
} from './router/index.js';

// Preact SSR
export {
  renderPreact,
  isPreactElement,
  type ComponentChild,
  type ComponentChildren,
  type ComponentType,
  type VNode,
  type FunctionComponent,
} from './preact/index.js';

// Markdown Engine
export {
  renderMarkdown,
  renderMarkdownFile,
  parseFrontmatter,
  type ParsedMarkdown,
} from './markdown/index.js';

// Preact Components
export {
  Link,
  Markdown,
  type LinkProps,
  type MarkdownProps,
} from './components/index.js';
