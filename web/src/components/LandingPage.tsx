/** @jsxImportSource preact */
/**
 * Next.js / Clerk / Stripe-Style Showcase Landing Page Component.
 * Engineered with high-end dark aesthetics, ambient mesh glows, interactive benchmarks,
 * feature bento grid, syntax-highlighted code showcase, and zero runtime CDN dependencies.
 */

import { highlightCode } from '@froot/fullstack';
import { LandingNavbar } from './LandingNavbar.js';
import {
  IconFroot,
  IconBolt,
  IconFolder,
  IconPalette,
  IconLink,
  IconRadio,
  IconGlobe,
  IconTrophy,
  IconFlame,
  IconZap,
} from './Icons.js';

const INITIAL_NODE_CODE = `import { Froot } from 'frootjs';

const app = new Froot();

// Tier 1 Static Route (O(1) Hash Map in < 25ns)
app.get('/health', (c) => c.json({ status: 'healthy', runtime: 'node' }));

// Dynamic Route with automatic type deduction
app.get('/api/users/:userId', (c) => {
  const userId = c.param('userId'); // typed as string
  return c.json({ id: userId, name: \`User \${userId}\` });
});

// Launch Node.js native engine with TCP socket tuning
app.listen(3000, () => {
  console.log('[server] Froot listening on http://localhost:3000');
});`;

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
                {...{ onclick: 'copyInstallCmd()' }}
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
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-5 rounded-2xl bg-[#0b1324] border border-slate-700/80 shadow-2xl shadow-black/50 backdrop-blur-md">
              <div class="p-3 text-center">
                <div class="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                  124,310
                </div>
                <div class="text-xs uppercase tracking-wider text-slate-300 mt-1.5 font-semibold" style="color: #cbd5e1;">
                  Req / Sec (Node 26)
                </div>
              </div>
              <div class="p-3 text-center border-l border-slate-700/80">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  &lt; 25 ns
                </div>
                <div class="text-xs uppercase tracking-wider text-slate-300 mt-1.5 font-semibold" style="color: #cbd5e1;">
                  Static Route Lookup
                </div>
              </div>
              <div class="p-3 text-center border-l border-slate-700/80">
                <div class="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-400">
                  0%
                </div>
                <div class="text-xs uppercase tracking-wider text-slate-300 mt-1.5 font-semibold" style="color: #cbd5e1;">
                  V8 Deoptimizations
                </div>
              </div>
              <div class="p-3 text-center border-l border-slate-700/80">
                <div class="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                  100%
                </div>
                <div class="text-xs uppercase tracking-wider text-slate-300 mt-1.5 font-semibold" style="color: #cbd5e1;">
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
                <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
                  <IconBolt class="w-5 h-5 text-emerald-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">V8 Monomorphic IC Engine</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Context instances and route descriptors share constant object shapes. This guarantees V8 JIT executes monomorphic inline caches without deoptimization.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25">0 megamorphic calls</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/25">O(1) dispatch</span>
              </div>
            </div>

            {/* Bento Card 2: Smart Tri-Tier Router */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6">
                  <IconFolder class="w-5 h-5 text-cyan-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Smart Tri-Tier Router</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Tier 1 Exact Map O(1) in &lt; 25ns, Tier 2 Single-Pass RegExpRouter for dynamic params, and Tier 3 Radix Prefix Tree for wildcards.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">&lt; 25ns Static Lookup</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/25">Single-Pass Regex</span>
              </div>
            </div>

            {/* Bento Card 3: OpenAPI 3.1 & Interactive Docs */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-6">
                  <IconPalette class="w-5 h-5 text-indigo-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">OpenAPI 3.1 & Scalar UI</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  First-class schema extraction, Standard Schema validation for Zod, TypeBox, and ArkType, and built-in interactive Scalar and Swagger documentation.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/25">Built-in Scalar UI</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/25">Standard Schema</span>
              </div>
            </div>

            {/* Bento Card 4: Type-Safe RPC */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-6">
                  <IconLink class="w-5 h-5 text-purple-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Zero-Codegen RPC</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Export your server type directly to frontend clients: <code>frootClient&lt;AppType&gt;()</code>. Full end-to-end type safety without build steps or code generation.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25">Auto-inferred RPC</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-purple-300 bg-purple-500/10 border border-purple-500/25">Zero build step</span>
              </div>
            </div>

            {/* Bento Card 5: Streaming & WebSockets */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6">
                  <IconRadio class="w-5 h-5 text-amber-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Streaming &amp; WebSockets</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  First-class Server-Sent Events (SSE), LLM token streaming with <code>streamText()</code>, and cross-platform WebSocket rooms and message broadcasting.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25">Backpressure aware</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25">AI token streaming</span>
              </div>
            </div>

            {/* Bento Card 6: Multi-Runtime & Multi-Core */}
            <div class="glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-6">
                  <IconGlobe class="w-5 h-5 text-rose-400" />
                </div>
                <h3 class="text-xl font-bold text-white mb-2">Multi-Runtime &amp; Cluster</h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  Write once, deploy anywhere: Node.js, Bun, Deno, Cloudflare Workers, and AWS Lambda. Built-in cluster clustering saturates every available CPU core.
                </p>
              </div>
              <div class="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-rose-300 bg-rose-500/10 border border-rose-500/25">Multi-Runtime</span>
                <span class="px-2.5 py-1 rounded-md text-xs font-mono font-medium text-rose-300 bg-rose-500/10 border border-rose-500/25">Multi-Core Cluster</span>
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
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-6">
                  <IconTrophy class="w-3.5 h-3.5 text-emerald-400" />
                  <span>1ST PLACE BENCHMARK</span>
                </div>

                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <IconFroot class="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 class="text-2xl font-bold text-white">Froot Framework</h3>
                      <span class="text-xs text-emerald-400 font-mono">Monomorphic V8 + Radix Dispatch</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                      124,310
                    </div>
                    <div class="text-xs text-slate-300 uppercase tracking-wider font-semibold">req / sec</div>
                  </div>
                </div>

                <div class="bench-bar-track mb-6">
                  <div class="bench-bar-fill bench-fill-froot" style="width: 100%" />
                </div>

                <div class="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-center">
                  <div>
                    <div class="text-sm font-bold text-white font-mono">0.81 ms</div>
                    <div class="text-xs text-slate-300 uppercase tracking-wider mt-0.5 font-medium">Avg Latency</div>
                  </div>
                  <div class="border-x border-slate-800/80">
                    <div class="text-sm font-bold text-white font-mono">0 allocs</div>
                    <div class="text-xs text-slate-300 uppercase tracking-wider mt-0.5 font-medium">Hot-path churn</div>
                  </div>
                  <div>
                    <div class="text-sm font-bold text-white font-mono">1.6x faster</div>
                    <div class="text-xs text-slate-300 uppercase tracking-wider mt-0.5 font-medium">vs Fastify</div>
                  </div>
                </div>
              </div>

              {/* Contender 2: Hono */}
              <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <IconFlame class="w-5 h-5 text-orange-400" />
                      <h4 class="text-lg font-bold text-white">Hono</h4>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">Node.js</span>
                  </div>
                  <div class="text-2xl font-extrabold text-orange-400 font-mono mb-1">
                    82,100 <span class="text-xs text-slate-300 font-sans font-normal">req/s</span>
                  </div>
                  <div class="bench-bar-track mb-4">
                    <div class="bench-bar-fill bench-fill-hono" style="width: 66%" />
                  </div>
                </div>
                <div class="text-xs text-slate-300 pt-3 border-t border-white/[0.06] flex justify-between font-medium">
                  <span>Latency: <strong class="text-white">1.21ms</strong></span>
                  <span>Radix tree</span>
                </div>
              </div>

              {/* Contender 3: Fastify */}
              <div class="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <IconZap class="w-5 h-5 text-blue-400" />
                      <h4 class="text-lg font-bold text-white">Fastify 5</h4>
                    </div>
                    <span class="text-xs text-slate-400 font-mono">Find-My-Way</span>
                  </div>
                  <div class="text-2xl font-extrabold text-slate-200 font-mono mb-1">
                    74,200 <span class="text-xs text-slate-300 font-sans font-normal">req/s</span>
                  </div>
                  <div class="bench-bar-track mb-4">
                    <div class="bench-bar-fill bench-fill-fastify" style="width: 60%" />
                  </div>
                </div>
                <div class="text-xs text-slate-300 pt-3 border-t border-white/[0.06] flex justify-between font-medium">
                  <span>Latency: <strong class="text-white">1.34ms</strong></span>
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
              Write once, deploy anywhere: Node.js, Bun, Deno, Cloudflare Workers, and AWS Lambda with unified API ergonomics.
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
                  data-tab="node"
                  id="tab-node"
                >
                  Node.js Native
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="cloudflare"
                  id="tab-cloudflare"
                >
                  Cloudflare Workers
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="bun"
                  id="tab-bun"
                >
                  Bun
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="deno"
                  id="tab-deno"
                >
                  Deno
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="lambda"
                  id="tab-lambda"
                >
                  AWS Lambda
                </button>
                <button
                  type="button"
                  class="tab-btn px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition-colors"
                  data-tab="rpc"
                  id="tab-rpc"
                >
                  Type-Safe RPC
                </button>
              </div>
            </div>

            {/* Code Body with Server-Side Syntax Highlighting */}
            <div class="p-6 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-slate-200">
              <pre><code id="runtime-code-block" class="language-typescript" dangerouslySetInnerHTML={{ __html: highlightCode(INITIAL_NODE_CODE, 'typescript') }} /></pre>
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
                  {...{ onclick: "runRpcDemo('getUsers')" }}
                >
                  client.api.users.get()
                </button>
                <button
                  type="button"
                  class="rpc-action-btn px-4 py-2 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.08] text-slate-200 transition-all"
                  id="btn-rpc-create-user"
                  {...{ onclick: "runRpcDemo('createUser')" }}
                >
                  client.api.users.post(&#123; name: 'Alice' &#125;)
                </button>
                <button
                  type="button"
                  class="rpc-action-btn px-4 py-2 rounded-lg text-xs font-mono bg-white/[0.04] border border-white/[0.1] hover:border-emerald-500/50 hover:bg-white/[0.08] text-slate-200 transition-all"
                  id="btn-rpc-health"
                  {...{ onclick: "runRpcDemo('health')" }}
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
              <div class="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <IconFroot class="w-4 h-4 text-emerald-400" />
              </div>
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
              <div class="font-semibold text-white uppercase tracking-wider mb-3">Features</div>
              <ul class="space-y-2 text-slate-400">
                <li><a href="/docs/jsx" class="hover:text-emerald-400 transition-colors">Server JSX</a></li>
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

      {/* Interactive client script embedded directly — no app.js file needed */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
const RUNTIME_SNIPPETS = {
  node: \`import { Froot } from 'frootjs';

const app = new Froot();

// Tier 1 Static Route (O(1) Hash Map)
app.get('/health', (c) => c.json({ status: 'healthy', runtime: 'node' }));

// Dynamic Route with automatic type deduction
app.get('/api/users/:userId', (c) => {
  const userId = c.param('userId'); // string
  return c.json({ id: userId, name: \\\`User \\\${userId}\\\` });
});

// Launch Node.js native engine with TCP socket tuning
app.listen(3000, () => {
  console.log('[server] Froot listening on http://localhost:3000');
});\`,

  cloudflare: \`import { Froot } from 'frootjs';

interface Env {
  Bindings: {
    USERS_KV: KVNamespace;
    DATABASE: D1Database;
    SECRET_KEY: string;
  };
}

const app = new Froot<Env>();

app.get('/data/:key', async (c) => {
  c.waitUntil(logAnalytics(c.req.url));
  const val = await c.env.USERS_KV.get(c.param('key'));
  return c.json({ key: c.param('key'), val });
});

export default app;\`,

  bun: \`import { Froot } from 'frootjs';

const app = new Froot();

app.get('/', (c) => {
  return c.json({
    message: 'Ultra-fast execution on Bun C++ engine',
    timestamp: Date.now()
  });
});

export default app; // Or: Bun.serve(app)\`,

  deno: \`import { Froot } from 'frootjs';

const app = new Froot();

app.get('/api/metrics', (c) => {
  return c.json({ runtime: 'Deno', memory: Deno.memoryUsage() });
});

Deno.serve({ port: 8000 }, app.fetch);\`,

  lambda: \`import { Froot } from 'frootjs';
import { handle } from 'frootjs/adapters/aws-lambda';

const app = new Froot();

app.get('/serverless-status', (c) => {
  return c.json({
    platform: 'AWS Lambda (API Gateway v2 / Function URL)',
    region: process.env.AWS_REGION
  });
});

export const handler = handle(app);\`,

  rpc: \`// 1. Backend: Export App type
const app = new Froot()
  .get('/api/users/:id', (c) => c.json({ id: c.param('id'), name: 'Alice' }))
  .post('/api/users', async (c) => c.json({ created: true }, 201));

export type AppType = typeof app;

// 2. Frontend / Client: Zero code-gen, instant type safety!
import { createFrootClient } from 'frootjs/client';
import type { AppType } from './server';

const client = createFrootClient<AppType>({ baseUrl: 'http://localhost:3000' });
const res = await client.api.users[':id'].get({ param: { id: '42' } });
const user = await res.json();\`
};

function highlightCodeClient(code) {
  if (!code) return '';
  const tokens = [];
  let masked = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  masked = masked.replace(/(\\/\*[\s\S]*?\\*\/|\\/\\/.*)/g, (m) => {
    const id = '__TOK_' + tokens.length + '__';
    tokens.push('<span class="token-comment">' + m + '</span>');
    return id;
  });
  masked = masked.replace(/(\`[\\s\\S]*?\`|\"(?:\\\\\"|[^\"])*?\"|\'(?:\\\\\'|[^\'])*?\')/g, (m) => {
    const id = '__TOK_' + tokens.length + '__';
    tokens.push('<span class="token-string">' + m + '</span>');
    return id;
  });
  const keywords = /\\b(import|export|from|as|default|const|let|var|function|return|async|await|if|else|switch|case|break|continue|for|while|try|catch|finally|throw|new|typeof|instanceof|void|this|class|extends|interface|type)\\b/g;
  masked = masked.replace(keywords, '<span class="token-keyword">$1</span>');
  const types = /\\b(string|number|boolean|any|unknown|never|void|Record|Array|Promise|Set|Map|Froot|AppRouter|Request|Response|Headers|ReadableStream|KVNamespace|D1Database)\\b/g;
  masked = masked.replace(types, '<span class="token-type">$1</span>');
  const booleans = /\\b(true|false|null|undefined)\\b/g;
  masked = masked.replace(booleans, '<span class="token-boolean">$1</span>');
  const numbers = /\\b(\\d+(?:\\.\\d+)?)\\b/g;
  masked = masked.replace(numbers, '<span class="token-number">$1</span>');
  masked = masked.replace(/\\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\\s*\\()/g, '<span class="token-fn">$1</span>');
  for (let i = 0; i < tokens.length; i++) {
    masked = masked.replace('__TOK_' + i + '__', tokens[i]);
  }
  return masked;
}

function setupRuntimeTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const codeBlock = document.getElementById('runtime-code-block');
  function renderTab(tabKey) {
    tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
    if (codeBlock && RUNTIME_SNIPPETS[tabKey]) {
      codeBlock.innerHTML = highlightCodeClient(RUNTIME_SNIPPETS[tabKey]);
    }
  }
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabKey = tab.getAttribute('data-tab');
      if (tabKey) renderTab(tabKey);
    });
  });
  renderTab('node');
}

function copyInstallCmd() {
  const textEl = document.getElementById('install-cmd-text');
  const cmd = textEl ? textEl.innerText.trim() : 'npm create frootjs@latest';
  navigator.clipboard.writeText(cmd).then(() => {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  });
}

function simulateRouteMatch() {
  const inputEl = document.getElementById('router-test-input');
  if (!inputEl) return;
  const path = (inputEl.value || '').trim();
  const pill = document.getElementById('result-tier-pill');
  const complexity = document.getElementById('result-complexity');
  const params = document.getElementById('result-params');
  const speed = document.getElementById('result-speed');
  const handler = document.getElementById('result-handler');

  if (path === '/health' || path === '/metrics' || path === '/api/v1/ping' || path === '/') {
    if (pill) pill.textContent = 'Tier 1: Exact Static Map (O(1))';
    if (complexity) complexity.textContent = 'O(1) Direct Hash Map';
    if (params) params.textContent = '{} (No parameters)';
    if (speed) speed.textContent = '~18 nanoseconds';
    if (handler) handler.textContent = 'staticHealthCheckHandler';
  } else if (path.startsWith('/assets/') || path.startsWith('/files/') || path.endsWith('*')) {
    if (pill) pill.textContent = 'Tier 3: Radix Prefix Trie';
    if (complexity) complexity.textContent = 'O(Prefix Depth)';
    if (params) params.textContent = JSON.stringify({ wildcard: path });
    if (speed) speed.textContent = '~110 nanoseconds';
    if (handler) handler.textContent = 'wildcardStaticAssetHandler';
  } else if (path.includes('/')) {
    const parts = path.split('/').filter(Boolean);
    const mockParam = parts[parts.length - 1] || '42';
    if (pill) pill.textContent = 'Tier 2: Single-Pass RegExpRouter';
    if (complexity) complexity.textContent = 'O(Single Pass Irregexp)';
    if (params) params.textContent = JSON.stringify({ id: mockParam }, null, 2);
    if (speed) speed.textContent = '~64 nanoseconds';
    if (handler) handler.textContent = 'parameterizedApiController';
  } else {
    if (pill) pill.textContent = '404 Not Found';
    if (complexity) complexity.textContent = 'None';
    if (params) params.textContent = 'None';
    if (speed) speed.textContent = '~12 nanoseconds';
    if (handler) handler.textContent = 'notFoundHandler';
  }
}

function runRpcDemo(scenario) {
  const buttons = document.querySelectorAll('.rpc-action-btn');
  buttons.forEach((btn) => btn.classList.remove('active'));
  const statusBadge = document.getElementById('rpc-status-badge');
  const timeEl = document.getElementById('rpc-time');
  const outputCode = document.getElementById('rpc-json-output');

  if (scenario === 'getUser') {
    document.getElementById('btn-rpc-get-user')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '200 OK';
    if (timeEl) timeEl.textContent = 'Response Time: 0.68ms (In-Memory Fetch)';
    if (outputCode) outputCode.textContent = JSON.stringify({ id: '42', name: 'Alice Cooper', verified: true }, null, 2);
  } else if (scenario === 'createUser') {
    document.getElementById('btn-rpc-create-user')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '201 Created';
    if (timeEl) timeEl.textContent = 'Response Time: 0.95ms';
    if (outputCode) outputCode.textContent = JSON.stringify({ created: true, user: { id: 'usr_102', name: 'Bob' } }, null, 2);
  } else if (scenario === 'health') {
    document.getElementById('btn-rpc-health')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '200 OK';
    if (timeEl) timeEl.textContent = 'Response Time: 0.22ms (Tier 1 O(1))';
    if (outputCode) outputCode.textContent = JSON.stringify({ status: 'healthy', runtime: 'V8 Monomorphic Engine' }, null, 2);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupRuntimeTabs();
  simulateRouteMatch();
  runRpcDemo('getUser');
  const routeInput = document.getElementById('router-test-input');
  if (routeInput) routeInput.addEventListener('input', simulateRouteMatch);
});
          `,
        }}
      />
    </div>
  );
}
