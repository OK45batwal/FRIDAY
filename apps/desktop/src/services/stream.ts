import type { AssistantState } from '../types';

// A single SSE "data:" event from the /api/chat/stream endpoint.
export type StreamEvent =
  | { type: 'thought'; content: string }
  | { type: 'tool_call'; tool: unknown }
  | { type: 'token'; content: string }
  | { type: 'done'; message_id?: string; full_response?: string }
  | { type: string; [k: string]: unknown };

/**
 * Incrementally parse an SSE byte stream into events.
 *
 * The critical property is that a "data:" line split across two network reads is
 * NOT lost: whatever follows the last newline is held in `buffer` and completed
 * by the next push. The chat hook previously parsed each network chunk in
 * isolation, so a frame split mid-JSON silently vanished and its tokens never
 * appeared in the response.
 */
export class SSEParser {
  private buffer = '';

  push(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    // Last element is an incomplete line (or "" if the chunk ended on \n).
    this.buffer = lines.pop() ?? '';

    const events: StreamEvent[] = [];
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        // Malformed frame; skip rather than aborting the whole stream.
      }
    }
    return events;
  }
}

/**
 * Split a growing text buffer at the first sentence boundary past a minimum
 * length, returning the complete sentence to speak and the remaining tail.
 * Returns null when no boundary is ready yet.
 */
export function splitSentence(buffer: string, minLen = 10): { sentence: string; rest: string } | null {
  const m = buffer.match(/^(.*?[.!?\n])\s+(.*)$/s);
  if (m && m[1].trim().length > minLen) {
    return { sentence: m[1].trim(), rest: m[2] || '' };
  }
  return null;
}

/**
 * Validate a user-supplied backend base URL. Anything not http(s) is rejected,
 * so a malformed or javascript:/file: value from localStorage cannot be
 * concatenated into request URLs.
 */
export function sanitizeBaseUrl(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol === 'http:' || u.protocol === 'https:') {
      return raw.trim().replace(/\/+$/, '');
    }
  } catch {
    // not a URL
  }
  return null;
}

export const ASSISTANT_STATES: AssistantState[] = [
  'IDLE',
  'LISTENING',
  'THINKING',
  'SPEAKING',
  'PROCESSING',
  'ERROR',
  'OFFLINE',
];
