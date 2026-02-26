import { useState, useCallback, useMemo, useRef } from "react"
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
  Copy,
  FileText,
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SortIcon({ col, sortCol, sortDir }: { col: SortCol; sortCol: SortCol; sortDir: SortDir }) {
  if (sortCol !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />
  return sortDir === "asc"
    ? <ChevronUp className="ml-1 h-3 w-3" />
    : <ChevronDown className="ml-1 h-3 w-3" />
}

// ---------------------------------------------------------------------------
// DropZone
// ---------------------------------------------------------------------------

function DropZone({ onLoad }: { onLoad: (text: string, name: string) => void }) {
  const [dragging, setDragging] = useState(false)
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

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="rounded-full border border-border bg-muted p-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">Drop a <code>.jsonl</code> file here</p>
        <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Choose file
      </Button>
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

function ExpandedRow({ entry, colSpan }: { entry: LogEntry; colSpan: number }) {
  const [copied, setCopied] = useState(false)

  const json = JSON.stringify(entry, null, 2)

  const handleCopy = () => {
    // strip the synthetic `id` field we added
    const rest = Object.fromEntries(Object.entries(entry).filter(([k]) => k !== "id"))
    void navigator.clipboard.writeText(JSON.stringify(rest, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={colSpan} className="p-0">
        <div className="relative">
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-3 top-3 z-10 h-7 gap-1 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <><Check className="h-3 w-3 text-green-400" /> Copied</>
            ) : (
              <><Copy className="h-3 w-3" /> Copy</>
            )}
          </Button>
          <ScrollArea className="max-h-72">
            <pre className="overflow-auto p-4 pt-10 text-xs leading-relaxed text-muted-foreground">
              {json}
            </pre>
          </ScrollArea>
        </div>
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

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortCol(col)
      setSortDir("asc")
    }
  }

  // Level counts for badge labels
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const entry of logs) {
      const l = (entry.level ?? "unknown").toLowerCase()
      counts[l] = (counts[l] ?? 0) + 1
    }
    return counts
  }, [logs])

  // Filter + sort
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
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 shrink-0"
          title="Close file"
          onClick={() => { setFileName(null); setLogs([]) }}
        >
          <X className="h-4 w-4" />
        </Button>
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
              <span className="rounded bg-current/10 px-1 opacity-70">
                {count}
              </span>
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
                  Time <SortIcon col="time" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead
                className="w-24 cursor-pointer select-none text-xs"
                onClick={() => handleSort("level")}
              >
                <span className="flex items-center">
                  Level <SortIcon col="level" sortCol={sortCol} sortDir={sortDir} />
                </span>
              </TableHead>
              <TableHead className="text-xs">Message</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-sm text-muted-foreground">
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
                        className={cn("text-[10px] font-semibold uppercase", levelVariant(level))}
                      >
                        {level}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-0 truncate">
                      <span className="block truncate" title={preview}>
                        {preview}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expanded
                        ? <ChevronDown className="h-3.5 w-3.5" />
                        : <ChevronRight className="h-3.5 w-3.5" />
                      }
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <ExpandedRow key={`exp-${entry.id}`} entry={entry} colSpan={4} />
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
