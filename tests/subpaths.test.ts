/**
 * Tests for Froot subpath export parity (matching Hono's ergonomics).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Froot } from '../dist/index.js';
import { jwt, sign, verify } from '../dist/auth/jwt.js';
import { basicAuth } from '../dist/auth/basic.js';
import { html, raw, escapeHtml } from '../dist/html/index.js';
import { cors } from '../dist/middleware/cors.js';
import { logger } from '../dist/middleware/logger.js';
import { stream, streamSSE } from '../dist/streaming/index.js';
import { upgradeWebSocket, createHub } from '../dist/ws/index.js';
import { buildOpenAPISpec } from '../dist/openapi/index.js';

describe('Froot Subpath Export Parity (Hono-style)', () => {
  it('exports core Froot application', () => {
    assert.equal(typeof Froot, 'function');
  });

  it('exports JWT helpers directly for froot/jwt', () => {
    assert.equal(typeof jwt, 'function');
    assert.equal(typeof sign, 'function');
    assert.equal(typeof verify, 'function');
  });

  it('exports basicAuth for froot/basic-auth', () => {
    assert.equal(typeof basicAuth, 'function');
  });

  it('exports html & raw utilities for froot/html', () => {
    assert.equal(typeof html, 'function');
    assert.equal(typeof raw, 'function');
    assert.equal(typeof escapeHtml, 'function');
  });

  it('exports cors middleware directly for froot/cors', () => {
    assert.equal(typeof cors, 'function');
  });

  it('exports logger middleware directly for froot/logger', () => {
    assert.equal(typeof logger, 'function');
  });

  it('exports streaming helpers for froot/streaming', () => {
    assert.equal(typeof stream, 'function');
    assert.equal(typeof streamSSE, 'function');
  });

  it('exports WebSocket utilities for froot/ws', () => {
    assert.equal(typeof upgradeWebSocket, 'function');
    assert.equal(typeof createHub, 'function');
  });

  it('exports OpenAPI builder for froot/openapi', () => {
    assert.equal(typeof buildOpenAPISpec, 'function');
  });
});

