/**
 * @module html
 * HTML response and escaping utilities for Froot.
 *
 * @example
 * ```ts
 * import { html, raw, escapeHtml } from 'froot/html';
 * ```
 */

export { html } from '../core/response.js';
export { raw, escapeHtml, isRawHtml } from '../jsx/escape.js';
export type { RawHtml } from '../jsx/types.js';
