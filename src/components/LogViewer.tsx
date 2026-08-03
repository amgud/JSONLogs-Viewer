import { Clipboard, FileText, Moon, Sun, X } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { LogTable } from './LogViewer/LogTable';
import type { LogEntry, LevelFilter } from './LogViewer/types';
import {
  levelFilterVariant,
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

  const handleLoad = useCallback((text: string, name: string) => {
    const parsed = parseJsonl(text);
    setLogs(parsed);
    setFileName(name);
    setSearch('');
    setLevelFilter('all');
    setLogFileToStorage(parsed, name);
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // ignore if a text input is focused
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return;
      const text = e.clipboardData?.getData('text') ?? '';
      if (text.trim()) handleLoad(text, 'clipboard');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [fileName, handleLoad]);

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
    return filtered;
  }, [logs, levelFilter, search]);

  return (
    <div className="bg-background flex h-screen flex-col">
      {/* Header */}
      <header className="border-border flex items-center gap-3 border-b px-4 py-3">
        <FileText className="text-muted-foreground h-5 w-5 shrink-0" />
        <span className="truncate text-sm font-medium">{fileName}</span>
        <span className="text-muted-foreground hidden text-xs sm:inline">
          {visible.length} / {logs.length} entries
        </span>
        <div className="flex-1 text-center text-sm font-semibold">Logs Viewer</div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden text-xs sm:inline">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5"
            title="Paste logs from clipboard"
            onClick={handlePasteFromHeader}
          >
            <Clipboard className="h-3.5 w-3.5" />
            <span className="hidden text-xs sm:inline">Paste</span>
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

      {fileName ? <LogTable logs={visible} /> : <Welcome onLoad={handleLoad} />}
    </div>
  );
}
