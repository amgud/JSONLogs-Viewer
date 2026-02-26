export type LogLevel = "error" | "warn" | "info" | "debug" | "trace" | string

export interface LogEntry {
  id: number
  timestamp?: number
  time?: string
  level: LogLevel
  message?: unknown
  [key: string]: unknown
}

/**
 * Parses a JSONL string where each JSON object may span multiple lines.
 * Handles both compact (one-per-line) and pretty-printed JSONL.
 */
export function parseJsonl(text: string): LogEntry[] {
  const results: LogEntry[] = []
  const lines = text.split("\n")
  let buffer: string[] = []
  let depth = 0

  const flush = () => {
    if (!buffer.length) return
    const raw = buffer.join("\n").trim()
    if (!raw) return
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>
      results.push({ id: results.length, ...obj } as LogEntry)
    } catch {
      // skip unparseable chunk
    }
    buffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // blank line at top level → boundary between entries
    if (!trimmed) {
      if (depth === 0) {
        flush()
      }
      continue
    }

    buffer.push(line)

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i]
      // skip string contents to avoid counting braces inside strings
      if (ch === '"') {
        i++
        while (i < trimmed.length) {
          if (trimmed[i] === "\\" ) { i += 2; continue }
          if (trimmed[i] === '"') break
          i++
        }
        continue
      }
      if (ch === "{" || ch === "[") depth++
      else if (ch === "}" || ch === "]") depth--
    }

    if (depth === 0 && buffer.length > 0) {
      flush()
    }
  }

  flush()
  return results
}

/** Extract a short human-readable summary from a log entry's message field */
export function messagePreview(entry: LogEntry): string {
  const msg = entry.message
  if (msg === undefined || msg === null) {
    // fall back to other string fields
    const fallback =
      (entry["description"] as string) ||
      (entry["title"] as string) ||
      (entry["name"] as string) ||
      ""
    return fallback
  }
  if (typeof msg === "string") return msg
  if (typeof msg === "object") {
    const m = msg as Record<string, unknown>
    if (m["topic"] && m["type"]) {
      const payload = m["payload"] as Record<string, unknown> | undefined
      const trace = payload?.["stackTrace"] as string | undefined
      const firstLine = trace?.split("\n")[0] ?? ""
      return `[${m["topic"]}] ${m["type"]}${firstLine ? " — " + firstLine : ""}`
    }
    return JSON.stringify(msg).slice(0, 120)
  }
  return String(msg)
}
