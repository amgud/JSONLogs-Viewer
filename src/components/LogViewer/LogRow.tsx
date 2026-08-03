import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ExpandedRow } from './ExpandedRow';
import type { LogEntry } from './types';
import { formatTime, levelVariant, messagePreview } from './utils';

interface LogRowProps {
  entry: LogEntry;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
}

export function LogRow({ entry, expandedId, setExpandedId }: LogRowProps) {
  const expanded = expandedId === entry.id;
  const preview = messagePreview(entry);
  const level = (entry.level ?? 'unknown').toLowerCase();

  return (
    <>
      <TableRow
        key={`row-${entry.id}`}
        className={cn('cursor-pointer font-mono text-xs', expanded && 'bg-muted/30 border-b-0')}
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
    </>
  );
}
