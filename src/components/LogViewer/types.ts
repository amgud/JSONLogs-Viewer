// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace' | string;

export interface LogEntry {
  id: number;
  timestamp?: number;
  time?: string;
  level: LogLevel;
  message?: unknown;
  [key: string]: unknown;
}

export type SortCol = 'time' | 'level';
export type SortDir = 'asc' | 'desc' | 'none';
export type LevelFilter = 'all' | LogLevel;

export type StackType = 'stack' | 'trace' | 'downstream';
export type ViewType = 'json' | StackType;
export type StackTrace = { type: StackType; label: string; trace: string };
