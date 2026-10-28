/**
 * High-performance, zero-allocation URL and Query String parser.
 * Bypasses WHATWG new URL() allocations using linear character index scanning.
 */

/**
 * Fast conditional percent-decoder.
 * Bypasses decodeURIComponent if string has no '%' or '+' characters.
 */
export function fastDecode(str: string): string {
  if (str.indexOf('%') === -1 && str.indexOf('+') === -1) {
    return str;
  }
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    return str;
  }
}

/**
 * Extracts pathname from a full URL or relative path without invoking new URL().
 */
export function fastExtractPathname(url: string): string {
  const qIdx = url.indexOf('?');
  const protoIdx = url.indexOf('://');

  let pathStart = 0;
  if (protoIdx !== -1) {
    const slashIdx = url.indexOf('/', protoIdx + 3);
    if (slashIdx === -1) {
      return '/';
    }
    pathStart = slashIdx;
  }

  if (qIdx === -1) {
    return pathStart === 0 ? url : url.slice(pathStart);
  }

  if (qIdx < pathStart) {
    return '/';
  }

  return url.slice(pathStart, qIdx);
}

/**
 * Parses query parameters into a key-value record using linear token scanning.
 */
export function fastParseQuery(url: string): Record<string, string> {
  const qIdx = url.indexOf('?');
  if (qIdx === -1 || qIdx === url.length - 1) {
    return {};
  }

  const result: Record<string, string> = {};
  let start = qIdx + 1;
  const len = url.length;

  while (start < len) {
    let eqIdx = -1;
    let end = start;

    while (end < len) {
      const code = url.charCodeAt(end);
      if (code === 61 && eqIdx === -1) { // '='
        eqIdx = end;
      } else if (code === 38 || code === 35) { // '&' or '#'
        break;
      }
      end++;
    }

    if (end > start) {
      let rawKey: string;
      let rawVal: string;

      if (eqIdx === -1) {
        rawKey = url.slice(start, end);
        rawVal = '';
      } else {
        rawKey = url.slice(start, eqIdx);
        rawVal = url.slice(eqIdx + 1, end);
      }

      if (rawKey.length > 0) {
        const key = fastDecode(rawKey);
        const val = fastDecode(rawVal);
        result[key] = val;
      }
    }

    if (end < len && url.charCodeAt(end) === 35) {
      // Reached URL fragment identifier '#'
      break;
    }

    start = end + 1;
  }

  return result;
}
