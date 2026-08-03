import { Check, Copy, Maximize2, Minimize2, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { JsonHighlight } from './JsonHighlight';
import { StackTraceView } from './StackTrace';
import { type LogEntry, type StackTrace } from './types';
import { extractStackTraces } from './utils';

export function ExpandedRow({ entry, colSpan }: { entry: LogEntry; colSpan: number }) {
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
          <TabBar
            view={view}
            setView={setView}
            json={json}
            traces={traces}
            setFullscreen={setFullscreen}
          />
          <PanelContent view={view} json={json} traces={traces} />
        </TableCell>
      </TableRow>
      {fullscreen && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <div
              className="bg-background fixed inset-0 z-50 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <TabBar
                view={view}
                setView={setView}
                json={json}
                traces={traces}
                setFullscreen={setFullscreen}
                inFullscreen
              />
              <PanelContent view={view} inFullscreen json={json} traces={traces} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface TabBarProps {
  view: 'json' | 'trace';
  setView: React.Dispatch<React.SetStateAction<'json' | 'trace'>>;
  json: string;
  traces: StackTrace[];
  inFullscreen?: boolean;
  setFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

function TabBar({ view, setView, json, traces, inFullscreen, setFullscreen }: TabBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleCopyTrace = (trace: string) => {
    void navigator.clipboard.writeText(trace).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      className="border-border flex shrink-0 items-center gap-1 border-b px-3"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className={cn(
          '-mb-px cursor-pointer border-b-2 px-3 py-1.5 text-xs font-medium transition-colors',
          view === 'json'
            ? 'border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground border-transparent',
        )}
        onClick={() => setView('json')}
      >
        JSON
      </button>
      {traces.length > 0 && (
        <button
          className={cn(
            '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors',
            view === 'trace'
              ? 'border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}
          onClick={() => setView('trace')}
        >
          <Terminal className="h-3 w-3" />
          Stack Trace
        </button>
      )}
      <div className="ml-auto flex items-center gap-1 pb-1">
        {view === 'json' ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyJson();
            }}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy JSON
              </>
            )}
          </Button>
        ) : (
          traces.map(({ trace }, i) => (
            <Button
              key={i}
              size="sm"
              variant="ghost"
              className="h-6 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyTrace(trace);
              }}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          ))
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title={inFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          onClick={(e) => {
            e.stopPropagation();
            setFullscreen((f) => !f);
          }}
        >
          {inFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}

function PanelContent({
  view,
  inFullscreen,
  json,
  traces,
}: {
  view: 'json' | 'trace';
  inFullscreen?: boolean;
  json: string;
  traces: StackTrace[];
}) {
  return (
    <div
      className={cn('overflow-x-auto overflow-y-auto p-4', inFullscreen ? 'flex-1' : 'max-h-96')}
      onClick={(e) => e.stopPropagation()}
    >
      {view === 'json' ? (
        <JsonHighlight json={json} />
      ) : (
        traces.map(({ label, trace }, i) => (
          <div key={i}>
            {traces.length > 1 && (
              <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                {label}
              </p>
            )}
            <StackTraceView trace={trace} />
          </div>
        ))
      )}
    </div>
  );
}
