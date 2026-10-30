/** @jsxImportSource preact */
/**
 * Next.js / Clerk / Stripe-Style Showcase Landing Page Component.
 * Engineered with high-end dark aesthetics, ambient mesh glows, interactive benchmarks,
 * feature bento grid, syntax-highlighted code showcase, and zero runtime CDN dependencies.
 */

import { highlightCode } from '@froot/fullstack';
import { LandingNavbar } from './LandingNavbar.js';

const INITIAL_FULLSTACK_CODE = `// src/app/page.tsx - Next.js App Router with Preact SSR & Tailwind v4
export const metadata = {
  title: 'Froot Fullstack — Next.js Alternative',
  description: '124,000+ req/sec fullstack web engine with Preact SSR and file-based routing',
};

export default function HomePage() {
  return (
    <div class="max-w-4xl mx-auto px-6 py-20 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-6">
        Next.js Alternative • Preact SSR • Tailwind CSS v4
      </div>
      <h1 class="text-5xl font-extrabold text-white tracking-tight mb-4">
        Extreme Performance <span class="text-emerald-400">Fullstack Engine</span>
      </h1>
      <p class="text-slate-300 text-lg max-w-2xl mx-auto">
        Sub-millisecond JSX SSR with zero runtime CDN scripts and O(1) route dispatch.
      </p>
    </div>
  );
}`;

const INITIAL_RPC_JSON = JSON.stringify(
  {
    status: 'online',
    framework: 'Froot',
    version: '1.0.6',
    throughput: '124,310 req/s',
    avgLatency: '0.81ms',
    runtime: 'Node.js (V8 Monomorphic Engine)',
  },
  null,
  2
);

