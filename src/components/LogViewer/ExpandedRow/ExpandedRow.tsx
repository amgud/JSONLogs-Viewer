import { useState, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { type LogEntry } from '../types';
import { extractStackTraces } from '../utils';
import { ExpandedRowContent } from './ExpandedRowContent';
import { ExpandedRowTabBar } from './ExpandedRowTabBar';
interface ExpandedRowProps {
  entry: LogEntry;
  colSpan: number;
}

export function ExpandedRow({ entry, colSpan }: ExpandedRowProps) {
  const [view, setView] = useState<'json' | 'trace'>('json');
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
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={colSpan} className="w-full max-w-0 p-0">
          <ExpandedRowTabBar
            view={view}
            setView={setView}
            json={json}
            traces={traces}
            setFullscreen={setFullscreen}
          />
          <ExpandedRowContent view={view} json={json} traces={traces} />
        </TableCell>
      </TableRow>
      {fullscreen && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <div
              className="bg-background fixed inset-0 z-50 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <ExpandedRowTabBar
                view={view}
                setView={setView}
                json={json}
                traces={traces}
                setFullscreen={setFullscreen}
                inFullscreen
              />
              <ExpandedRowContent view={view} inFullscreen json={json} traces={traces} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
