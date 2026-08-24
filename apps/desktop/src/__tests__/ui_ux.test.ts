import { describe, test, expect } from 'vitest';
import { SSEParser, splitSentence, sanitizeBaseUrl } from '../services/stream';

// These exercise the actual shipped parsing/validation used by useFriday and
// api.ts. The previous version of this file imported only type declarations, so
// it asserted on literals defined inside the test and could not fail for any
// change to real behaviour.

describe('SSEParser', () => {
  test('parses whole frames in one chunk', () => {
    const p = new SSEParser();
    const events = p.push('data: {"type":"token","content":"Hi"}\n');
    expect(events).toEqual([{ type: 'token', content: 'Hi' }]);
  });

  test('parses multiple frames in one chunk', () => {
    const p = new SSEParser();
    const events = p.push(
      'data: {"type":"token","content":"a"}\n\ndata: {"type":"token","content":"b"}\n\n'
    );
    expect(events.map((e: any) => e.content)).toEqual(['a', 'b']);
  });

  test('REGRESSION: a frame split mid-JSON across reads is not lost', () => {
    const p = new SSEParser();
    // First read ends in the middle of the JSON payload.
    expect(p.push('data: {"type":"token","cont')).toEqual([]);
    // Second read completes it. The old per-chunk parser dropped this entirely.
    expect(p.push('ent":"world"}\n')).toEqual([{ type: 'token', content: 'world' }]);
  });

  test('REGRESSION: a frame split byte-by-byte still arrives intact', () => {
    const p = new SSEParser();
    const frame = 'data: {"type":"token","content":"xyz"}\n';
    const collected: any[] = [];
    for (const ch of frame) collected.push(...p.push(ch));
    expect(collected).toEqual([{ type: 'token', content: 'xyz' }]);
  });

  test('reassembles a full response across arbitrary chunk boundaries', () => {
    const frames =
      'data: {"type":"token","content":"Hello "}\n' +
      'data: {"type":"token","content":"world"}\n' +
      'data: {"type":"done","message_id":"m1","full_response":"Hello world"}\n';
    // Split at every possible point; the result must be identical each time.
    for (let cut = 1; cut < frames.length; cut++) {
      const p = new SSEParser();
      const events = [...p.push(frames.slice(0, cut)), ...p.push(frames.slice(cut))];
      const tokens = events.filter((e: any) => e.type === 'token').map((e: any) => e.content);
      const done = events.find((e: any) => e.type === 'done') as any;
      expect(tokens.join('')).toBe('Hello world');
      expect(done?.message_id).toBe('m1');
    }
  });

  test('skips malformed frames without dropping valid ones', () => {
    const p = new SSEParser();
    const events = p.push('data: {broken\ndata: {"type":"token","content":"ok"}\n');
    expect(events).toEqual([{ type: 'token', content: 'ok' }]);
  });

  test('ignores non-data lines such as SSE comments', () => {
    const p = new SSEParser();
    expect(p.push(': keepalive\n\nevent: ping\n')).toEqual([]);
  });
});

describe('splitSentence', () => {
  test('splits at a sentence boundary past the minimum length', () => {
    expect(splitSentence('This is a full sentence. And more')).toEqual({
      sentence: 'This is a full sentence.',
      rest: 'And more',
    });
  });

  test('does not split a short fragment', () => {
    expect(splitSentence('Hi. ok')).toBeNull();
  });

  test('returns null when no boundary is present', () => {
    expect(splitSentence('an incomplete clause with no terminator')).toBeNull();
  });

  test('handles question and exclamation marks', () => {
    expect(splitSentence('Is this working correctly? yes')?.sentence).toBe(
      'Is this working correctly?'
    );
    expect(splitSentence('That is remarkable! indeed')?.sentence).toBe('That is remarkable!');
  });
});

describe('sanitizeBaseUrl', () => {
  test('accepts http and https', () => {
    expect(sanitizeBaseUrl('http://localhost:8000')).toBe('http://localhost:8000');
    expect(sanitizeBaseUrl('https://api.example.com')).toBe('https://api.example.com');
  });

  test('strips trailing slashes', () => {
    expect(sanitizeBaseUrl('http://localhost:8000///')).toBe('http://localhost:8000');
  });

  test('rejects non-http schemes', () => {
    // The important cases: these would otherwise be concatenated into fetch URLs.
    expect(sanitizeBaseUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeBaseUrl('file:///etc/passwd')).toBeNull();
    expect(sanitizeBaseUrl('data:text/html,<script>')).toBeNull();
  });

  test('rejects garbage and empty values', () => {
    expect(sanitizeBaseUrl('not a url')).toBeNull();
    expect(sanitizeBaseUrl('')).toBeNull();
    expect(sanitizeBaseUrl('   ')).toBeNull();
    expect(sanitizeBaseUrl(null)).toBeNull();
    expect(sanitizeBaseUrl(undefined)).toBeNull();
  });
});
