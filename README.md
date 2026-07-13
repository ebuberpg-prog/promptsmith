# MUSE — Prompt Studio

MUSE is a local-first workspace for turning an image idea into a deliberate, reusable prompt. It keeps the creator's original words editable, adds optional structured ingredients, formats the result for different image models, and stores the workspace on the current device.

[Open MUSE on GitHub Pages](https://ebuberpg-prog.github.io/promptsmith/)

## Product principles

- **Start with your words.** MUSE does not silently replace authored text.
- **Add structure only when useful.** Ingredients, formats, negatives, references, and Studio tools are optional.
- **Keep work retrievable.** Saved prompts have editable names, versions, favorites, search, sorting, and import/export.
- **Stay local by default.** The core prompt workflow needs no account or AI provider.
- **Make durability visible.** Draft state, backup/restore, storage status, diagnostics, and PWA updates are surfaced in the interface.

## The v1 workflow

1. **Describe** — Write the image in your own words on Home.
2. **Refine** — Continue in Craft, optionally adding taxonomy ingredients or Studio tools.
3. **Use or save** — Copy the formatted output or save the idea to the Library.

The first-prompt path teaches those steps in context. A separate Guided start is available when a more structured beginning is helpful.

## Features

### Craft

- Live authored-text editor and formatted output
- Prompt variables such as `{subject}` with live substitution
- Model and formatter profiles for Midjourney, Stable Diffusion, FLUX, GPT Image, and natural-language workflows
- Clear `What MUSE added` attribution for structured ingredients
- Optional prompt check across subject, setting, light, composition, and style
- Suggestions, variations, negatives, references, and format comparison under opt-in Studio tools
- Undo/redo, draft recovery, explicit save/update actions, and version history

### Library

- Saved prompts with human-friendly suggested titles
- Search across title, authored text, and ingredient labels
- Favorites, recent/name sorting, version counts, and ingredient counts
- Prompt import/export and complete workspace backup/restore
- Curated blueprint templates with preview-before-apply behavior
- Intent-led ingredient discovery with the complete taxonomy available as an advanced view
- Local reference-image collection

### Local-first and PWA

- IndexedDB persistence with verified migration from legacy local storage
- Fallback storage and recoverable-data handling when IndexedDB is unavailable
- Optional persistent-storage request
- Offline app shell, taxonomy, and built-in inspiration after the first successful load
- In-app update checks and safe service-worker updates
- Light and dark themes, responsive navigation, reduced-motion support, and accessible controls

### Optional AI connections

The core app works without AI. Explicit enhancement actions can connect to:

- Ollama
- LM Studio
- OpenAI-compatible endpoints
- Anthropic-compatible endpoints
- An optional browser gateway for compatible remote requests

Cloud API keys are kept in session storage, excluded from workspace persistence, and excluded from backups. Provider requests happen only after a connection test or an explicit AI action.

## Data and privacy

MUSE has no account system and does not include product analytics or telemetry. Drafts, prompts, versions, formatter profiles, preferences, and references are stored in the browser on the current device.

Clearing site data can remove that workspace. Use **Settings → Data → Export backup** before clearing browser data or moving devices. See [PRIVACY.md](PRIVACY.md) for the complete data-flow summary.

## Technology

| Area | Implementation |
| --- | --- |
| UI | React 18, TypeScript, Base UI, Tailwind CSS |
| Build | Vite 5 |
| State | Zustand |
| Durable storage | IndexedDB through `idb`, with local-storage fallback |
| Search | Fuse.js and a local taxonomy index |
| PWA | vite-plugin-pwa and Workbox |
| Unit/integration tests | Vitest |
| Browser/accessibility tests | Playwright and axe-core |

## Local development

### Requirements

- Node.js 24 LTS recommended; Node 22–26 supported by the repository engine range
- npm

```bash
git clone https://github.com/ebuberpg-prog/promptsmith.git
cd promptsmith
npm ci
npm run dev
```

The development server defaults to `http://localhost:5173/promptsmith/` because the production app is hosted from the `/promptsmith/` GitHub Pages path.

### Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:ui` | Open the Vitest UI |
| `npm run test:e2e` | Build, then run desktop and mobile Playwright release tests |

The browser release suite covers the core save/reopen flow, authored-text preservation, guided ingredient discovery, legacy migration, serious/critical accessibility findings, responsive behavior, and offline PWA reload.

## Project structure

```text
promptsmith/
├── .github/workflows/       # Pull-request CI and Pages deployment
├── public/
│   ├── inspiration/         # Responsive built-in visual references
│   └── taxonomy/            # Local YAML taxonomy
├── src/
│   ├── components/          # Product UI by feature
│   ├── data/                # Models, formatters, templates, mappings
│   ├── hooks/               # UI and persistence hooks
│   ├── services/            # Composition, AI, backup, analysis engines
│   ├── store/               # Zustand state, migration, IndexedDB adapter
│   └── utils/               # Search, taxonomy, PWA, template utilities
├── tests/e2e/               # Desktop/mobile release flows
├── USER_GUIDE.md
├── PRIVACY.md
├── SECURITY.md
└── RELEASE_CHECKLIST.md
```

## Architecture notes

### Persistence

The Zustand workspace is persisted asynchronously to IndexedDB. Legacy `localStorage` state is migrated, verified, and retained as a recovery backup before the new database becomes authoritative. Writes are debounced and flushed on page exit. Theme remains mirrored to local storage so the initial appearance can be restored quickly.

### Prompt composition

Authored text and structured ingredients remain separate in state. A formatter profile determines how they are combined for the target workflow. Saved Library versions are created only by explicit save/update actions; undo history and draft-recovery snapshots are separate mechanisms.

### Taxonomy

YAML files are loaded from the static deployment, cached in IndexedDB, normalized, and added to a local Fuse.js index. The default UI exposes intent-led discovery; the full taxonomy remains available without deleting categories or tags.

## GitHub Pages deployment

The Pages workflow runs on every push to `main`:

1. Install locked dependencies on Node 24.
2. Run lint and Vitest.
3. Install Chromium.
4. Build and run desktop/mobile Playwright release tests.
5. Upload `dist/` as the Pages artifact.
6. Deploy to the protected `github-pages` environment.

In **Repository Settings → Pages**, the source must be **GitHub Actions**. The configured production URL is:

```text
https://ebuberpg-prog.github.io/promptsmith/
```

The Vite base, manifest scope, icons, and inspiration paths currently target `/promptsmith/`. A repository rename, root-domain deployment, or custom domain requires updating those paths or making the base environment-driven.

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before tagging a release.

## Documentation

- [User guide](USER_GUIDE.md)
- [Privacy and data handling](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Release checklist](RELEASE_CHECKLIST.md)
- [Changelog](CHANGELOG.md)
- [Interface system](.interface-design/system.md)

## Contributing

Open an issue before a large behavioral change. Keep pull requests focused and run:

```bash
npm run lint
npm test
npm run test:e2e
```

Pull requests to `main` run the same release checks in GitHub Actions.

## License

[MIT](LICENSE)
