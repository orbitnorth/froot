/**
 * JSX Layout Renderer Middleware & Context Extensions.
 */

import { renderToHtml } from './render.js';
import type { Child, JSXNode } from './types.js';
import type { Context, MiddlewareHandler } from '../types/index.js';

export type LayoutComponent = (
  props: { children: Child },
  c: Context<any, any>
) => JSXNode | Promise<JSXNode> | Child | Promise<Child>;

/**
 * Middleware that registers a default JSX layout wrapper for c.render().
 */
export function jsxRenderer(layout?: LayoutComponent): MiddlewareHandler {
  return async (c, next) => {
    (c as any)._renderer = async (
      content: JSXNode | Child,
      ctx: Context<any, any>,
      status?: any,
      headers?: any
    ): Promise<Response> => {
      let finalTree: Child;
      if (layout) {
        finalTree = await layout({ children: content }, ctx);
      } else {
        finalTree = content;
      }
      const html = await renderToHtml(finalTree);
      return ctx.html(html, status, headers);
    };

    await next();
  };
}
