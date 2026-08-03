import { Terminal, Check, Copy, Minimize2, Maximize2, Braces } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StackTrace, ViewType } from '../types';

interface ExpandedRowTabBarProps {
  view: ViewType;
  setView: React.Dispatch<React.SetStateAction<ViewType>>;
  json: string;
  traces: StackTrace[];
  inFullscreen?: boolean;
  setFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ExpandedRowTabBar({
  view,
  setView,
  json,
  traces,
  inFullscreen,
  setFullscreen,
}: ExpandedRowTabBarProps) {
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
          '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors',
          view === 'json'
            ? 'border-primary text-foreground'
            : 'text-muted-foreground hover:text-foreground border-transparent',
        )}
        onClick={() => setView('json')}
      >
        <Braces className="h-3 w-3" />
        JSON
      </button>
      {traces.map((trace, i) => (
        <button
          key={i}
          className={cn(
            '-mb-px flex cursor-pointer items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors',
            view === trace.type
              ? 'border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground border-transparent',
          )}
          onClick={() => setView(trace.type)}
        >
          <Terminal className="h-3 w-3" />
          {trace.label}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1 pb-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            if (view === 'json') handleCopyJson();
            else handleCopyTrace(traces.find((t) => t.type === view)?.trace || '');
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
