# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build locally
```

No test runner or linter is configured.

## Architecture

**Graphlet** is a client-side Mermaid diagram editor built with Nuxt 4 in SPA mode (`ssr: false`). There are two routes: `/` (editor) and `/embed` (read-only embeddable iframe view).

### State Management

All state lives in `composables/useEditorState.ts` as **module-level singletons** — the refs are declared at module scope, not inside the composable function. Every component calling `useEditorState()` shares the same reactive references. No Pinia or Vuex. All diagram content and UI state persist to `localStorage` via VueUse's `useLocalStorage`.

Key state: `code`, `themeId`, `title`, `eyebrow`, `badges`, `currentSvg`, `isSettingsOpen`, `isShareOpen`.

### Data Flow

```
pages/index.vue (split-pane shell)
├── TheToolbar.vue      — reads currentSvg for PNG export (SVG→canvas@2x), triggers share modal
├── TheEditor.vue       — Monaco editor, writes to `code` ref (localStorage)
├── ThePreview.vue      — watches [code, theme], calls mermaid.render() debounced 500ms, writes currentSvg
│   └── TheSettings.vue — floating panel, edits themeId and badges
└── TheShareModal.vue   — Teleported to <body>, uses useShareState
```

### Sharing System (`composables/useShareState.ts`)

State is encoded into the URL: serialize → JSON → Pako deflate → base64url → `?state=<encoded>`. The `/embed` page decodes this to render a read-only view with panzoom and a watermark.

### Theme System (`config/themes.ts`)

20 named themes as plain TypeScript objects. Each theme has tokens for `card`, `header`, `badge1`/`badge2`, `pill`/`pillActive`, and a `mermaid` object passed directly to `mermaid.initialize()` as `themeVariables`.

### Key Implementation Details

- Monaco registers a custom `mermaid` language with a Monarch tokenizer in `TheEditor.vue`
- The split pane divider position is stored in localStorage (`graphlet-split`, default 40%, clamped 20–80%), dragged via global `window` mouse events
- PNG export: `currentSvg` → offscreen `<canvas>` at 2× scale → PNG download
- Mermaid render debounce: 500ms in `ThePreview`, 200ms in `embed.vue`
