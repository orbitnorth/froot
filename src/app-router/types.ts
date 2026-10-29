/**
 * Next.js-inspired App Router Type Definitions for Froot
 */

import type { Child, JSXNode } from '../jsx/types.js';
import type { Context } from '../types/index.js';

export interface Metadata {
  title?: string;
  description?: string;
  themeColor?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonical?: string;
  extraMeta?: Record<string, string>;
}

export interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
  c: Context<any, any>;
}

export interface LayoutProps {
  children: Child;
  params: Record<string, string>;
  currentPath: string;
  metadata?: Metadata | undefined;
}

export type PageComponent = (props: PageProps) => JSXNode | Promise<JSXNode> | Child | Promise<Child>;

export type LayoutComponent = (props: LayoutProps) => JSXNode | Promise<JSXNode> | Child | Promise<Child>;

export interface PageOptions {
  metadata?: Metadata | ((props: PageProps) => Metadata | Promise<Metadata>);
  generateStaticParams?: () => Promise<Array<Record<string, string>>> | Array<Record<string, string>>;
}

export interface StaticExportOptions {
  outDir: string;
  copyAssets?: Array<{ from: string; to?: string }>;
}

export interface StaticExportResult {
  outDir: string;
  renderedRoutes: string[];
  filesWritten: string[];
  durationMs: number;
}
