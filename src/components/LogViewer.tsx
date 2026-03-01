import { ChevronDown, ChevronRight, Clipboard, FileText, Moon, Sun, X } from 'lucide-react';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { DropZone } from './LogViewer/DropZone';
import { ExpandedRow } from './LogViewer/ExpandedRow';
import { SortIcon } from './LogViewer/SortIcon';
import type { LogEntry, LevelFilter, SortCol, SortDir } from './LogViewer/types';
import {
  levelVariant,
  levelFilterVariant,
  formatTime,
  entryTimestamp,
  matchesSearch,
  parseJsonl,
  messagePreview,
  LEVELS,
} from './LogViewer/utils';

export function LogViewer() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol | null>('time');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleLoad = useCallback((text: string, name: string) => {
    const parsed = parseJsonl(text);
    setLogs(parsed);
    setFileName(name);
    setExpandedId(null);
    setSearch('');
    setLevelFilter('all');
  }, []);

  // Global paste handler when logs are already loaded
  useEffect(() => {
    if (!fileName) return; // handled by DropZone
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const text = e.clipboardData?.getData('text') ?? '';
      if (text.trim()) handleLoad(text, 'clipboard');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [fileName, handleLoad]);

  const handleSort = (col: SortCol) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      // third click — reset
      setSortCol(null);
      setSortDir('none');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const handlePasteFromHeader = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) handleLoad(text, 'clipboard');
    } catch {
      /* ignore */
    }
  };

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of logs) {
      const l = (entry.level ?? 'unknown').toLowerCase();
      counts[l] = (counts[l] ?? 0) + 1;
    }
    return counts;
  }, [logs]);

  const visible = useMemo(() => {
    let filtered = logs;
    if (levelFilter !== 'all') {
      filtered = filtered.filter(
        (e) => (e.level ?? '').toLowerCase() === levelFilter.toLowerCase(),
      );
    }
    if (search) {
      filtered = filtered.filter((e) => matchesSearch(e, search));
    }
    if (!sortCol || sortDir === 'none') return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'time') {
        cmp = entryTimestamp(a) - entryTimestamp(b);
      } else {
        cmp = (a.level ?? '').localeCompare(b.level ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [logs, levelFilter, search, sortCol, sortDir]);

  if (!fileName) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">BFF Log Viewer</h1>
          <p className="text-muted-foreground mb-8 text-center text-sm">
            Load a <code>.jsonl</code> log file to get started
          </p>
          <DropZone onLoad={handleLoad} />
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <header className="border-border flex items-center gap-3 border-b px-4 py-3">
        <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
        <span className="truncate text-sm font-medium">{fileName}</span>
        <span className="text-muted-foreground hidden text-xs sm:inline">
          {visible.length} / {logs.length} entries
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            title="Paste logs from clipboard"
            onClick={handlePasteFromHeader}
          >
            <Clipboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title="Close file"
            onClick={() => {
              setFileName(null);
              setLogs([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-2">
        {LEVELS.map((lvl) => {
          const count = lvl === 'all' ? logs.length : (levelCounts[lvl] ?? 0);
          const active = levelFilter === lvl;
          return (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                levelFilterVariant(lvl, active),
              )}
            >
              {lvl.toUpperCase()}
              <span className="rounded bg-current/10 px-1 opacity-70">{count}</span>
            </button>
          );
        })}
        <div className="relative w-full sm:ml-auto sm:w-auto">
          <Input
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn('h-8 w-full text-xs sm:w-56', search && 'pr-7')}
          />
          {search && (
            <button
              className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex cursor-pointer items-center px-2"
              onClick={() => setSearch('')}
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="hidden w-44 cursor-pointer text-xs whitespace-nowrap select-none sm:table-cell"
                onClick={() => handleSort('time')}
              >
                <span className="flex items-center">
                  Time <SortIcon col="time" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="w-24 cursor-pointer text-xs select-none"
                onClick={() => handleSort('level')}
              >
                <span className="flex items-center">
                  Level <SortIcon col="level" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="text-xs">Message</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-16 text-center text-sm">
                  No log entries match the current filter.
                </TableCell>
              </TableRow>
            )}
            {visible.map((entry) => {
              const expanded = expandedId === entry.id;
              const preview = messagePreview(entry);
              const level = (entry.level ?? 'unknown').toLowerCase();

              return (
                <React.Fragment key={entry.id}>
                  <TableRow
                    key={`row-${entry.id}`}
                    className={cn(
                      'cursor-pointer font-mono text-xs',
                      expanded && 'bg-muted/20 border-b-0',
                    )}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <TableCell className="text-muted-foreground hidden whitespace-nowrap sm:table-cell">
                      {formatTime(entry)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-semibold uppercase', levelVariant(level))}
                      >
                        {level}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="text-muted-foreground mb-0.5 block text-[10px] sm:hidden">
                        {formatTime(entry)}
                      </span>
                      <span className="block truncate" title={preview}>
                        {preview}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </TableCell>
                  </TableRow>
                  {expanded && <ExpandedRow key={`exp-${entry.id}`} entry={entry} colSpan={4} />}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