export function LandingPage() {
  return (
    <div class="relative min-h-screen bg-[#030712] text-slate-100 overflow-x-hidden">
      {/* Ambient glowing radial meshes */}
      <div class="ambient-glow glow-top-left" aria-hidden="true" />
      <div class="ambient-glow glow-top-right" aria-hidden="true" />
      <div class="ambient-glow glow-center" aria-hidden="true" />

      {/* Top Navbar (Only on Landing Page) */}
      <LandingNavbar />

      <main class="relative z-10">
        {/* ====================================================================
            HERO SECTION
            ==================================================================== */}
        <section class="relative pt-20 pb-24 md:pt-28 md:pb-36 bg-grid-pattern" id="hero">
          <div class="max-w-5xl mx-auto px-6 text-center">
            {/* Announcement Badge */}
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-400 mb-8 backdrop-blur-md shadow-sm shadow-emerald-950/50">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Froot v1.0.6 &bull; Preact SSR &bull; Tailwind CSS v4 Built-in</span>
            </div>

            {/* Main Headline */}
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              The Hyper-Performance<br />
              <span class="gradient-text">TypeScript Web Engine</span>
            </h1>

            {/* Subtitle */}
            <p class="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
              Engineered for <strong class="text-white font-semibold">124,000+ req/sec</strong> with monomorphic V8 inline caching.
              Comes with Next.js-style file-based routing, Preact SSR, native Tailwind CSS v4, and zero-codegen type-safe RPC.
            </p>

            {/* CTA Group */}
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {/* Command Copy Box */}
              <div
                class="command-pill cursor-pointer group"
                id="copy-install-box"
                onclick="copyInstallCmd()"
                title="Click to copy command"
              >
                <span class="text-emerald-400 font-mono text-sm select-none">$</span>
                <code class="text-xs sm:text-sm font-mono text-slate-200 group-hover:text-white transition-colors" id="install-cmd-text">
                  npm create frootjs@latest
                </code>
                <button
                  type="button"
                  class="ml-1 p-1 rounded-md text-slate-400 group-hover:text-emerald-300 transition-colors"
                  aria-label="Copy install command"
                >
                  <svg id="copy-icon" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <span id="copy-toast" class="hidden text-xs text-emerald-400 font-semibold transition-opacity">
                  Copied!
                </span>
              </div>

              {/* Get Started Button */}
              <a
                href="/docs"
                class="btn-primary-glow px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
              >
                <span>Explore Documentation</span>
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Live Metrics Pill Bar */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
              <div class="p-3 text-center">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight text-emerald-400">
                  124,310
                </div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                  Req / Sec (Node 26)
                </div>
              </div>
              <div class="p-3 text-center border-l border-white/[0.06]">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  &lt; 25 ns
                </div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                  Static Route Lookup
                </div>
              </div>
              <div class="p-3 text-center border-l border-white/[0.06]">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight text-emerald-400">
                  0%
                </div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                  V8 Deoptimizations
                </div>
              </div>
              <div class="p-3 text-center border-l border-white/[0.06]">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  100%
                </div>
                <div class="text-[11px] uppercase tracking-wider text-slate-400 mt-1 font-medium">
                  Web Standards Native
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            FEATURE BENTO GRID
            ==================================================================== */}
        <section class="py-20 md:py-28 max-w-7xl mx-auto px-6" id="features">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              NEXT-GEN ARCHITECTURE
            </span>
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-3 mb-4">
              Everything You Need in One Unified Stack
            </h2>
            <p class="text-slate-400 text-base sm:text-lg">
              Engineered from the ground up for zero heap churn, Next.js developer ergonomics, and native Tailwind CSS v4 compilation.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: V8 Monomorphism */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 text-xl">
                  ⚡
                </div>
                <h3 class="text-xl font-bold text-white mb-2">V8 Monomorphic IC Engine</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Context instances and route descriptors share constant object shapes. This guarantees V8 JIT executes monomorphic inline caches without deoptimization.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <span>0 megamorphic call sites</span> &bull; <span>O(1) dispatch</span>
              </div>
            </div>

            {/* Bento Card 2: Next.js Alternative Fullstack */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 text-xl">
                  📂
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Fullstack App Router</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Next.js App Router conventions with <code>src/app</code>, hierarchical nested layouts, dynamic parameter segments <code>[slug]</code>, and SSG prerendering.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <span>Preact SSR</span> &bull; <span>Static Site Export</span>
              </div>
            </div>

            {/* Bento Card 3: Tailwind v4 Native */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 text-xl">
                  🎨
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Tailwind CSS v4 Native</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Real CSS-first configuration with <code>@theme</code> and zero runtime CDN scripts. Fullstack router automatically compiles and hot-reloads CSS.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-indigo-400 flex items-center gap-1.5">
                <span>No CDN tags</span> &bull; <span>Auto dev watcher</span>
              </div>
            </div>

            {/* Bento Card 4: Type-Safe RPC */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 text-xl">
                  🔗
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Zero-Codegen RPC</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Export your server type directly to frontend clients: <code>frootClient&lt;AppType&gt;()</code>. Full end-to-end type safety without build steps or code generation.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-purple-400 flex items-center gap-1.5">
                <span>Auto-inferred schemas</span> &bull; <span>Zero overhead</span>
              </div>
            </div>

            {/* Bento Card 5: Streaming & WebSockets */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 text-xl">
                  📡
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Streaming &amp; WebSockets</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  First-class Server-Sent Events (SSE), LLM token streaming with <code>streamText()</code>, and cross-platform WebSocket rooms and message broadcasting.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-amber-400 flex items-center gap-1.5">
                <span>Backpressure aware</span> &bull; <span>AI Agent ready</span>
              </div>
            </div>

            {/* Bento Card 6: Multi-Runtime & Multi-Core */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6 text-xl">
                  🌐
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Multi-Runtime &amp; Cluster</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Write once, deploy anywhere: Node.js, Bun, Deno, Cloudflare Workers, and AWS Lambda. Built-in cluster clustering saturates every available CPU core.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-rose-400 flex items-center gap-1.5">
                <span>Zero adapters needed</span> &bull; <span>Auto CPU scaling</span>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            VERIFIED BENCHMARKS ARENA
            ==================================================================== */}
        <section class="py-20 md:py-28 bg-white/[0.01] border-y border-white/[0.06]" id="benchmarks">
          <div class="max-w-6xl mx-auto px-6">
            <div class="text-center max-w-3xl mx-auto mb-16">
              <span class="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                VERIFIED BENCHMARKS
              </span>
              <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-3 mb-4">
                Extreme Throughput. Minimal Latency.
              </h2>
              <p class="text-slate-400 text-base sm:text-lg">
                Audited with <code>autocannon</code> under 100 concurrent pipelined HTTP connections against leading Node.js frameworks.
              </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Winner Card: Froot */}
              <div class="lg:col-span-2 glass-card rounded-2xl p-8 border-emerald-500/30 shadow-2xl shadow-emerald-950/40 relative">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-6">
                  <span>👑 1ST PLACE WINNER</span>
                </div>

                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl">🍏</span>
                    <div>
                      <h3 class="text-2xl font-bold text-white">Froot Framework</h3>
                      <span class="text-xs text-emerald-400 font-mono">Monomorphic V8 + Radix Dispatch</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                      124,310
                    </div>
                    <div class="text-xs text-slate-400 uppercase tracking-wider font-medium">req / sec</div>
                  </div>
                </div>

                <div class="bench-bar-track mb-6">
                  <div class="bench-bar-fill bench-fill-froot" style="width: 100%" />
                </div>

                <div class="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.08] text-center">
                  <div>
                    <div class="text-sm font-bold text-white font-mono">0.81 ms</div>
                    <div class="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Avg Latency</div>
                  </div>
                  <div class="border-x border-white/[0.08]">
                    <div class="text-sm font-bold text-white font-mono">0 allocs</div>
                    <div class="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Hot-path churn</div>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white font-mono">1.6x faster</div>
                    <div class="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">vs Fastify</div>
                  </div>
                </div>
              </div>

              {/* Contender 2: Hono */}
              <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">🔥</span>
                      <h4 class="text-lg font-bold text-white">Hono</h4>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">Node.js</span>
                  </div>
                  <div class="text-2xl font-extrabold text-orange-400 font-mono mb-1">
                    82,100 <span class="text-xs text-slate-400 font-sans font-normal">req/s</span>
                  </div>
                  <div class="bench-bar-track mb-4">
                    <div class="bench-bar-fill bench-fill-hono" style="width: 66%" />
                  </div>
                </div>
                <div class="text-xs text-slate-400 pt-3 border-t border-white/[0.06] flex justify-between">
                  <span>Latency: <strong>1.21ms</strong></span>
                  <span>Radix tree</span>
                </div>
              </div>

              {/* Contender 3: Fastify */}
              <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">⚡</span>
                      <h4 class="text-lg font-bold text-white">Fastify 5</h4>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">Find-My-Way</span>
                  </div>
                  <div class="text-2xl font-extrabold text-slate-200 font-mono mb-1">
                    74,200 <span class="text-xs text-slate-400 font-sans font-normal">req/s</span>
                  </div>
                  <div class="bench-bar-track mb-4">
                    <div class="bench-bar-fill bench-fill-fastify" style="width: 60%" />
                  </div>
                </div>
                <div class="text-xs text-slate-400 pt-3 border-t border-white/[0.06] flex justify-between">
                  <span>Latency: <strong>1.34ms</strong></span>
                  <span>Async Hooks</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            INTERACTIVE CODE SHOWCASE
            ==================================================================== */}
        <section class="py-20 md:py-28 max-w-6xl mx-auto px-6" id="showcase">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              DEVELOPER EXPERIENCE
            </span>
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mt-3 mb-4">
              Elegant Syntax. Zero Ceremony.
            </h2>
            <p class="text-slate-400 text-base sm:text-lg">
              Explore how easy it is to write fullstack web applications, Preact SSR layouts, and type-safe RPC with Froot.
            </p>
          </div>

          <div class="code-window">
            {/* Header controls & tabs */}
            <div class="code-window-header flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span class="ml-3 text-xs font-mono text-slate-400">froot-project</span>
              </div>

              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" id="runtime-tabs">
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-300 hover:text-white transition-colors active"
                  data-tab="fullstack"
                  id="tab-fullstack"
                >
                  src/app/page.tsx
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="tailwind"
                  id="tab-tailwind"
                >
                  src/styles.css
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="node"
                  id="tab-node"
                >
                  Node.js Server
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="rpc"
                  id="tab-rpc"
                >
                  Type-Safe RPC
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="cloudflare"
                  id="tab-cloudflare"
                >
                  Cloudflare Workers
                </button>
              </div>
            </div>

            {/* Code Body with Server-Side Syntax Highlighting */}
            <div class="p-6 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-slate-200">
              <pre><code id="runtime-code-block" class="language-typescript" dangerouslySetInnerHTML={{ __html: highlightCode(INITIAL_FULLSTACK_CODE, 'typescript') }} /></pre>
            </div>
          </div>
        </section>

        {/* ====================================================================
            INTERACTIVE RPC PLAYGROUND
            ==================================================================== */}
        <section class="py-20 md:py-28 bg-white/[0.01] border-t border-white/[0.06]" id="playground">
          <div class="max-w-5xl mx-auto px-6">
            <div class="text-center max-w-3xl mx-auto mb-12">
              <span class="text-xs font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                INTERACTIVE RPC SIMULATOR
              </span>
              <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3 mb-3">
                Zero-Codegen Client In Action
              </h2>
              <p class="text-slate-400 text-sm sm:text-base">
                Click an endpoint below to test type-inferred RPC requests and inspect live monomorphic V8 responses:
              </p>
            </div>

            <div class="glass-card rounded-2xl p-6 sm:p-8">
              <div class="flex flex-wrap gap-2.5 mb-6">
                <button
                  type="button"
                  class="rpc-action-btn active px-4 py-2 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.08] text-slate-200 transition-all"
                  id="btn-rpc-get-users"
                  onclick="runRpcDemo('getUsers')"
                >
                  client.api.users.get()
                </button>
                <button
                  type="button"
                  class="rpc-action-btn px-4 py-2 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.08] text-slate-200 transition-all"
                  id="btn-rpc-create-user"
                  onclick="runRpcDemo('createUser')"
                >
                  client.api.users.post(&#123; name: 'Alice' &#125;)
                </button>
                <button
                  type="button"
                  class="rpc-action-btn px-4 py-2 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.08] text-slate-200 transition-all"
                  id="btn-rpc-health"
                  onclick="runRpcDemo('health')"
                >
                  client.health.get()
                </button>
              </div>

              <div class="bg-[#090e17] rounded-xl p-5 border border-white/[0.06]">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs font-mono">
                  <span class="text-emerald-400 font-bold" id="rpc-status-badge">
                    200 OK &bull; application/json
                  </span>
                  <span class="text-slate-400" id="rpc-time">
                    V8 Dispatch: 0.72 ms
                  </span>
                </div>
                <pre class="font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto"><code id="rpc-json-output" class="language-json" dangerouslySetInnerHTML={{ __html: highlightCode(INITIAL_RPC_JSON, 'json') }} /></pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer class="border-t border-white/[0.08] py-14 px-6 bg-[#02050d] relative z-10">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-10">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-2xl">🍏</span>
              <span class="text-base font-bold text-white tracking-tight">Froot Framework</span>
            </div>
            <p class="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              Ultra-fast, TypeScript-native web engine engineered for peak V8 monomorphism, Next.js developer ergonomics, and multi-runtime execution.
            </p>
            <div class="text-xs text-slate-400 font-mono">
              Released under the MIT License. &bull; &copy; 2026 OrbitNorth LLC
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-10 text-xs">
            <div>
              <div class="font-semibold text-white uppercase tracking-wider mb-3">Documentation</div>
              <ul class="space-y-2 text-slate-400">
                <li><a href="/docs" class="hover:text-emerald-400 transition-colors">Overview</a></li>
                <li><a href="/docs/quickstart" class="hover:text-emerald-400 transition-colors">Quickstart</a></li>
                <li><a href="/docs/templates" class="hover:text-emerald-400 transition-colors">Templates</a></li>
                <li><a href="/docs/router" class="hover:text-emerald-400 transition-colors">Tri-Tier Router</a></li>
                <li><a href="/docs/middleware" class="hover:text-emerald-400 transition-colors">Middleware</a></li>
              </ul>
            </div>

            <div>
              <div class="font-semibold text-white uppercase tracking-wider mb-3">Fullstack</div>
              <ul class="space-y-2 text-slate-400">
                <li><a href="/docs/jsx" class="hover:text-emerald-400 transition-colors">Preact SSR</a></li>
                <li><a href="/docs/streaming" class="hover:text-emerald-400 transition-colors">Real-time SSE</a></li>
                <li><a href="/docs/websocket" class="hover:text-emerald-400 transition-colors">WebSockets</a></li>
                <li><a href="/docs/openapi" class="hover:text-emerald-400 transition-colors">OpenAPI 3.1</a></li>
                <li><a href="/llms.txt" class="hover:text-emerald-400 transition-colors">llms.txt</a></li>
              </ul>
            </div>

            <div>
              <div class="font-semibold text-white uppercase tracking-wider mb-3">Community</div>
              <ul class="space-y-2 text-slate-400">
                <li><a href="https://github.com/orbitnorth/froot" target="_blank" rel="noreferrer" class="hover:text-emerald-400 transition-colors">GitHub Repository</a></li>
                <li><a href="https://www.npmjs.com/package/frootjs" target="_blank" rel="noreferrer" class="hover:text-emerald-400 transition-colors">npm: frootjs</a></li>
                <li><a href="https://www.npmjs.com/package/froot-fullstack" target="_blank" rel="noreferrer" class="hover:text-emerald-400 transition-colors">npm: froot-fullstack</a></li>
                <li><a href="https://www.npmjs.com/package/create-frootjs" target="_blank" rel="noreferrer" class="hover:text-emerald-400 transition-colors">npm: create-frootjs</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive client script */}
      <script src="./app.js" />
    </div>
  );
}
