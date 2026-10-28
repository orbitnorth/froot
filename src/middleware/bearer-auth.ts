/**
 * RFC 6750 Bearer Token Authentication middleware for Froot.
 * Protects routes by validating HTTP Authorization headers with static tokens or custom verification callbacks.
 */

import type { MiddlewareHandler, Context } from '../types/index.js';
import { HTTPException } from '../core/errors.js';

export interface BearerAuthOptions {
  /**
   * Static token or list of valid tokens to match against.
   */
  token?: string | string[];

  /**
   * Custom verification callback. Return true if valid, false if invalid.
   */
  verify?: (token: string, c: Context) => boolean | Promise<boolean>;

  /**
   * Authentication realm for the WWW-Authenticate response header.
   * @default 'froot'
   */
  realm?: string;

  /**
   * Header name to inspect. Defaults to 'authorization'.
   */
  headerName?: string;
}

/**
 * Creates Bearer authentication middleware enforcing RFC 6750 authorization.
 */
export function bearerAuth(options: BearerAuthOptions): MiddlewareHandler {
  const realm = options.realm || 'froot';
  const headerName = options.headerName || 'authorization';

  return async (c, next) => {
    const authHeader = c.req.header(headerName);

    if (!authHeader) {
      c.header('www-authenticate', `Bearer realm="${realm}"`);
      throw new HTTPException(401, 'Unauthorized', {
        detail: 'Missing Authorization header'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
      c.header('www-authenticate', `Bearer realm="${realm}", error="invalid_request"`);
      throw new HTTPException(401, 'Unauthorized', {
        detail: 'Malformed Authorization header. Format must be: Bearer <token>'
      });
    }

    const token = parts[1]!;
    let isValid = false;

    if (options.verify) {
      isValid = await options.verify(token, c);
    } else if (Array.isArray(options.token)) {
      isValid = options.token.includes(token);
    } else if (typeof options.token === 'string') {
      isValid = options.token === token;
    }

    if (!isValid) {
      c.header('www-authenticate', `Bearer realm="${realm}", error="invalid_token"`);
      throw new HTTPException(401, 'Unauthorized', {
        detail: 'Invalid or expired bearer token'
      });
    }

    return await next();
  };
}
