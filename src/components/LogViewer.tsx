import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
  parseJsonl,
  messagePreview,
  type LogEntry,
  type LogLevel,
} from "@/lib/parseJsonl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Check,
  Clipboard,
  Copy,
  FileText,
  Terminal,
  Upload,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

type SortCol = "time" | "level"
type SortDir = "asc" | "desc"
type LevelFilter = "all" | LogLevel

const LEVELS: LevelFilter[] = ["all", "error", "warn", "info"]

function levelVariant(level: string) {
  switch (level.toLowerCase()) {
    case "error":
      return "text-red-400 bg-red-500/15 border-red-500/30"
    case "warn":
    case "warning":
      return "text-amber-400 bg-amber-500/15 border-amber-500/30"
    case "info":
      return "text-sky-400 bg-sky-500/15 border-sky-500/30"
    case "debug":
      return "text-violet-400 bg-violet-500/15 border-violet-500/30"
    default:
      return "text-muted-foreground bg-muted/50 border-border"
  }
}

function levelFilterVariant(level: LevelFilter, active: boolean) {
  if (!active) return "text-muted-foreground border-border hover:bg-muted/50"
  if (level === "all") return "bg-primary text-primary-foreground border-primary"
  return levelVariant(level)
}

function formatTime(entry: LogEntry): string {
  if (entry.time && typeof entry.time === "string") {
    try {
      const d = new Date(entry.time)
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`
    } catch {
      return entry.time
    }
  }
  if (entry.timestamp && typeof entry.timestamp === "number") {
    const d = new Date(entry.timestamp)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`
  }
  return "—"
}

function entryTimestamp(entry: LogEntry): number {
  if (entry.timestamp && typeof entry.timestamp === "number") return entry.timestamp
  if (entry.time && typeof entry.time === "string") return new Date(entry.time).getTime()
  return entry.id
}

function matchesSearch(entry: LogEntry, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return JSON.stringify(entry).toLowerCase().includes(q)
}

/** Collect all stack-trace strings from an entry (top-level + nested payload) */
function extractStackTraces(entry: LogEntry): { label: string; trace: string }[] {
  const out: { label: string; trace: string }[] = []

  // top-level .stack (e.g. warn entries)
  if (entry.stack && typeof entry.stack === "string") {
    out.push({ label: "Stack Trace", trace: entry.stack })
  }

  // message.payload.stackTrace (desl-service error entries)
  const msg = entry.message
  if (msg && typeof msg === "object") {
    const m = msg as Record<string, unknown>
    const payload = m["payload"] as Record<string, unknown> | undefined
    if (payload?.stackTrace && typeof payload.stackTrace === "string") {
      out.push({ label: "Downstream Stack Trace", trace: payload.stackTrace })
    }
  }

  // top-level .stackTrace
  if (entry.stackTrace && typeof entry.stackTrace === "string") {
    out.push({ label: "Stack Trace", trace: entry.stackTrace })
  }

  return out
}

// ---------------------------------------------------------------------------
// Stack trace syntax highlighting
// ---------------------------------------------------------------------------

function StackTraceLine({ line }: { line: string }) {
  const trimmed = line.trim()
  const indent = line.match(/^(\s*)/)?.[1] ?? ""

  if (!trimmed.startsWith("at ")) {
    // Error header: "ErrorType: message" or plain message
    const m = trimmed.match(/^([A-Za-z][\w.]*(?:Error|Exception|Warning)?)\s*:(.*)$/)
    if (m) {
      return (
        <span>
          <span className="font-semibold text-red-400">{m[1]}</span>
          <span className="text-amber-300">:{m[2]}</span>
        </span>
      )
    }
    return <span className="text-amber-300">{line}</span>
  }

  const rest = trimmed.slice(3) // drop "at "

  const isNodeInternal = rest.startsWith("node:") || /\(node:/.test(rest)
  const isVendor = rest.includes("node_modules/")

  const dim = isNodeInternal ? "opacity-25" : isVendor ? "opacity-45" : ""

  // "fnName (file:line:col)"
  const withFn = rest.match(/^(.+?)\s+\((.+):(\d+):(\d+)\)$/)
  if (withFn) {
    const [, fn, file, ln, col] = withFn
    const fileColor =
      isNodeInternal || isVendor ? "text-muted-foreground" : "text-emerald-400"
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
    )
  }

  // "file:line:col" (anonymous / top-level)
  const anon = rest.match(/^(.+):(\d+):(\d+)$/)
  if (anon) {
    const [, file, ln, col] = anon
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
    )
  }

  return (
    <span className={dim}>
      {indent}
      <span className="text-muted-foreground">at </span>
      <span className="text-muted-foreground">{rest}</span>
    </span>
  )
}

