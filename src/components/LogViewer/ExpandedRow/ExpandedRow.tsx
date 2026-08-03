import { useState, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ViewType, LogEntry } from '../types';
import { extractStackTraces } from '../utils';
import { ExpandedRowContent } from './ExpandedRowContent';
import { ExpandedRowTabBar } from './ExpandedRowTabBar';

interface ExpandedRowProps {
  entry: LogEntry;
}

export function ExpandedRow({ entry }: ExpandedRowProps) {
  const [view, setView] = useState<ViewType>('json');
  const [fullscreen, setFullscreen] = useState(false);
  const traces = extractStackTraces(entry);

  const json = JSON.stringify(
    Object.fromEntries(Object.entries(entry).filter(([k]) => k !== 'id')),
    null,
    2,
  );

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  return (
    <ExpandedRowContainer fullscreen={fullscreen}>
      <ExpandedRowTabBar
        view={view}
        setView={setView}
        json={json}
        traces={traces}
        setFullscreen={setFullscreen}
      />
      <ExpandedRowContent view={view} json={json} traces={traces} />
    </ExpandedRowContainer>
  );
}

function ExpandedRowContainer({
  children,
  fullscreen,
}: {
  children: React.ReactNode;
  fullscreen: boolean;
}) {
  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={4} className="w-full max-w-0 p-0">
          {children}
        </TableCell>
      </TableRow>

      {fullscreen && (
        <div
          className="bg-background fixed inset-0 z-50 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </>
  );
}
