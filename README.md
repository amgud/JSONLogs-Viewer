# Log Viewer

A lightweight, browser-based viewer for structured `.jsonl` log files. Built with React, TypeScript, Tailwind CSS, and Vite. Installable as a PWA.

## Features

- **Drag & drop** or **paste** `.jsonl` log files to view them
- Filter logs by level (error, warn, info, debug, trace)
- Full-text search across log entries
- Sortable columns (time, level)
- Expandable rows with JSON detail view and stack trace rendering
- Dark / light theme toggle
- Logs persist in `sessionStorage` across reloads
- Installable as a Progressive Web App

## Getting Started

```sh
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun run bundle
```

## Scripts

| Command           | Description                 |
| ----------------- | --------------------------- |
| `bun dev`         | Start Vite dev server       |
| `bun run bundle`  | Type-check & build for prod |
| `bun run preview` | Preview production build    |
| `bun run lint`    | Lint with oxlint            |
| `bun run fmt`     | Format with oxfmt           |

## Tech Stack

- [React 19](https://react.dev) with React Compiler
- [Vite 8](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Base UI](https://base-ui.com)
- [Lucide Icons](https://lucide.dev)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app)
