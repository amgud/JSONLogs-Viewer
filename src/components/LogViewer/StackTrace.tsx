// ---------------------------------------------------------------------------
// Stack trace syntax highlighting
// ---------------------------------------------------------------------------

function StackTraceLine({ line }: { line: string }) {
  const trimmed = line.trim();
  const indent = line.match(/^(\s*)/)?.[1] ?? '';

  if (!trimmed.startsWith('at ')) {
    // Error header: "ErrorType: message" or plain message
    const m = trimmed.match(/^([A-Za-z][\w.]*(?:Error|Exception|Warning)?)\s*:(.*)$/);
    if (m) {
      return (
        <span>
          <span className="font-semibold text-red-400">{m[1]}</span>
          <span className="text-amber-300">:{m[2]}</span>
        </span>
      );
    }
    return <span className="text-amber-300">{line}</span>;
  }

  const rest = trimmed.slice(3); // drop "at "

  const isNodeInternal = rest.startsWith('node:') || /\(node:/.test(rest);
  const isVendor = rest.includes('node_modules/');

  const dim = isNodeInternal ? 'opacity-25' : isVendor ? 'opacity-45' : '';

  // "fnName (file:line:col)"
  const withFn = rest.match(/^(.+?)\s+\((.+):(\d+):(\d+)\)$/);
  if (withFn) {
    const [, fn, file, ln, col] = withFn;
    const fileColor = isNodeInternal || isVendor ? 'text-muted-foreground' : 'text-emerald-400';
    return (
      <span className={dim}>
        {indent}
        <span className="text-muted-foreground">at </span>
        <span className="text-sky-300">{fn}</span>
        <span className="text-muted-foreground"> (</span>
        <span className={fileColor}>{file}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400">{ln}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400/50">{col}</span>
        <span className="text-muted-foreground">)</span>
      </span>
    );
  }

  // "file:line:col" (anonymous / top-level)
  const anon = rest.match(/^(.+):(\d+):(\d+)$/);
  if (anon) {
    const [, file, ln, col] = anon;
    return (
      <span className={dim}>
        {indent}
        <span className="text-muted-foreground">at </span>
        <span className="text-emerald-400">{file}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400">{ln}</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-yellow-400/50">{col}</span>
      </span>
    );
  }

  return (
    <span className={dim}>
      {indent}
      <span className="text-muted-foreground">at </span>
      <span className="text-muted-foreground">{rest}</span>
    </span>
  );
}

export function StackTraceView({ trace }: { trace: string }) {
  const lines = trace.split('\n');
  return (
    <pre className="overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-6 whitespace-pre">
      {lines.map((line, i) => (
        <div key={i}>
          <StackTraceLine line={line} />
        </div>
      ))}
    </pre>
  );
}
