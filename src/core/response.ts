/**
 * Fast response constructors and serialization helpers for Froot.
 */

import type { StatusCode } from '../types/http.js';

export function json<T>(data: T, status: StatusCode = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  if (!h.has('content-type')) {
    h.set('content-type', 'application/json; charset=utf-8');
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: h
  });
}

export function text(body: string, status: StatusCode = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  if (!h.has('content-type')) {
    h.set('content-type', 'text/plain; charset=utf-8');
  }
  return new Response(body, {
    status,
    headers: h
  });
}

export function html(body: string, status: StatusCode = 200, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  if (!h.has('content-type')) {
    h.set('content-type', 'text/html; charset=utf-8');
  }
  return new Response(body, {
    status,
    headers: h
  });
}

export function redirect(location: string, status: StatusCode = 302): Response {
  return new Response(null, {
    status,
    headers: {
      location
    }
  });
}
