/**
 * Froot Framework - Native Zero-Dependency JSX & SSR Engine.
 */

export { jsx, jsxs, jsxDEV, Fragment, h, FragmentSymbol } from './vnode.js';
export { escapeHtml, raw, isRawHtml } from './escape.js';
export { renderToString, renderToHtml } from './render.js';
export { jsxRenderer, type LayoutComponent } from './renderer.js';
export type {
  Child,
  JSXNode,
  FC,
  PropsWithChildren,
  RawHtml,
  StandardHtmlAttributes,
  AnchorHtmlAttributes,
  ButtonHtmlAttributes,
  InputHtmlAttributes,
  FormHtmlAttributes,
  ImgHtmlAttributes,
  LinkHtmlAttributes,
  MetaHtmlAttributes,
  ScriptHtmlAttributes
} from './types.js';

