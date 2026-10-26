/**
 * Modern HTTP security headers middleware (Helmet equivalent) for Froot.
 */

import type { MiddlewareHandler } from '../types/index.js';

export interface SecurityOptions {
  contentSecurityPolicy?: string | false;
  xFrameOptions?: 'DENY' | 'SAMEORIGIN' | false;
  xContentTypeOptions?: boolean;
  xXssProtection?: string | false;
  referrerPolicy?: string | false;
  strictTransportSecurity?: string | false;
  crossOriginOpenerPolicy?: string | false;
}

export function security(options: SecurityOptions = {}): MiddlewareHandler {
  const csp =
    options.contentSecurityPolicy === false
      ? null
      : options.contentSecurityPolicy ?? "default-src 'self'";

  const xfo =
    options.xFrameOptions === false
      ? null
      : options.xFrameOptions ?? 'SAMEORIGIN';

  const xcto = options.xContentTypeOptions ?? true;

  const xxss =
    options.xXssProtection === false
      ? null
      : options.xXssProtection ?? '0';

  const referrer =
    options.referrerPolicy === false
      ? null
      : options.referrerPolicy ?? 'no-referrer';

  const hsts =
    options.strictTransportSecurity === false
      ? null
      : options.strictTransportSecurity ?? 'max-age=15552000; includeSubDomains';

  const coop =
    options.crossOriginOpenerPolicy === false
      ? null
      : options.crossOriginOpenerPolicy ?? 'same-origin';

  return async (c, next) => {
    if (csp) c.header('content-security-policy', csp);
    if (xfo) c.header('x-frame-options', xfo);
    if (xcto) c.header('x-content-type-options', 'nosniff');
    if (xxss) c.header('x-xss-protection', xxss);
    if (referrer) c.header('referrer-policy', referrer);
    if (hsts) c.header('strict-transport-security', hsts);
    if (coop) c.header('cross-origin-opener-policy', coop);

    await next();
  };
}
