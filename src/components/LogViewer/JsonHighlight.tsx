import React from 'react';

// Tokenise a JSON string into coloured spans without any external library.
const JSON_RE =
  /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|( *"(?:[^"\\]|\\.)*")( *:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

export function JsonHighlight({ json }: { json: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const m of json.matchAll(JSON_RE)) {
    const start = m.index!;
    // plain text between matches (whitespace / newlines)
    if (start > last) parts.push(json.slice(last, start));
    last = start + m[0].length;

    const [full, , , str, colon, keyword, num, punct] = m;

    if (str !== undefined) {
      if (colon) {
        // object key
        parts.push(
          <span key={last} className="text-sky-300">
            {str}
          </span>,
        );
        parts.push(
          <span key={last + 'c'} className="text-muted-foreground">
            {colon}
          </span>,
        );
      } else {
        // string value
        parts.push(
          <span key={last} className="text-emerald-300">
            {full}
          </span>,
        );
      }
    } else if (keyword !== undefined) {
      parts.push(
        <span key={last} className="text-amber-400">
          {full}
        </span>,
      );
    } else if (num !== undefined) {
      parts.push(
        <span key={last} className="text-yellow-300">
          {full}
        </span>,
      );
    } else if (punct !== undefined) {
      parts.push(
        <span key={last} className="text-muted-foreground/70">
          {full}
        </span>,
      );
    } else {
      parts.push(full);
    }
  }
  if (last < json.length) parts.push(json.slice(last));

  return (
    <pre className="overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-relaxed whitespace-pre">
      {parts}
    </pre>
  );
}