function StackTraceView({ trace }: { trace: string }) {
  const lines = trace.split("\n")
  return (
    <pre className="overflow-x-auto rounded-md bg-black/40 p-4 text-xs leading-6 font-mono">
      {lines.map((line, i) => (
        <div key={i}>
          <StackTraceLine line={line} />
        </div>
      ))}
    </pre>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIcon({
  col,
  sortCol,
  sortDir,
}: {
  col: SortCol
  sortCol: SortCol
  sortDir: SortDir
}) {
  if (sortCol !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  )
}

// ---------------------------------------------------------------------------
// DropZone
// ---------------------------------------------------------------------------

function DropZone({
  onLoad,
}: {
  onLoad: (text: string, name: string) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => onLoad(e.target?.result as string, file.name)
    reader.readAsText(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) readFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onLoad]
  )

  const handlePaste = async () => {
    setPasteError(null)
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setPasteError("Clipboard is empty")
        return
      }
      onLoad(text, "clipboard")
    } catch {
      setPasteError("Clipboard access denied — try Cmd+V in the page")
    }
  }

  // Also handle global Cmd+V / Ctrl+V on the drop-zone page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // ignore if a text input is focused
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return
      const text = e.clipboardData?.getData("text") ?? ""
      if (text.trim()) onLoad(text, "clipboard")
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [onLoad])

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="rounded-full border border-border bg-muted p-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          Drop a <code>.jsonl</code> file here
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or choose an option below
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Choose file
        </Button>
        <Button variant="outline" size="sm" onClick={handlePaste}>
          <Clipboard className="mr-2 h-4 w-4" />
          Paste logs
        </Button>
      </div>
      {pasteError && (
        <p className="text-xs text-destructive">{pasteError}</p>
      )}
      <p className="text-xs text-muted-foreground/60">
        or press <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">⌘V</kbd> anywhere on the page
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl,.txt,.log,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) readFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExpandedRow
// ---------------------------------------------------------------------------

