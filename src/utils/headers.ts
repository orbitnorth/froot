/**
 * High-performance, zero-allocation LazyHeaders wrapper.
 * Directly proxies Node.js IncomingHttpHeaders without copying or allocating Map entries.
 */

export class LazyHeaders {
  private _raw: Record<string, string | string[] | undefined>;
  private _mutations: Map<string, string[]> | null = null;
  private _deleted: Set<string> | null = null;

  constructor(raw: Record<string, string | string[] | undefined> = {}) {
    this._raw = raw;
  }

  public get(name: string): string | null {
    const lower = name.toLowerCase();
    if (this._deleted && this._deleted.has(lower)) {
      return null;
    }
    if (this._mutations && this._mutations.has(lower)) {
      const vals = this._mutations.get(lower)!;
      return vals.join(', ');
    }
    const val = this._raw[lower];
    if (val === undefined) return null;
    return Array.isArray(val) ? val.join(', ') : val;
  }

  public has(name: string): boolean {
    const lower = name.toLowerCase();
    if (this._deleted && this._deleted.has(lower)) return false;
    if (this._mutations && this._mutations.has(lower)) return true;
    return this._raw[lower] !== undefined;
  }

  public set(name: string, value: string): void {
    const lower = name.toLowerCase();
    if (!this._mutations) this._mutations = new Map();
    if (this._deleted) this._deleted.delete(lower);
    this._mutations.set(lower, [String(value)]);
  }

  public append(name: string, value: string): void {
    const lower = name.toLowerCase();
    if (!this._mutations) this._mutations = new Map();
    if (this._deleted && this._deleted.has(lower)) {
      this._deleted.delete(lower);
      this._mutations.set(lower, [String(value)]);
      return;
    }
    let existing = this._mutations.get(lower);
    if (!existing) {
      const raw = this._raw[lower];
      existing = raw ? (Array.isArray(raw) ? [...raw] : [raw]) : [];
      this._mutations.set(lower, existing);
    }
    existing.push(String(value));
  }

  public delete(name: string): void {
    const lower = name.toLowerCase();
    if (!this._deleted) this._deleted = new Set();
    this._deleted.add(lower);
    if (this._mutations) this._mutations.delete(lower);
  }

  public forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    const keys = new Set<string>();
    for (const k in this._raw) {
      keys.add(k.toLowerCase());
    }
    if (this._mutations) {
      for (const k of this._mutations.keys()) {
        keys.add(k);
      }
    }
    if (this._deleted) {
      for (const k of this._deleted) {
        keys.delete(k);
      }
    }
    for (const k of keys) {
      const v = this.get(k);
      if (v !== null) {
        callback(v, k, this as unknown as Headers);
      }
    }
  }

  public *entries(): IterableIterator<[string, string]> {
    const keys = new Set<string>();
    for (const k in this._raw) {
      keys.add(k.toLowerCase());
    }
    if (this._mutations) {
      for (const k of this._mutations.keys()) {
        keys.add(k);
      }
    }
    if (this._deleted) {
      for (const k of this._deleted) {
        keys.delete(k);
      }
    }
    for (const k of keys) {
      const v = this.get(k);
      if (v !== null) {
        yield [k, v];
      }
    }
  }

  public *keys(): IterableIterator<string> {
    for (const [k] of this.entries()) {
      yield k;
    }
  }

  public *values(): IterableIterator<string> {
    for (const [, v] of this.entries()) {
      yield v;
    }
  }

  public [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  public getSetCookie(): string[] {
    const lower = 'set-cookie';
    if (this._deleted && this._deleted.has(lower)) return [];
    if (this._mutations && this._mutations.has(lower)) return this._mutations.get(lower)!;
    const val = this._raw[lower];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}
