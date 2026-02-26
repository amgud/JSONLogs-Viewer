# Plan: Interactive JSONL Log Viewer with shadcn/ui

This builds a full-featured log viewer React app on the existing Vite + React 19 scaffold. Users drag-and-drop or pick a `.jsonl` file, which is parsed client-side. Logs are displayed in a filterable, searchable, sortable table with expandable rows and clipboard copy. shadcn/ui + Tailwind v4 provide the component library.

---

## Steps

### 1. Install Tailwind v4 + shadcn deps

Run `npm install tailwindcss @tailwindcss/vite` and `npm install -D @types/node`. Then install shadcn component packages: `npx shadcn@latest init` (selecting New York style, neutral base color, Tailwind v4).

### 2. Configure Vite

Update `vite.config.ts` to add the `@tailwindcss/vite` plugin and a `resolve.alias` for `@/` → `src/`.

### 3. Configure TypeScript paths

Add `"paths": { "@/*": ["./src/*"] }` and `"baseUrl": "."` to `tsconfig.app.json`.

### 4. Update CSS

Replace `src/index.css` with Tailwind v4 CSS directives (`@import "tailwindcss"` + shadcn CSS variables) and clear `src/App.css`.

### 5. Add shadcn components

Run `npx shadcn@latest add badge button input table card scroll-area separator tooltip` to scaffold components into `src/components/ui/`.

### 6. Create `src/lib/parseJsonl.ts`

A utility that reads a `.jsonl` string, parses each line as JSON (skipping empty lines/parse errors), and returns a typed `LogEntry[]` array. Fields: `id` (auto), `timestamp`, `time`, `level`, `message` (string or object), and all remaining fields as `meta`.

### 7. Create `src/components/LogViewer.tsx`

The main component:

- **File drop zone**: drag-and-drop + `<Input type="file">` button to load a `.jsonl` file
- **Toolbar**: level filter toggles (Badge buttons: ALL / ERROR / WARN / INFO), full-text search `<Input>`, and a log count summary
- **Table**: columns for Time, Level (colored `<Badge>`), Message (truncated), and an expand toggle — sortable on Time and Level via click on column header
- **Expanded row**: renders the full log entry as a pretty-printed JSON block with a "Copy" `<Button>` (clipboard API)
- **Empty / no-file states**: placeholder prompts

### 8. Update `src/App.tsx`

Replace the boilerplate with a plain `<LogViewer />` render (dark/light full-height layout).

---

## Verification

- `bun dev` — app loads, drag the provided `logs.jsonl` onto the drop zone, all 7 entries appear
- Clicking ERROR filter hides the 2 warn entries
- Typing "401" in search narrows to the relevant rows
- Clicking a row expands the full JSON; Copy button writes to clipboard
- Clicking the Time column header toggles sort order

---

## Decisions

- **Tailwind v4** (CSS-based config) over v3 — matches the Vite 8 beta setup already in place, and shadcn supports it natively now
- **Runtime file upload** over bundled asset — per your preference; no server/build changes needed for different log files
- **New York style** shadcn — more compact, suits a data-dense log viewer
