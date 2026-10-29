/**
 * TypeScript Type Definitions for Froot JSX Runtime.
 */

export type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | JSXNode
  | Promise<JSXNode | string | number | null | undefined>
  | Child[];

export interface JSXNode {
  tag: string | FC<any> | typeof Fragment | symbol;
  props: Record<string, any>;
  children: Child[];
  key?: string | number | null | undefined;
  isEscaped?: boolean | undefined;
}

export type FC<P = Record<string, unknown>> = (
  props: P
) => JSXNode | Promise<JSXNode> | string | Promise<string> | null | undefined;

export type PropsWithChildren<P = Record<string, unknown>> = P & {
  children?: Child | undefined;
};

export interface RawHtml {
  __html: string;
  isEscaped: true;
}

export declare const Fragment: (props: PropsWithChildren) => JSXNode;

export interface StandardHtmlAttributes {
  children?: Child | undefined;
  id?: string | undefined;
  class?: string | undefined;
  className?: string | undefined;
  style?: string | Record<string, string | number> | undefined;
  title?: string | undefined;
  lang?: string | undefined;
  dir?: string | undefined;
  hidden?: boolean | undefined;
  tabindex?: number | string | undefined;
  tabIndex?: number | string | undefined;
  role?: string | undefined;
  dangerouslySetInnerHTML?: { __html: string } | undefined;
  [key: `data-${string}`]: any;
  [key: `aria-${string}`]: any;
  [key: string]: any;
}

export interface AnchorHtmlAttributes extends StandardHtmlAttributes {
  href?: string | undefined;
  target?: string | undefined;
  rel?: string | undefined;
  download?: any | undefined;
}

export interface ButtonHtmlAttributes extends StandardHtmlAttributes {
  type?: 'button' | 'submit' | 'reset' | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
  value?: string | number | undefined;
}

export interface InputHtmlAttributes extends StandardHtmlAttributes {
  type?: string | undefined;
  name?: string | undefined;
  value?: string | number | undefined;
  defaultValue?: string | number | undefined;
  placeholder?: string | undefined;
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  readonly?: boolean | undefined;
  required?: boolean | undefined;
  autofocus?: boolean | undefined;
  autocomplete?: string | undefined;
  min?: string | number | undefined;
  max?: string | number | undefined;
  step?: string | number | undefined;
}

export interface FormHtmlAttributes extends StandardHtmlAttributes {
  action?: string | undefined;
  method?: 'get' | 'post' | 'GET' | 'POST' | undefined;
  enctype?: string | undefined;
  target?: string | undefined;
}

export interface ImgHtmlAttributes extends StandardHtmlAttributes {
  src?: string | undefined;
  alt?: string | undefined;
  width?: string | number | undefined;
  height?: string | number | undefined;
  loading?: 'lazy' | 'eager' | undefined;
}

export interface LinkHtmlAttributes extends StandardHtmlAttributes {
  href?: string | undefined;
  rel?: string | undefined;
  type?: string | undefined;
  as?: string | undefined;
}

export interface MetaHtmlAttributes extends StandardHtmlAttributes {
  name?: string | undefined;
  content?: string | undefined;
  charset?: string | undefined;
  charSet?: string | undefined;
  'http-equiv'?: string | undefined;
  httpEquiv?: string | undefined;
}

export interface ScriptHtmlAttributes extends StandardHtmlAttributes {
  src?: string | undefined;
  type?: string | undefined;
  async?: boolean | undefined;
  defer?: boolean | undefined;
}

export namespace JSX {
  export type Element = any;
  export type ElementType = any;
  export interface ElementChildrenAttribute {
    children: any;
  }
  export interface IntrinsicElements {
    // Structure
    html: StandardHtmlAttributes;
    head: StandardHtmlAttributes;
    body: StandardHtmlAttributes;
    title: StandardHtmlAttributes;
    meta: MetaHtmlAttributes;
    link: LinkHtmlAttributes;
    script: ScriptHtmlAttributes;
    style: StandardHtmlAttributes;

