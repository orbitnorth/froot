/**
 * High-performance HTML escaping & raw markup utilities.
 */

import type { RawHtml } from './types.js';

const ESCAPE_REGEX = /[&<>"']/g;

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapes unsafe HTML characters in user-provided strings.
 */
export function escapeHtml(str: string): string {
  return str.replace(ESCAPE_REGEX, (match) => ESCAPE_MAP[match] || match);
}

/**
 * Marks a string as trusted raw HTML that should bypass escaping.
 */
export function raw(html: string): RawHtml {
  return {
    __html: html,
    isEscaped: true
  };
}

/**
 * Checks whether an object is trusted raw HTML.
 */
export function isRawHtml(value: unknown): value is RawHtml {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as RawHtml).isEscaped === true &&
    typeof (value as RawHtml).__html === 'string'
  );
}

