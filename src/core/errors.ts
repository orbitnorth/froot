/**
 * RFC 9457 Problem Details for HTTP APIs error classes for Froot.
 */

import type { StatusCode } from '../types/http.js';

export interface ProblemDetailsOptions {
  type?: string | undefined;
  title?: string | undefined;
  status: StatusCode;
  detail?: string | undefined;
  instance?: string | undefined;
  invalidParams?: Array<{ name: string; reason: string }> | undefined;
  [key: string]: unknown;
}

export class HTTPException extends Error {
  public readonly status: StatusCode;
  public readonly details: ProblemDetailsOptions;

  constructor(status: StatusCode, message?: string, options?: Partial<ProblemDetailsOptions>) {
    super(message || `HTTP ${status}`);
    this.name = 'HTTPException';
    this.status = status;
    this.details = {
      type: options?.type ?? `https://httpstatuses.com/${status}`,
      title: options?.title ?? this.message,
      status,
      detail: options?.detail ?? message,
      instance: options?.instance,
      ...options
    };
  }

  public toResponse(): Response {
    return new Response(JSON.stringify(this.details), {
      status: this.status,
      headers: {
        'content-type': 'application/problem+json; charset=utf-8'
      }
    });
  }
}