    // Layout & Text
    div: StandardHtmlAttributes;
    span: StandardHtmlAttributes;
    p: StandardHtmlAttributes;
    h1: StandardHtmlAttributes;
    h2: StandardHtmlAttributes;
    h3: StandardHtmlAttributes;
    h4: StandardHtmlAttributes;
    h5: StandardHtmlAttributes;
    h6: StandardHtmlAttributes;
    main: StandardHtmlAttributes;
    header: StandardHtmlAttributes;
    footer: StandardHtmlAttributes;
    nav: StandardHtmlAttributes;
    section: StandardHtmlAttributes;
    article: StandardHtmlAttributes;
    aside: StandardHtmlAttributes;

    // Inline & Media
    a: AnchorHtmlAttributes;
    button: ButtonHtmlAttributes;
    input: InputHtmlAttributes;
    textarea: StandardHtmlAttributes & { name?: string; rows?: number; cols?: number; disabled?: boolean; required?: boolean };
    select: StandardHtmlAttributes & { name?: string; disabled?: boolean; required?: boolean; multiple?: boolean };
    option: StandardHtmlAttributes & { value?: string | number; selected?: boolean; disabled?: boolean };
    label: StandardHtmlAttributes & { for?: string; htmlFor?: string };
    form: FormHtmlAttributes;
    img: ImgHtmlAttributes;
    ul: StandardHtmlAttributes;
    ol: StandardHtmlAttributes;
    li: StandardHtmlAttributes;
    table: StandardHtmlAttributes;
    thead: StandardHtmlAttributes;
    tbody: StandardHtmlAttributes;
    tr: StandardHtmlAttributes;
    th: StandardHtmlAttributes;
    td: StandardHtmlAttributes;
    pre: StandardHtmlAttributes;
    code: StandardHtmlAttributes;
    blockquote: StandardHtmlAttributes;
    hr: StandardHtmlAttributes;
    br: StandardHtmlAttributes;

    // Generic fallback
    [elemName: string]: StandardHtmlAttributes & Record<string, any>;
  }
}

declare global {
  namespace JSX {
    type Element = any;
    type ElementType = any;
    interface ElementChildrenAttribute {
      children: any;
    }
    interface IntrinsicElements {
      // Structure
      html: StandardHtmlAttributes;
      head: StandardHtmlAttributes;
      body: StandardHtmlAttributes;
      title: StandardHtmlAttributes;
      meta: MetaHtmlAttributes;
      link: LinkHtmlAttributes;
      script: ScriptHtmlAttributes;
      style: StandardHtmlAttributes;

      // Layout & Text
      div: StandardHtmlAttributes;
      span: StandardHtmlAttributes;
      p: StandardHtmlAttributes;
      h1: StandardHtmlAttributes;
      h2: StandardHtmlAttributes;
      h3: StandardHtmlAttributes;
      h4: StandardHtmlAttributes;
      h5: StandardHtmlAttributes;
      h6: StandardHtmlAttributes;
      main: StandardHtmlAttributes;
      header: StandardHtmlAttributes;
      footer: StandardHtmlAttributes;
      nav: StandardHtmlAttributes;
      section: StandardHtmlAttributes;
      article: StandardHtmlAttributes;
      aside: StandardHtmlAttributes;

      // Inline & Media
      a: AnchorHtmlAttributes;
      button: ButtonHtmlAttributes;
      input: InputHtmlAttributes;
      textarea: StandardHtmlAttributes & { name?: string; rows?: number; cols?: number; disabled?: boolean; required?: boolean };
      select: StandardHtmlAttributes & { name?: string; disabled?: boolean; required?: boolean; multiple?: boolean };
      option: StandardHtmlAttributes & { value?: string | number; selected?: boolean; disabled?: boolean };
      label: StandardHtmlAttributes & { for?: string; htmlFor?: string };
      form: FormHtmlAttributes;
      img: ImgHtmlAttributes;
      ul: StandardHtmlAttributes;
      ol: StandardHtmlAttributes;
      li: StandardHtmlAttributes;
      table: StandardHtmlAttributes;
      thead: StandardHtmlAttributes;
      tbody: StandardHtmlAttributes;
      tr: StandardHtmlAttributes;
      th: StandardHtmlAttributes;
      td: StandardHtmlAttributes;
      pre: StandardHtmlAttributes;
      code: StandardHtmlAttributes;
      blockquote: StandardHtmlAttributes;
      hr: StandardHtmlAttributes;
      br: StandardHtmlAttributes;

      // Generic fallback
      [elemName: string]: StandardHtmlAttributes & Record<string, any>;
    }
  }
}
