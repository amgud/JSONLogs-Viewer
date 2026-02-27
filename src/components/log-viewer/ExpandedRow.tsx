import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Terminal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LogEntry } from "@/lib/parseJsonl"
import { extractStackTraces } from "./types"
import { JsonHighlight } from "./JsonHighlight"
import { StackTraceView } from "./StackTrace"

export function ExpandedRow({
  entry,
  colSpan,
}: {
  entry: LogEntry
  colSpan: number
}) {
  const [view, setView] = useState<"json" | "trace">("json")
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
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

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen])

  const tabBar = (inFullscreen: boolean) => (
    <div
      className="flex items-center gap-1 border-b border-border px-3 pt-2 shrink-0"
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
      <div className="ml-auto flex items-center gap-1 pb-1">
        {view === "json" ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              handleCopyJson()
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
                e.stopPropagation()
                handleCopyTrace(trace)
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
          title={inFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          onClick={(e) => {
            e.stopPropagation()
            setFullscreen((f) => !f)
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
  )

  const panelContent = (grow?: boolean) =>
    view === "json" ? (
      <div
        className={cn(
          "overflow-y-auto overflow-x-auto p-4",
          grow ? "flex-1" : "max-h-72"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <JsonHighlight json={json} />
      </div>
    ) : (
      <div
        className={cn(
          "overflow-y-auto overflow-x-auto p-4 space-y-4",
          grow ? "flex-1" : "max-h-96"
        )}
        onClick={(e) => e.stopPropagation()}
      >
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
    )

  return (
    <>
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={colSpan} className="p-0 max-w-0 w-full">
          {tabBar(false)}
          {panelContent()}
        </TableCell>
      </TableRow>
      {fullscreen && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <div
              className="fixed inset-0 z-50 flex flex-col bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              {tabBar(true)}
              {panelContent(true)}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
