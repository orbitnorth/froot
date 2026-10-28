/**
 * Virtual DOM Node Factory & Fragment Implementation.
 */

import type { Child, FC, JSXNode, PropsWithChildren } from './types.js';

export const FragmentSymbol = Symbol.for('froot.jsx.fragment');

export const Fragment = (props: PropsWithChildren): JSXNode => {
  const children = props.children !== undefined
    ? (Array.isArray(props.children) ? props.children : [props.children])
    : [];

  return {
    tag: FragmentSymbol as any,
    props,
    children
  };
};

/**
 * Modern JSX Factory Function (react-jsx transform).
 */
export function jsx(
  tag: string | FC<any> | typeof Fragment,
  props: Record<string, any> = {},
  key?: string | number | null
): JSXNode {
  const { children, ...restProps } = props;
  let normalizedChildren: Child[] = [];

  if (children !== undefined && children !== null) {
    normalizedChildren = Array.isArray(children) ? children : [children];
  }

  return {
    tag,
    props: restProps,
    children: normalizedChildren,
    key
  };
}

/**
 * Modern JSX Factory for static children array (identical in SSR).
 */
export const jsxs = jsx;

/**
 * Development JSX Factory.
 */
export const jsxDEV = (
  tag: string | FC<any> | typeof Fragment,
  props: Record<string, any> = {},
  key?: string | number | null
): JSXNode => jsx(tag, props, key);

/**
 * Classic createElement / h factory function.
 */
export function h(
  tag: string | FC<any> | typeof Fragment,
  props: Record<string, any> | null,
  ...children: Child[]
): JSXNode {
  const normalizedProps = props ? { ...props } : {};
  let flatChildren: Child[] = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      flatChildren.push(...child);
    } else if (child !== undefined && child !== null && typeof child !== 'boolean') {
      flatChildren.push(child);
    }
  }

  return {
    tag,
    props: normalizedProps,
    children: flatChildren
  };
}

