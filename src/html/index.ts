/**
 * @module html
 * HTML template literal, escaping utilities, and SSG engine for Froot.
 *
 * @example
 * ```ts
 * import { html, raw, escapeHtml, exportStatic } from 'frootjs/html';
 * ```
 */

export { html, type HtmlEscapedString, type HtmlValue } from './template.js';
export { raw, escapeHtml, isRawHtml } from '../jsx/escape.js';
export { exportStatic, type StaticExportOptions, type StaticExportResult } from './ssg.js';
export { renderFile, clearTemplateCache, type ViewOptions } from './view.js';
export type { RawHtml } from '../jsx/types.js';
