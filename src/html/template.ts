/**
 * High-performance HTML Tagged Template Engine with automated XSS escaping.
 */

import { escapeHtml, isRawHtml } from '../jsx/escape.js';
import type { RawHtml } from '../jsx/types.js';

export class HtmlEscapedString extends String implements RawHtml {
  readonly __html: string;
  readonly isEscaped = true;

  constructor(html: string) {
    super(html);
    this.__html = html;
  }

  override toString(): string {
    return this.__html;
  }

  override valueOf(): string {
    return this.__html;
  }
}

export type HtmlPrimitive = string | number | boolean | null | undefined | RawHtml;

export type HtmlValue =
  | HtmlPrimitive
  | HtmlEscapedString
  | HtmlValue[]
  | Promise<HtmlPrimitive | HtmlEscapedString | HtmlValue[]>;

/**
 * Resolves a single interpolation value into safe escaped HTML string.
 */
async function resolveValue(val: unknown): Promise<string> {
  if (val === null || val === undefined || typeof val === 'boolean') {
    return '';
  }

  if (val instanceof Promise || (typeof val === 'object' && val !== null && 'then' in (val as any))) {
    const resolved = await val;
    return resolveValue(resolved);
  }

  if (Array.isArray(val)) {
    const parts = await Promise.all(val.map(resolveValue));
    return parts.join('');
  }

  if (isRawHtml(val)) {
    return val.__html;
  }

  return escapeHtml(String(val));
}

/**
 * Tagged template literal for generating safe HTML.
 * Variables interpolated into the template are automatically XSS escaped,
 * unless wrapped in `raw(...)`.
 *
 * @example
 * ```ts
 * const title = 'My App <script>';
 * const body = await html`<h1>${title}</h1><p>${raw('<b>Bold</b>')}</p>`;
 * ```
 */
export async function html(
  strings: TemplateStringsArray,
  ...values: HtmlValue[]
): Promise<HtmlEscapedString> {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i]!;
    if (i < values.length) {
      result += await resolveValue(values[i]);
    }
  }
  return new HtmlEscapedString(result);
}
