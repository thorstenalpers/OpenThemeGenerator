<img src="src-tauri/icons/128x128.png" alt="" width="72" align="left" hspace="12" />

# OpenThemeGenerator

[![CI](https://github.com/thorstenalpers/OpenThemeGenerator/actions/workflows/ci.yml/badge.svg)](https://github.com/thorstenalpers/OpenThemeGenerator/actions/workflows/ci.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)

A desktop theme generator for shadcn — and for anything else that reads CSS custom properties.

Pick a seed colour, and the generator derives a complete light and dark palette: the shadcn token
set as `shadcn-svelte` and `shadcn/ui` ship it, plus `success`, `warning` and five chart slots.
Export it in the shape the target project already speaks, or describe the theme in words and let an
assistant write it.

## Why

Every project ends up with the same `--background: oklch(...)` block copied between repositories and
edited by hand until light and dark quietly disagree. This app owns that block: one recipe produces
both palettes, the contrast of every text pair is checked as you edit, and the export is a file you
drop in rather than a snippet you reconcile.

## What it does

- **A hundred and sixteen themes** — eighteen curated presets, sixty templates that pair a colour
  family with a sidebar design (weighted towards black and white, then blue and red, then the loud
  ones), eight aimed at a marketing page rather than a dashboard, and thirty published shadcn themes
  imported from the tweakcn registry and carried exactly as published. The gallery filters by
  source, tag and name, shows them two per row, one per row or as a detail list with multi-column
  sort (shift-click to add a tie-breaker), can drop a mode so one preview takes the whole card, and
  always puts the theme you are working on first whatever the sort says.
- **Twenty sidebar designs** — `shadcn`, `vercel`, `linear`, `notion`, `stripe`, `slack`, `rail`,
  `outline`, `docked`, `piano`, `brutalist`, `x`, the OS panes (`win11`, `macos`, `gnome`,
  `material`), and four with real relief: `keys` (raised ivory keys that press in when active),
  `neumorph`, `aqua` and `embossed`. The relief is box-shadow and a gradient only — no `filter`,
  no transform — so forty rows still composite in a single layer. The four have a preset each
  (Clavier, Pebble, Lagoon, Letterpress) and carry a `3d` tag derived from the style itself, so the
  gallery can filter to them rather than requiring you to know their names. Icons either inherit the
  text colour or keep their semantic defaults (blue for info, green for members, amber for settings).
  The sidebar is always on the left and always collapsible to the rail; the style changes what it
  looks like, never how it behaves. **The app's own navigation is the same component reading the
  same variables**, so what you see beside the editor and what you see around it cannot drift apart
  — with _dress the app in the edited theme_ on, the chrome is literally the theme being edited.
- **A generator, not a colour picker** — seed colour, chart harmony, contrast, sidebar tone, grey
  tint, accent tint and the two background lightnesses. Every token is derived; any token can be
  overruled by hand and reverted later.
- **Structure, not just colour** — density (spacing, type scale and header height as one knob),
  corner radius, border width, elevation, sidebar geometry and content width. All of it is emitted
  as custom properties, and in the Tailwind v4 export it is bridged into the framework's own
  scales, so `p-4`, `text-base` and `shadow-sm` follow the theme.
- **The theme in the space it is written in** — a third view puts every token where it actually
  lives in OKLCH: height is lightness, distance from the axis is chroma, angle around it is hue.
  Through it runs a cut of the sRGB gamut at the brand hue and its opposite — the shape every
  article about OKLCH draws by hand and none of them let you put your own colours inside. Move a
  slider and the spheres travel to their new places, which is the one view that answers _what did
  that actually do_. Turn it by dragging, zoom by scrolling, hover a sphere to name it. Three.js is
  loaded only when the view is opened, so the other pages never pay for it.
- **Contrast checked while you edit** — each surface/label pair shows its WCAG ratio the moment it
  falls below the 4.5:1 body text needs. Every theme this app generates — the curated ones and all
  sixty-eight templates — is held to that in a test; the imported ones are carried as published and
  the gallery labels the ones that fall short.
- **A preview that is a whole page, twice** — as an **app**: sidebar with a navigable submenu,
  header, stat cards, an area chart, a heatmap, a sortable and filterable TanStack table and a
  dialog. And as a **landing page**: a hero lit from the chart ramp, a gradient headline, a product
  shot, feature cards and a stats bar. Both are drawn at desktop size and scaled down, so the
  proportions are the ones that will ship, and the two loads find different weaknesses in the same
  tokens.
- **A studio that holds several themes at once** — each one you open is a tab, listed under Studio
  in the sidebar and named in the window title. Renaming a theme never hides where it came from:
  the heading keeps saying what it is based on, and an info button shows the final differences
  against what the tab was opened holding — recipe, layout and hand-set tokens — as JSON. **Reset**
  undoes all three at once, back to that same state.
- **Your own themes in the gallery** — save the open theme and it lands beside the built-ins, first
  in the list, filterable on its own and deletable. What is stored is the recipe, the structure and
  the tokens you overruled, not a flat palette, so reopening one leaves the sliders meaning
  something. Saving an edited built-in becomes its own entry rather than shadowing the original.
- **Six export formats** — see below.
- **An assistant** — describe the theme in prose, optionally attach a project folder, and the reply
  is parsed into a validated theme and opened in the studio. Or go the other way and **import a
  project**: it reads the look one already has — its stylesheet, its Tailwind config, whatever its
  team named their variables — and lands it on this token set. Adjust it, export it, and the project
  it came from can take it back.
- **A reference project** — `reference/`, a page with no framework at all, built on the plain-CSS
  export.

## Export formats

| Format               | Files                               | For                                                           |
| -------------------- | ----------------------------------- | ------------------------------------------------------------- |
| Tailwind v4 + shadcn | `app.css`                           | The current shadcn stack, `@theme inline` and all             |
| Preset class         | `themes/<id>.css`                   | A `themes.css` that already holds others; toggle `theme-<id>` |
| Tailwind v3 + shadcn | `globals.css`, `tailwind.config.js` | Projects still on v3, with colours split into HSL channels    |
| Plain CSS variables  | `theme.css`                         | No framework. Follows the system, `data-theme` overrides it   |
| shadcn registry item | `<id>.json`                         | `npx shadcn@latest add <url>` — installed rather than pasted  |
| TypeScript module    | `<id>.ts`                           | Anything that sets its colours from script                    |

Three options apply to all of them: OKLCH or hex, whether the non-shadcn `success` / `warning`
tokens are emitted at all, and whether a `README.md` is written alongside — the install steps for
that particular format, the files it just produced, and the structural decisions the palette does
not carry. It is a checkbox in the export dialog rather than a separate command, and it is on by
default: an exported stylesheet handed to a coding agent is far more useful with it than without.

## Using it in an existing project

For a SvelteKit + Tailwind v4 + shadcn-svelte app, the shortest path is the **preset class** export:

1. Export `themes/<id>.css` into `src/`.
2. `@import './themes/<id>.css';` from `app.css`, after `@import 'tailwindcss'`.
3. Toggle `theme-<id>` on `document.documentElement`, and suppress transitions across the swap —
   Chromium keeps painting the old colour on any element whose `transition` covers
   `background-color` when that colour comes from a custom property changed on an ancestor.

For a project with no design system at all, take the **plain CSS variables** export and read
`var(--background)`. `reference/` is a working example of exactly that.

## The assistant

Two transports, chosen in Settings:

- **The local `claude` binary** — runs Claude Code on this machine. Nothing leaves it that the
  binary does not already send.
- **api.anthropic.com** — the key lives in the Windows Credential Manager, written once and never
  read back into the window.

Attaching a project folder scans it for the files that decide its colours — `components.json`,
`package.json`, the Tailwind config, and the stylesheets that declare tokens — capped at twelve
files and 48 KB, with generated and vendored folders skipped. The scan's one-line verdict ("shadcn
is installed; Tailwind v4; existing tokens are written in OKLCH") goes into the prompt with them, so
the answer fits the project rather than a guess about it.

**Import** uses the same scan under a different brief: extract, do not design. Use the values that
are there, map the project's own naming onto the token set, derive only what is genuinely absent and
say which ones those were — and if a project has no theme worth reading, say so rather than invent a
brand colour. No conversation history goes with it, so the answer depends on the project rather than
on what was asked five turns ago. It starts from the gallery as well as the assistant, and what
comes back is saved there under the folder's name.

Most Svelte projects are not shadcn projects, so the scan does not only look for a dozen known
filenames. It takes any stylesheet, and where a project has none it reads the components that
actually paint something — a `.svelte` file with a `<style>` block that sets a colour. One with no
style block, or a style block that only lays things out, does not take a slot.

Nothing else in the app reaches the network. The gallery, including the thirty imported shadcn
themes, is checked into the repository and read from disk; the only outbound request in the whole
program is the hosted assistant, and the local binary is the default.

## Development

You need **Node 22**, a **Rust toolchain**, and on Windows the **WebView2 runtime** — which ships
with Windows 11 and every recent 10. Nothing else: the icons, the reference stylesheet and the
imported theme list are all produced by scripts in this repository rather than fetched at build
time.

```bash
npm install
npm run dev
```

`npm run dev` serves the UI in a plain browser with a stub host: every view works, and the commands
that touch disk say so instead of pretending. It exists so that iterating on the interface costs a
hot reload rather than a Rust build, and it is loaded behind `import.meta.env.DEV` — a built app has
a real host by definition, and carrying a fake one it can never reach is how a second code path
starts drifting from the first. For the real thing:

```bash
npm run start
```

| Command                                             | What it does                                             |
| --------------------------------------------------- | -------------------------------------------------------- |
| `npm run check`                                     | `svelte-check` against the app tsconfig                  |
| `npm run lint`                                      | prettier and eslint                                      |
| `npm run format`                                    | writes the formatting rather than checking it            |
| `npm test`                                          | vitest — colour maths, the generator, and every exporter |
| `npm run build`                                     | the static front end                                     |
| `npm run app:build`                                 | the NSIS installer                                       |
| `npm run icons`                                     | regenerates the icon set from `scripts/make-icons.mjs`   |
| `npm run reference:theme`                           | rewrites `reference/theme.css` from a built-in preset    |
| `cargo test --manifest-path src-tauri/Cargo.toml`   | the host's own tests                                     |
| `cargo clippy --manifest-path src-tauri/Cargo.toml` | the lints CI fails on                                    |

## Contributing

`main` is protected: changes arrive as a pull request, and CI has to be green before it can merge.
The workflow runs the table above — lint, types, tests and build on Linux, and `cargo fmt`,
`clippy` and the host's tests on Windows, where the app actually ships.

Two things the tests care about more than style:

- **Every theme this app derives clears 4.5:1** on every surface/label pair, in both modes. So does
  `app.css`, the window's own chrome, which has its own test because the generator cannot keep it
  honest. Imported themes are exempt — they are other people's designs, carried as published, and
  the gallery reports what they score instead of retinting them.
- **Nothing reaches the network at runtime.** The imported theme list is generated into the
  repository by `scripts/fetch-registry-themes.mjs` and read from disk.

## Licence

[MIT](LICENSE).
