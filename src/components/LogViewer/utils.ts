import type { LevelFilter, StackTrace, LogEntry } from './types';

export const LEVELS: LevelFilter[] = ['all', 'error', 'warn', 'info'];

/**
 * Parses a JSONL string where each JSON object may span multiple lines.
 * Handles both compact (one-per-line) and pretty-printed JSONL.
 */
export function parseJsonl(text: string): LogEntry[] {
  const results: LogEntry[] = [];
  const lines = text.split('\n');
  let buffer: string[] = [];
  let depth = 0;

  const flush = () => {
    if (!buffer.length) return;
    const raw = buffer.join('\n').trim();
    if (!raw) return;
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      results.push({ id: results.length, ...obj } as LogEntry);
    } catch {
      // skip unparseable chunk
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // blank line at top level → boundary between entries
    if (!trimmed) {
      if (depth === 0) {
        flush();
      }
      continue;
    }

    buffer.push(line);

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      // skip string contents to avoid counting braces inside strings
      if (ch === '"') {
        i++;
        while (i < trimmed.length) {
          if (trimmed[i] === '\\') {
            i += 2;
            continue;
          }
          if (trimmed[i] === '"') break;
          i++;
        }
        continue;
      }
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
    }

    if (depth === 0 && buffer.length > 0) {
      flush();
    }
  }

  flush();
  return results;
}

/** Extract a short human-readable summary from a log entry's message field */
export function messagePreview(entry: LogEntry): string {
  const msg = entry.message;
  if (msg === undefined || msg === null) {
    // fall back to other string fields
    const fallback =
      (entry['description'] as string) ||
      (entry['title'] as string) ||
      (entry['name'] as string) ||
      '';
    return fallback;
  }
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'object') {
    const m = msg as Record<string, unknown>;
    if (m['topic'] && m['type']) {
      const payload = m['payload'] as Record<string, unknown> | undefined;
      const trace = payload?.['stackTrace'] as string | undefined;
      const firstLine = trace?.split('\n')[0] ?? '';
      return `[${m['topic']}] ${m['type']}${firstLine ? ' — ' + firstLine : ''}`;
    }
    return JSON.stringify(msg).slice(0, 120);
  }
  return String(msg);
}

// ---------------------------------------------------------------------------
// Badge / filter colour helpers
// ---------------------------------------------------------------------------

export function levelVariant(level: string) {
  switch (level.toLowerCase()) {
    case 'error':
      return 'text-red-400 bg-red-500/15 border-red-500/30';
    case 'warn':
    case 'warning':
      return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    case 'info':
      return 'text-sky-400 bg-sky-500/15 border-sky-500/30';
    case 'debug':
      return 'text-violet-400 bg-violet-500/15 border-violet-500/30';
    default:
      return 'text-muted-foreground bg-muted/50 border-border';
  }
}

export function levelFilterVariant(level: LevelFilter, active: boolean) {
  if (!active) return 'text-muted-foreground border-border hover:bg-muted/50';
  if (level === 'all') return 'bg-primary text-primary-foreground border-primary';
  return levelVariant(level);
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

export function formatTime(entry: LogEntry): string {
  if (entry.time && typeof entry.time === 'string') {
    try {
      const d = new Date(entry.time);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
    } catch {
      return entry.time;
    }
  }
  if (entry.timestamp && typeof entry.timestamp === 'number') {
    const d = new Date(entry.timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`;
  }
  return '—';
}

export function entryTimestamp(entry: LogEntry): number {
  if (entry.timestamp && typeof entry.timestamp === 'number') return entry.timestamp;
  if (entry.time && typeof entry.time === 'string') return new Date(entry.time).getTime();
  return entry.id;
}

// ---------------------------------------------------------------------------
// Search helper
// ---------------------------------------------------------------------------

export function matchesSearch(entry: LogEntry, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return JSON.stringify(entry).toLowerCase().includes(q);
}

// ---------------------------------------------------------------------------
// Stack-trace extraction
// ---------------------------------------------------------------------------

export function extractStackTraces(entry: LogEntry): StackTrace[] {
  const out: StackTrace[] = [];

  // top-level .stack (e.g. warn entries)
  if (entry.stack && typeof entry.stack === 'string') {
    out.push({ type: 'stack', label: 'Stack Trace', trace: entry.stack });
  }

  // message.payload.stackTrace (desl-service error entries)
  const msg = entry.message;
  if (msg && typeof msg === 'object') {
    const m = msg as Record<string, unknown>;
    const payload = m['payload'] as Record<string, unknown> | undefined;
    if (payload?.stackTrace && typeof payload.stackTrace === 'string') {
      out.push({ type: 'downstream', label: 'Downstream Stack Trace', trace: payload.stackTrace });
    }
  }

  // top-level .stackTrace
  if (entry.stackTrace && typeof entry.stackTrace === 'string') {
    out.push({ type: 'trace', label: 'Stack Trace', trace: entry.stackTrace });
  }

  return out;
}

export const STORAGE_KEY = 'jsonlogs-viewer-last-file';

export const getLogFileFromStorage = (): { logs: LogEntry[]; name: string } | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const setLogFileToStorage = (logs: LogEntry[], name: string) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, logs }));
};

export const clearLogFileFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};
