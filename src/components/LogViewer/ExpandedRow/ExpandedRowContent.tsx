import { cn } from '@/lib/utils';
import { JsonHighlight } from '../JsonHighlight';
import { StackTraceView } from '../StackTrace';
import type { StackTrace } from '../types';

export function ExpandedRowContent({
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
      className={cn('overflow-x-auto overflow-y-auto p-2', inFullscreen ? 'flex-1' : 'max-h-96')}
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
