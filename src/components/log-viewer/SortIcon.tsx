import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import type { SortCol, SortDir } from "./types"

export function SortIcon({
  col,
  sortCol,
  sortDir,
}: {
  col: SortCol
  sortCol: SortCol | null
  sortDir: SortDir
}) {
  if (sortCol !== col || sortDir === "none")
    return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40" />
  return sortDir === "asc" ? (
    <ChevronUp className="ml-1 h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 h-3 w-3" />
  )
}
