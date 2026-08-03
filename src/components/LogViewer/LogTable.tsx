import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { LogRow } from './LogRow';
import { SortIcon } from './SortIcon';
import type { LogEntry, SortCol, SortDir } from './types';
import { entryTimestamp } from './utils';

interface LogTableProps {
  logs: LogEntry[];
}

export function LogTable({ logs }: LogTableProps) {
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('none');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [prevLogs, setPrevLogs] = useState(logs);

  if (logs !== prevLogs) {
    setPrevLogs(logs);
    setExpandedId(null);
  }

  const sorted = useMemo(() => {
    if (!sortCol || sortDir === 'none') return logs;
    return [...logs].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'time') {
        cmp = entryTimestamp(a) - entryTimestamp(b);
      } else {
        cmp = (a.level ?? '').localeCompare(b.level ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [logs, sortCol, sortDir]);

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

  return (
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
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-muted-foreground py-16 text-center text-sm">
              No log entries match the current filter.
            </TableCell>
          </TableRow>
        )}
        {sorted.map((entry) => (
          <LogRow
            key={entry.id}
            entry={entry}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        ))}
      </TableBody>
    </Table>
  );
}
