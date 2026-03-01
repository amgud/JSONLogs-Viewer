import type { LogEntry, LogLevel } from '@/lib/parseJsonl';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export type SortCol = 'time' | 'level';
export type SortDir = 'asc' | 'desc' | 'none';
export type LevelFilter = 'all' | LogLevel;

export const LEVELS: LevelFilter[] = ['all', 'error', 'warn', 'info'];

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

export function extractStackTraces(entry: LogEntry): { label: string; trace: string }[] {
  const out: { label: string; trace: string }[] = [];

  // top-level .stack (e.g. warn entries)
  if (entry.stack && typeof entry.stack === 'string') {
    out.push({ label: 'Stack Trace', trace: entry.stack });
  }

  // message.payload.stackTrace (desl-service error entries)
  const msg = entry.message;
  if (msg && typeof msg === 'object') {
    const m = msg as Record<string, unknown>;
    const payload = m['payload'] as Record<string, unknown> | undefined;
    if (payload?.stackTrace && typeof payload.stackTrace === 'string') {
      out.push({ label: 'Downstream Stack Trace', trace: payload.stackTrace });
    }
  }

  // top-level .stackTrace
  if (entry.stackTrace && typeof entry.stackTrace === 'string') {
    out.push({ label: 'Stack Trace', trace: entry.stackTrace });
  }

  return out;
}
