/**
 * AWS Lambda & API Gateway v2 / Function URL adapter for Froot.
 * Converts Lambda event payloads to Web Requests and serializes Web Responses back to Lambda format.
 */

import type { FetchableApp } from '../core/node-adapter.js';

export interface LambdaEventV2 {
  rawPath: string;
  rawQueryString?: string;
  headers: Record<string, string | undefined>;
  requestContext?: {
    http?: {
      method: string;
      path: string;
      protocol?: string;
      sourceIp?: string;
      userAgent?: string;
    };
  };
  body?: string;
  isBase64Encoded?: boolean;
  cookies?: string[];
}

export interface LambdaResultV2 {
  statusCode: number;
  headers?: Record<string, string> | undefined;
  cookies?: string[] | undefined;
  body?: string | undefined;
  isBase64Encoded?: boolean | undefined;
}

export function handle(app: FetchableApp) {
  return async (event: LambdaEventV2, context?: unknown): Promise<LambdaResultV2> => {
    const method = event.requestContext?.http?.method || 'GET';
    const path = event.rawPath || '/';
    const queryString = event.rawQueryString ? `?${event.rawQueryString}` : '';
    const host = event.headers['host'] || 'localhost';
    const protocol = event.headers['x-forwarded-proto'] || 'https';

    const url = `${protocol}://${host}${path}${queryString}`;

    const headers = new Headers();
    for (const [k, v] of Object.entries(event.headers)) {
      if (v !== undefined) {
        headers.set(k, v);
      }
    }

    if (event.cookies && event.cookies.length > 0) {
      headers.set('cookie', event.cookies.join('; '));
    }

    let body: BodyInit | null = null;
    if (event.body) {
      if (event.isBase64Encoded) {
        body = Buffer.from(event.body, 'base64');
      } else {
        body = event.body;
      }
    }

    const request = new Request(url, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? body : null
    });

    const response = await app.fetch(request, {}, context);

    const responseHeaders: Record<string, string> = {};
    const responseCookies: string[] = [];

    response.headers.forEach((val: string, key: string) => {
      if (key.toLowerCase() === 'set-cookie') {
        responseCookies.push(val);
      } else {
        responseHeaders[key] = val;
      }
    });

    const responseText = await response.text();

    return {
      statusCode: response.status,
      headers: responseHeaders,
      cookies: responseCookies.length > 0 ? responseCookies : undefined,
      body: responseText,
      isBase64Encoded: false
    };
  };
}
