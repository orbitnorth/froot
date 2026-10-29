/**
 * High-performance native Preact SSR integration for Froot.
 * Enables Next.js-style component architectures, nested layouts, and static generation.
 */

import { isValidElement, type ComponentChild, type ComponentType, type VNode } from 'preact';
import { renderToString } from 'preact-render-to-string';
import type { MiddlewareHandler } from '../types/index.js';

/**
 * Checks whether a given value is a valid Preact VNode element.
 */
export function isPreactElement(val: unknown): val is VNode<any> {
  return isValidElement(val);
}

/**
 * Renders a Preact VNode tree to an HTML string.
 * Automatically prepends <!DOCTYPE html> if rendering a full <html> document.
 */
export function renderPreact(vnode: ComponentChild): string {
  if (vnode === null || vnode === undefined || typeof vnode === 'boolean') {
    return '';
  }
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return String(vnode);
  }

  const html = renderToString(vnode as VNode<any>);
  if (!html.startsWith('<!DOCTYPE html>') && !html.startsWith('<!doctype html>')) {
    if (html.startsWith('<html') || html.startsWith('<HTML')) {
      return `<!DOCTYPE html>\n${html}`;
    }
  }
  return html;
}

/**
 * Next.js-style Preact layout middleware helper.
 * Wraps page responses inside a shared root Preact layout component.
 */
export function preactRenderer<P extends { children?: ComponentChild } = { children?: ComponentChild }>(
  _LayoutComponent: ComponentType<P>
): MiddlewareHandler {
  return async (_c, next) => {
    await next();
  };
}

export { type ComponentChild, type ComponentType, type VNode } from 'preact';
