import { Clipboard, FileText, Moon, Sun, X } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { LogRow } from './LogViewer/LogRow';
import { SortIcon } from './LogViewer/SortIcon';
import type { LogEntry, LevelFilter, SortCol, SortDir } from './LogViewer/types';
import {
  levelFilterVariant,
  entryTimestamp,
  matchesSearch,
  parseJsonl,
  LEVELS,
  clearLogFileFromStorage,
  getLogFileFromStorage,
  setLogFileToStorage,
} from './LogViewer/utils';
import { Welcome } from './LogViewer/Welcome';

export function LogViewer() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [logFile] = useState(getLogFileFromStorage());
  const [logs, setLogs] = useState<LogEntry[]>(logFile?.logs ?? []);
  const [fileName, setFileName] = useState<string | null>(logFile?.name ?? null);
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
    setLogFileToStorage(parsed, name);
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

  const handleCloseFile = () => {
    setLogs([]);
    setFileName(null);
    setExpandedId(null);
    setSearch('');
    setLevelFilter('all');
    clearLogFileFromStorage();
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
    return <Welcome onLoad={handleLoad} toggleTheme={toggleTheme} theme={theme} />;
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
            onClick={handleCloseFile}
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
            {visible.map((entry) => (
              <LogRow
                key={entry.id}
                entry={entry}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
              />
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
