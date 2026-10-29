import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  renderMarkdown,
  parseFrontmatter,
  renderMarkdownFile,
} from '../dist/html/index.js';

describe('Markdown & Frontmatter Engine', () => {
  it('parses frontmatter metadata and separates content', () => {
    const raw = `---
title: Getting Started
category: Core
slug: /docs/start
---
# Welcome
This is content.`;

    const { frontmatter, content } = parseFrontmatter(raw);
    assert.equal(frontmatter.title, 'Getting Started');
    assert.equal(frontmatter.category, 'Core');
    assert.equal(frontmatter.slug, '/docs/start');
    assert.ok(content.includes('# Welcome'));
    assert.ok(!content.includes('category: Core'));
  });

  it('handles markdown without frontmatter', () => {
    const raw = '# Just Markdown\nNo frontmatter here.';
    const { frontmatter, content } = parseFrontmatter(raw);
    assert.deepEqual(frontmatter, {});
    assert.equal(content, raw);
  });

  it('renders headings with generated anchor ids', () => {
    const md = '## Tri-Tier Router\n### Sub Section';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<h2 id="tri-tier-router">Tri-Tier Router</h2>'));
    assert.ok(html.includes('<h3 id="sub-section">Sub Section</h3>'));
  });

  it('renders inline styles: bold, italic, inline code, and links', () => {
    const md = 'Use **bold** and *italic* and `app.fetch` with [Docs](/docs).';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<strong>bold</strong>'));
    assert.ok(html.includes('<em>italic</em>'));
    assert.ok(html.includes('<code>app.fetch</code>'));
    assert.ok(html.includes('<a href="/docs">Docs</a>'));
  });

  it('renders code blocks with syntax highlighting classes and copy button', () => {
    const md = '```ts\nconst app = new Froot();\napp.get("/", (c) => c.text("ok"));\n```';
    const html = renderMarkdown(md);
    assert.ok(html.includes('<div class="code-card'));
    assert.ok(html.includes('<code class="language-ts">'));
    assert.ok(html.includes('const app = new Froot();'));
    assert.ok(html.includes('onclick="copyCode(this)"'));
  });

  it('renders tables properly', () => {
    const md = `| Framework | RPS |
|---|---|
| Froot | 120,000 |
| Express | 15,000 |`;

    const html = renderMarkdown(md);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<th>Framework</th>'));
    assert.ok(html.includes('<th>RPS</th>'));
    assert.ok(html.includes('<td>Froot</td>'));
    assert.ok(html.includes('<td>120,000</td>'));
  });

  it('renders blockquotes and lists', () => {
    const md = `> This is a quote

- Item 1
- Item 2

1. First
2. Second`;

    const html = renderMarkdown(md);
    assert.ok(html.includes('<blockquote'));
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<li>Item 1</li>'));
    assert.ok(html.includes('<ol>'));
    assert.ok(html.includes('<li>First</li>'));
  });

  it('reads and parses markdown files from disk with renderMarkdownFile', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'froot-md-test-'));
    const testFile = path.join(tmpDir, 'test.md');
    await fs.writeFile(
      testFile,
      `---
title: Disk Test
author: Froot Team
---
# Hello Disk
Testing **renderMarkdownFile**.`
    );

    const parsed = await renderMarkdownFile(testFile);
    assert.equal(parsed.frontmatter.title, 'Disk Test');
    assert.equal(parsed.frontmatter.author, 'Froot Team');
    assert.ok(parsed.html.includes('<h1 id="hello-disk">Hello Disk</h1>'));
    assert.ok(parsed.html.includes('<strong>renderMarkdownFile</strong>'));

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
