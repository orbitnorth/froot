/**
 * High-Speed JSX Server-Side Rendering (SSR) Engine for Froot.
 */

import { escapeHtml, isRawHtml } from './escape.js';
import { FragmentSymbol } from './vnode.js';
import type { Child, JSXNode } from './types.js';

// Void elements that do not have closing tags in HTML5
const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

// Boolean attributes in HTML5
const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected'
]);

/**
 * Converts a camelCase CSS property name to kebab-case.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

/**
 * Serializes a CSS style object into a CSS string.
 */
function serializeStyle(style: Record<string, string | number>): string {
  const parts: string[] = [];
  for (const key in style) {
    const val = style[key];
    if (val !== undefined && val !== null && val !== '') {
      const prop = camelToKebab(key);
      const formattedVal = typeof val === 'number' && val !== 0 && !prop.startsWith('--') && !isUnitlessNumber(prop)
        ? `${val}px`
        : String(val);
      parts.push(`${prop}:${formattedVal}`);
    }
  }
  return parts.join(';');
}

const UNITLESS_PROPERTIES = new Set([
  'animation-iteration-count',
  'border-image-outset',
  'border-image-slice',
  'border-image-width',
  'box-flex',
  'box-flex-group',
  'box-ordinal-group',
  'column-count',
  'columns',
  'flex',
  'flex-grow',
  'flex-positive',
  'flex-shrink',
  'flex-negative',
  'flex-order',
  'grid-row',
  'grid-row-end',
  'grid-row-span',
  'grid-row-start',
  'grid-column',
  'grid-column-end',
  'grid-column-span',
  'grid-column-start',
  'font-weight',
  'line-clamp',
  'line-height',
  'opacity',
  'order',
  'orphans',
  'tab-size',
  'widows',
  'z-index',
  'zoom',
  'fill-opacity',
  'flood-opacity',
  'stop-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width'
]);

function isUnitlessNumber(prop: string): boolean {
  return UNITLESS_PROPERTIES.has(prop);
}

/**
 * Serializes HTML attributes into a string.
 */
function serializeAttributes(props: Record<string, any>): string {
  let attrs = '';

  for (const key in props) {
    if (key === 'children' || key === 'key' || key === 'dangerouslySetInnerHTML') continue;

    const val = props[key];
    if (val === undefined || val === null || val === false) continue;

    // Class normalization
    if (key === 'className' || key === 'class') {
      const classVal = Array.isArray(val) ? val.filter(Boolean).join(' ') : String(val);
      if (classVal) {
        attrs += ` class="${escapeHtml(classVal)}"`;
      }
      continue;
    }

    // Style normalization
    if (key === 'style') {
      const styleVal = typeof val === 'object' ? serializeStyle(val) : String(val);
      if (styleVal) {
        attrs += ` style="${escapeHtml(styleVal)}"`;
      }
      continue;
    }

    // Boolean attributes
    const lowerKey = key.toLowerCase();
    if (BOOLEAN_ATTRIBUTES.has(lowerKey)) {
      if (val === true || val === '' || val === key) {
        attrs += ` ${lowerKey}`;
      }
      continue;
    }

    // Standard string attributes
    attrs += ` ${key}="${escapeHtml(String(val))}"`;
  }

  return attrs;
}

/**
 * Recursively renders a child node into the output HTML buffer.
 */
async function renderChild(child: Child): Promise<string> {
  if (child === null || child === undefined || typeof child === 'boolean') {
    return '';
  }

  if (typeof child === 'string') {
    return escapeHtml(child);
  }

  if (typeof child === 'number') {
    return String(child);
  }

  if (isRawHtml(child)) {
    return child.__html;
  }

  if (child instanceof Promise) {
    const resolved = await child;
    return renderChild(resolved);
  }

  if (Array.isArray(child)) {
    let out = '';
    for (let i = 0; i < child.length; i++) {
      out += await renderChild(child[i]);
    }
    return out;
  }

  if (typeof child === 'object' && 'tag' in child) {
    return renderNode(child as JSXNode);
  }

  return escapeHtml(String(child));
}

/**
 * Renders a single JSXNode into an HTML string.
 */
async function renderNode(node: JSXNode): Promise<string> {
  const { tag, props, children } = node;

  // 1. Fragment
  if (tag === FragmentSymbol) {
    let out = '';
    for (const child of children) {
      out += await renderChild(child);
    }
    return out;
  }

  // 2. Functional Component (sync or async)
  if (typeof tag === 'function') {
    const mergedProps = { ...props };
    if (children.length > 0) {
      mergedProps.children = children.length === 1 ? children[0] : children;
    }

    const componentResult = tag(mergedProps);
    const resolvedResult = componentResult instanceof Promise ? await componentResult : componentResult;

    if (resolvedResult === null || resolvedResult === undefined || typeof resolvedResult === 'boolean') {
      return '';
    }
    if (typeof resolvedResult === 'string') {
      return node.isEscaped ? resolvedResult : escapeHtml(resolvedResult);
    }
    if (isRawHtml(resolvedResult)) {
      return resolvedResult.__html;
    }
    if (typeof resolvedResult === 'object' && 'tag' in (resolvedResult as any)) {
      return renderNode(resolvedResult as JSXNode);
    }
    return renderChild(resolvedResult);
  }

  // 3. Intrinsic HTML Tag
  const tagName = String(tag);
  const attrs = serializeAttributes(props);

  // Void elements: <input />, <img />, <br />
  if (VOID_ELEMENTS.has(tagName)) {
    return `<${tagName}${attrs}>`;
  }

  // Inner HTML bypass
  if (props.dangerouslySetInnerHTML && typeof props.dangerouslySetInnerHTML.__html === 'string') {
    return `<${tagName}${attrs}>${props.dangerouslySetInnerHTML.__html}</${tagName}>`;
  }

  // Render children
  let innerHtml = '';
  for (const child of children) {
    innerHtml += await renderChild(child);
  }

  return `<${tagName}${attrs}>${innerHtml}</${tagName}>`;
}

/**
 * Renders a JSX element tree into a standard HTML string.
 */
export async function renderToString(node: JSXNode | Child): Promise<string> {
  return renderChild(node);
}

/**
 * Renders a JSX element tree into an HTML string prepended with DOCTYPE.
 */
export async function renderToHtml(node: JSXNode | Child): Promise<string> {
  const html = await renderToString(node);
  if (!html.startsWith('<!DOCTYPE html>') && !html.startsWith('<!doctype html>')) {
    return `<!DOCTYPE html>${html}`;
  }
  return html;
}

