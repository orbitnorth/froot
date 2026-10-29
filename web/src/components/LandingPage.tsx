/** @jsxImportSource preact */
/**
 * Next.js-style High-Performance Showcase Landing Page Component.
 */

import { LandingNavbar } from './LandingNavbar.js';

export function LandingPage() {
  return (
    <div>
      {/* Ambient background glow elements */}
      <div class="ambient-glow glow-top-left" aria-hidden="true" />
      <div class="ambient-glow glow-top-right" aria-hidden="true" />
      <div class="ambient-glow glow-center" aria-hidden="true" />

      {/* Top Navbar (Only on Landing Page) */}
      <LandingNavbar />

      <main>
        {/* Hero Section */}
        <section class="hero-section" id="hero">
          <div class="hero-container">
            <div class="hero-badge-wrapper">
              <span class="hero-badge">
                <span class="badge-dot" />
                V8-Monomorphic • Multi-Runtime • Zero-Codegen RPC
              </span>
            </div>

            <h1 class="hero-title">
              The Next-Generation<br />
              <span class="gradient-text">TypeScript Web Framework</span>
            </h1>

            <p class="hero-subtitle">
              Engineered for <strong>120,000+ req/sec</strong>, monomorphic inline caching, and seamless cross-platform execution on{' '}
              <strong>Node.js</strong>, <strong>Bun</strong>, <strong>Deno</strong>, and <strong>Cloudflare Workers</strong>.
            </p>

            {/* Command copy box */}
            <div class="hero-cta-group">
              <div class="command-box" id="copy-install-box" onclick="copyInstallCmd()">
                <span class="command-prefix">$</span>
                <code class="command-code" id="install-cmd-text">
                  npm create frootjs@latest
                </code>
                <button
                  type="button"
                  class="copy-btn"
                  id="copy-btn"
                  title="Copy install command"
                  aria-label="Copy install command"
                >
                  <svg
                    id="copy-icon"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span id="copy-toast" class="copy-toast">
                    Copied!
                  </span>
                </button>
              </div>

              <a href="/docs" class="primary-btn" id="hero-get-started-btn">
                <span>Explore Documentation</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Metrics pill bar */}
            <div class="hero-metrics-bar">
              <div class="metric-item">
                <span class="metric-value">124,300+</span>
                <span class="metric-label">Req / Sec (Node 26)</span>
              </div>
              <div class="metric-divider" />
              <div class="metric-item">
                <span class="metric-value">&lt; 25 ns</span>
                <span class="metric-label">Static Route Lookup</span>
              </div>
              <div class="metric-divider" />
              <div class="metric-item">
                <span class="metric-value">0%</span>
                <span class="metric-label">V8 Deoptimizations</span>
              </div>
              <div class="metric-divider" />
              <div class="metric-item">
                <span class="metric-value">100%</span>
                <span class="metric-label">Web Standards Native</span>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Runtime Code Showcase */}
        <section class="section runtimes-section" id="runtimes">
          <div class="section-container">
            <div class="section-header">
              <span class="section-badge">WRITE ONCE • RUN ANYWHERE</span>
              <h2 class="section-title">Single Framework. Every Modern JavaScript Runtime.</h2>
              <p class="section-subtitle">
                Zero adapters needed for edge execution. Froot natively speaks standard Web <code>Request</code> and <code>Response</code>.
              </p>
            </div>

            <div class="code-showcase-box">
              <div class="tab-bar" id="runtime-tabs">
                <button class="tab-btn active" data-tab="node" id="tab-node">
                  Node.js
                </button>
                <button class="tab-btn" data-tab="cloudflare" id="tab-cloudflare">
                  Cloudflare Workers
                </button>
                <button class="tab-btn" data-tab="bun" id="tab-bun">
                  Bun
                </button>
                <button class="tab-btn" data-tab="deno" id="tab-deno">
                  Deno
                </button>
                <button class="tab-btn" data-tab="lambda" id="tab-lambda">
                  AWS Lambda
                </button>
                <button class="tab-btn" data-tab="rpc" id="tab-rpc">
                  Type-Safe RPC
                </button>
              </div>

              <div class="code-view" id="code-content-wrapper">
                <pre><code id="runtime-code-block" class="language-typescript" /></pre>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Benchmarks Section */}
        <section class="section benchmarks-section" id="benchmarks">
          <div class="section-container">
            <div class="section-header">
              <span class="section-badge">VERIFIED BENCHMARKS</span>
              <h2 class="section-title">Engineered for Uncompromising Throughput</h2>
              <p class="section-subtitle">
                Measured with <code>autocannon</code> against Express 5.3 and Fastify 5.0 under 100 concurrent pipelined connections.
              </p>
            </div>

            <div class="benchmarks-grid">
              <div class="bench-card winner">
                <div class="bench-badge">👑 1ST PLACE</div>
                <div class="bench-header">
                  <span class="bench-logo">🍏</span>
                  <h3>Froot Framework</h3>
                  <span class="bench-tag">Native V8 Monomorphic</span>
                </div>
                <div class="bench-number">124,310</div>
                <div class="bench-unit">req / sec</div>
                <div class="bench-bar-track">
                  <div class="bench-bar-fill fill-froot" style="width: 100%" />
                </div>
                <ul class="bench-stats">
                  <li><strong>Latency:</strong> 0.81ms (avg)</li>
                  <li><strong>Allocations:</strong> Zero hot-path heap churn</li>
                  <li><strong>Router:</strong> O(1) Static Map + Radix</li>
                </ul>
              </div>

              <div class="bench-card">
                <div class="bench-header">
                  <span class="bench-logo">⚡</span>
                  <h3>Fastify 5.0</h3>
                  <span class="bench-tag">Find-My-Way</span>
                </div>
                <div class="bench-number">74,200</div>
                <div class="bench-unit">req / sec</div>
                <div class="bench-bar-track">
                  <div class="bench-bar-fill fill-fastify" style="width: 60%" />
                </div>
                <ul class="bench-stats">
                  <li><strong>Latency:</strong> 1.34ms (avg)</li>
                  <li><strong>Allocations:</strong> Low heap churn</li>
                  <li><strong>Router:</strong> Radix Tree</li>
                </ul>
              </div>

              <div class="bench-card">
                <div class="bench-header">
                  <span class="bench-logo">🚂</span>
                  <h3>Express 5.3</h3>
                  <span class="bench-tag">Layered Stack</span>
                </div>
                <div class="bench-number">14,890</div>
                <div class="bench-unit">req / sec</div>
                <div class="bench-bar-track">
                  <div class="bench-bar-fill fill-express" style="width: 12%" />
                </div>
                <ul class="bench-stats">
                  <li><strong>Latency:</strong> 6.72ms (avg)</li>
                  <li><strong>Allocations:</strong> Heavy per-request garbage</li>
                  <li><strong>Router:</strong> Linear regex matching</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* RPC Playground Section */}
        <section class="section rpc-section" id="playground">
          <div class="section-container">
            <div class="section-header">
              <span class="section-badge">ZERO-CODEGEN RPC</span>
              <h2 class="section-title">End-to-End Type Safety Without Build Steps</h2>
              <p class="section-subtitle">
                Froot client exports typescript types directly from server definitions. Try testing simulated RPC endpoints:
              </p>
            </div>

            <div class="rpc-playground">
              <div class="rpc-controls">
                <button
                  type="button"
                  class="rpc-action-btn active"
                  id="btn-rpc-get-users"
                  onclick="runRpcDemo('getUsers')"
                >
                  client.api.users.get()
                </button>
                <button
                  type="button"
                  class="rpc-action-btn"
                  id="btn-rpc-create-user"
                  onclick="runRpcDemo('createUser')"
                >
                  client.api.users.post(&#123; json: &#123; name: 'Bob' &#125; &#125;)
                </button>
                <button
                  type="button"
                  class="rpc-action-btn"
                  id="btn-rpc-health"
                  onclick="runRpcDemo('health')"
                >
                  client.health.get()
                </button>
              </div>

              <div class="rpc-output-panel">
                <div class="rpc-output-header">
                  <span class="rpc-status-badge" id="rpc-status-badge">
                    200 OK
                  </span>
                  <span class="rpc-time" id="rpc-time">
                    Response Time: 0.74ms
                  </span>
                </div>
                <pre><code id="rpc-json-output" class="language-json" /></pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-brand">
            <span class="logo-emoji">🍏</span>
            <span class="logo-text">Froot Framework</span>
            <p class="footer-tagline">
              Engineered for peak performance and multi-runtime developer ergonomics.
            </p>
          </div>

          <div class="footer-links">
            <div class="footer-col">
              <h4>Framework</h4>
              <a href="#features">Features</a>
              <a href="#benchmarks">Benchmarks</a>
              <a href="#runtimes">Multi-Runtime</a>
              <a href="/docs">Docs</a>
            </div>

            <div class="footer-col">
              <h4>Ecosystem</h4>
              <a href="https://github.com/orbitnorth/froot" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="https://www.npmjs.com/package/frootjs" target="_blank" rel="noreferrer">
                npm Registry
              </a>
              <a href="/llms.txt">llms.txt</a>
            </div>

            <div class="footer-col">
              <h4>License &amp; Credits</h4>
              <p class="license-text">Released under the MIT License.</p>
              <p class="credits-text">© 2026 Antigravity &amp; OrbitNorth LLC</p>
            </div>
          </div>
        </div>
      </footer>

      <script src="./app.js" />
    </div>
  );
}

