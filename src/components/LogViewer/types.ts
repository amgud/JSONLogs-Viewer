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

export type StackTrace = { label: string; trace: string };