function ExpandedRow({
  entry,
  colSpan,
}: {
  entry: LogEntry
  colSpan: number
}) {
  const [view, setView] = useState<"json" | "trace">("json")
  const [copied, setCopied] = useState(false)
  const traces = extractStackTraces(entry)

  const json = JSON.stringify(
    Object.fromEntries(Object.entries(entry).filter(([k]) => k !== "id")),
    null,
    2
  )

  const handleCopyJson = () => {
    void navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleCopyTrace = (trace: string) => {
    void navigator.clipboard.writeText(trace).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={colSpan} className="p-0">
        {/* Tab bar */}
        <div
          className="flex items-center gap-1 border-b border-border px-3 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className={cn(
              "px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              view === "json"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setView("json")}
          >
            JSON
          </button>
          {traces.length > 0 && (
            <button
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition-colors",
                view === "trace"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setView("trace")}
            >
              <Terminal className="h-3 w-3" />
              Stack Trace
            </button>
          )}
          {/* Copy button aligned right */}
          <div className="ml-auto pb-1">
            {view === "json" ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 gap-1 text-xs"
                onClick={handleCopyJson}
              >
                {copied ? (
                  <><Check className="h-3 w-3 text-green-400" />Copied</>
                ) : (
                  <><Copy className="h-3 w-3" />Copy JSON</>
                )}
              </Button>
            ) : (
              traces.map(({ trace }, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 text-xs"
                  onClick={() => handleCopyTrace(trace)}
                >
                  {copied ? (
                    <><Check className="h-3 w-3 text-green-400" />Copied</>
                  ) : (
                    <><Copy className="h-3 w-3" />Copy</>
                  )}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Panel content */}
        {view === "json" ? (
          <div className="max-h-64 overflow-y-auto overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            <pre className="p-4 text-xs leading-relaxed text-muted-foreground whitespace-pre">
              {json}
            </pre>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto overflow-x-auto p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            {traces.map(({ label, trace }, i) => (
              <div key={i}>
                {traces.length > 1 && (
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                )}
                <StackTraceView trace={trace} />
              </div>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Main LogViewer
// ---------------------------------------------------------------------------

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<SortCol>("time")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const handleLoad = useCallback((text: string, name: string) => {
    const parsed = parseJsonl(text)
    setLogs(parsed)
    setFileName(name)
    setExpandedId(null)
    setSearch("")
    setLevelFilter("all")
  }, [])

  // Global paste handler when logs are already loaded
  useEffect(() => {
    if (!fileName) return // handled by DropZone
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return
      const text = e.clipboardData?.getData("text") ?? ""
      if (text.trim()) handleLoad(text, "clipboard")
    }
    document.addEventListener("paste", onPaste)
    return () => document.removeEventListener("paste", onPaste)
  }, [fileName, handleLoad])

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  const handlePasteFromHeader = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) handleLoad(text, "clipboard")
    } catch {
      /* ignore */
    }
  }

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of logs) {
      const l = (entry.level ?? "unknown").toLowerCase()
      counts[l] = (counts[l] ?? 0) + 1
    }
    return counts
  }, [logs])

  const visible = useMemo(() => {
    let filtered = logs
    if (levelFilter !== "all") {
      filtered = filtered.filter(
        (e) => (e.level ?? "").toLowerCase() === levelFilter.toLowerCase()
      )
    }
    if (search) {
      filtered = filtered.filter((e) => matchesSearch(e, search))
    }
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortCol === "time") {
        cmp = entryTimestamp(a) - entryTimestamp(b)
      } else {
        cmp = (a.level ?? "").localeCompare(b.level ?? "")
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [logs, levelFilter, search, sortCol, sortDir])

  if (!fileName) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-lg">
          <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight">
            BFF Log Viewer
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Load a <code>.jsonl</code> log file to get started
          </p>
          <DropZone onLoad={handleLoad} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{fileName}</span>
        <span className="text-xs text-muted-foreground">
          {visible.length} / {logs.length} entries
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            title="Paste logs from clipboard"
            onClick={handlePasteFromHeader}
          >
            <Clipboard className="h-3.5 w-3.5" />
            Paste
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title="Close file"
            onClick={() => {
              setFileName(null)
              setLogs([])
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        {LEVELS.map((lvl) => {
          const count = lvl === "all" ? logs.length : (levelCounts[lvl] ?? 0)
          const active = levelFilter === lvl
          return (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                levelFilterVariant(lvl, active)
              )}
            >
              {lvl.toUpperCase()}
              <span className="rounded bg-current/10 px-1 opacity-70">{count}</span>
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Search logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-56 text-xs"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead
                className="w-44 cursor-pointer select-none whitespace-nowrap text-xs"
                onClick={() => handleSort("time")}
              >
                <span className="flex items-center">
                  Time{" "}
                  <SortIcon
                    col="time"
                    sortCol={sortCol}
                    sortDir={sortDir}
                  />
                </span>
              </TableHead>
              <TableHead
                className="w-24 cursor-pointer select-none text-xs"
                onClick={() => handleSort("level")}
              >
                <span className="flex items-center">
                  Level{" "}
                  <SortIcon
                    col="level"
                    sortCol={sortCol}
                    sortDir={sortDir}
                  />
                </span>
              </TableHead>
              <TableHead className="text-xs">Message</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  No log entries match the current filter.
                </TableCell>
              </TableRow>
            )}
            {visible.map((entry) => {
              const expanded = expandedId === entry.id
              const preview = messagePreview(entry)
              const level = (entry.level ?? "unknown").toLowerCase()

              return (
                <>
                  <TableRow
                    key={`row-${entry.id}`}
                    className={cn(
                      "cursor-pointer font-mono text-xs",
                      expanded && "border-b-0 bg-muted/20"
                    )}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatTime(entry)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase",
                          levelVariant(level)
                        )}
                      >
                        {level}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-0">
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
                  {expanded && (
                    <ExpandedRow
                      key={`exp-${entry.id}`}
                      entry={entry}
                      colSpan={4}
                    />
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>

    </div>
  )
}

