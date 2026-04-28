# MUSE — Prompt Studio

> The most comprehensive AI image generation prompt builder.

MUSE (codenamed *PromptSmith*) is a professional-grade, unfiltered, open-source prompt engineering studio for AI image generation. Built as a progressive web app (PWA), it gives creators, designers, and AI artists a structured, intuitive way to craft, refine, and manage complex prompts across every major image generation model — from Midjourney and Stable Diffusion to DALL-E 3, Flux, Ideogram, and beyond.

---

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Prompt Building
- **Taxonomy-Powered Tag Browser** — Browse 20+ curated categories (subjects, styles, lighting, poses, environments, facial features, props, fantasy elements, and more) via a fast, searchable interface.
- **Smart Search** — Fuzzy search across thousands of tags using Fuse.js with instant results.
- **Model-Aware Composition** — Automatically formats prompts for the specific syntax of each target model (Midjourney parameters, Stable Diffusion weighting, prose mode for DALL-E 3, etc.).
- **Negative Prompt Intelligence** — Analyzes your positive prompt and suggests contextual negative prompts to reduce artifacts, with per-model tailoring.

### Organization & Workflow
- **Templates Gallery** — Built-in and user-saved templates with slot-based structures for rapid prompt scaffolding.
- **DNA Recipes** — Save and reload your favorite tag combinations as reusable "recipes" for characters, styles, moods, or environments.
- **Version History** — Full undo/redo with persistent version snapshots, so you can experiment fearlessly.
- **Entity Presets** — Save named entities (characters, scenes, styles) and load them instantly into any prompt.
- **Batch Generation** — Define variable placeholders and generate every permutation of a base prompt automatically.
- **A/B Testing** — Compare two prompt variants side-by-side with metrics tracking.

### Creative Tools
- **Randomizer Engine** — Break creative block with coherence-aware randomization across multiple modes and intensities, with optional vibe and story-seed locking.
- **Style Transfer Matrix** — Analyze compatibility between source and target style tags before committing.
- **Prompt Mutation** — Generate systematic variations (style shift, weight adjust, synonym swap, composition change, negative addition) from any existing prompt.
- **Prompt Diff** — Compare two prompts at the semantic level to see exactly what changed and how significant each change is.
- **Prompt Compression** — Intelligently shrink long prompts to fit within model token limits while preserving the most important elements.

### Integration & Extensibility
- **Local AI Integration** — Connect to Ollama, LM Studio, OpenAI-compatible APIs, A1111 (AUTOMATIC1111), ComfyUI, and DrawThings for local or remote generation.
- **Reference Images** — Upload reference images to extract visual tags, analyze composition, and inform prompt building.
- **Command Palette** — Keyboard-driven quick access to every feature (`Cmd/Ctrl + K`).
- **Keyboard Shortcuts** — Full shortcut coverage for power users.
- **Dark & Light Themes** — Warm, editorial design system inspired by Cursor, with comfortable contrast in both modes.

### Progressive Web App
- **Offline-First** — Full offline support via Workbox; the entire taxonomy, app shell, and assets are cached locally.
- **Installable** — Add to home screen on mobile or desktop for a native app experience.
- **Auto-Update** — Service worker automatically prompts when a new version is deployed.

---

## Demo

Live deployment is powered by GitHub Pages:

🔗 **[https://ebuberpg-prog.github.io/promptsmith](https://ebuberpg-prog.github.io/promptsmith)** 

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 + custom CSS variables |
| State Management | Zustand (with persistence middleware) |
| Animation | Framer Motion |
| Icons | Phosphor Icons + Lucide React |
| Search | Fuse.js |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest + @vitest/ui |
| Linting | ESLint + TypeScript ESLint |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or compatible package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/ebuberpg-prog/promptsmith.git
cd promptsmith

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/`.

### Build for Production

```bash
npm run build
```

Static output is written to `dist/` and ready for any static host.

---

## Project Structure

```
promptsmith/
├── public/                     # Static assets
│   ├── taxonomy/               # YAML taxonomy files (20+ categories)
│   │   ├── subjects.yaml
│   │   ├── clothing.yaml
│   │   ├── lighting.yaml
│   │   ├── poses_gestures.yaml
│   │   ├── environments.yaml
│   │   ├── art_medium.yaml
│   │   ├── mood_emotion.yaml
│   │   ├── fantasy_elements.yaml
│   │   ├── negative_prompts.yaml
│   │   └── ...
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── App.tsx                 # Root application shell
│   ├── main.tsx                # Entry point (PWA registration)
│   ├── index.css               # Global styles + CSS variables
│   ├── types/                  # Shared TypeScript types
│   │   └── index.ts
│   ├── store/                  # Zustand stores
│   │   ├── prompt-store.ts     # Main application state
│   │   └── history-store.ts    # Undo/redo snapshot management
│   ├── components/             # React components (feature-organized)
│   │   ├── layout/             # Header, Sidebar, BottomTabBar
│   │   ├── tags/               # SmartTagBrowser, TagChip, QuickAccessBar
│   │   ├── templates/          # TemplateGallery, TemplateWizard
│   │   ├── prompt/             # PromptOutput, TagSuggestions
│   │   ├── negative/           # NegativePromptIntelligence
│   │   ├── randomizer/         # RandomizerPanel
│   │   ├── dna/                # PromptDNA, DNARecipeManager
│   │   ├── versions/           # VersionHistory
│   │   ├── diff/               # PromptDiff
│   │   ├── style/              # StyleTransferMatrix
│   │   ├── batch/              # BatchGeneration
│   │   ├── abtest/             # ABTesting
│   │   ├── reference/          # ReferenceUploader
│   │   ├── entities/           # EntityPresets
│   │   ├── command/            # CommandPalette
│   │   ├── settings/           # AISettingsPanel
│   │   ├── onboarding/         # QuickStartWizard
│   │   ├── ai/                 # LMPromptEnhancer
│   │   └── skeleton/           # Loading skeletons
│   ├── services/               # Business logic engines
│   │   ├── prompt-composer.ts
│   │   ├── negative-prompt-engine.ts
│   │   ├── randomizer-engine.ts
│   │   ├── mutation-engine.ts
│   │   ├── style-compat-engine.ts
│   │   ├── prompt-diff-engine.ts
│   │   ├── compression-engine.ts
│   │   ├── image-gen-service.ts
│   │   └── local-ai-service.ts
│   ├── utils/                  # Utility functions
│   │   ├── taxonomy-loader.ts
│   │   ├── taxonomy-cache.ts
│   │   ├── tag-index.ts
│   │   └── template-engine.ts
│   ├── hooks/                  # Custom React hooks
│   │   ├── useBreakpoint.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useCommandPalette.ts
│   │   └── useSafeArea.ts
│   └── data/                   # Static data & configuration
│       ├── model-configs.ts
│       ├── randomizer-modes.ts
│       ├── randomizer-vibes.ts
│       ├── randomizer-slots.ts
│       ├── tag-relationships.ts
│       ├── category-colors.ts
│       └── wizard-mappings.ts
├── cors-proxy/                 # CORS proxy worker for local AI APIs
│   └── worker.ts
├── .github/workflows/          # CI/CD
│   └── deploy.yml              # GitHub Pages deployment
├── vite.config.ts              # Vite + PWA configuration
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Architecture Overview

### State Management
The app uses **Zustand** with the `persist` middleware to keep the entire session — selected tags, custom text, model choice, settings, recipes, entities, and version history — stored in `localStorage`. History snapshots are managed separately to support undo/redo without polluting the main persisted state.

### Taxonomy System
Tags are loaded from static YAML files at runtime, cached via a custom `taxonomy-cache.ts` using IndexedDB (via `idb`), and indexed with Fuse.js for instant search. The taxonomy covers 20+ semantic categories and thousands of individual tags with aliases, weights, descriptions, and explicit-content flags.

### Prompt Composition Pipeline
1. **Selection** — User picks tags from the taxonomy or templates.
2. **Weighting** — Tags carry implicit or custom weights.
3. **Model Formatting** — `prompt-composer.ts` transforms the tag list into the correct syntax for the chosen model (comma-separated tags, Midjourney parameters, prose sentences, weight brackets, etc.).
4. **Negative Generation** — `negative-prompt-engine.ts` analyzes the positive prompt and appends model-appropriate negative terms.
5. **Compression** (optional) — `compression-engine.ts` can shrink the result to fit token limits.

### Responsive Layout
- **Desktop**: Two-panel layout — main workspace on the left, prompt inspector sidebar on the right.
- **Tablet**: Collapsible sidebar, adaptive grids.
- **Mobile**: Bottom-tab navigation with contextual panels (Templates → Build → Prompt).

---

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all TS/TSX files |
| `npm test` | Run Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:ui` | Open Vitest UI for interactive testing |

### Code Conventions

- **TypeScript strict mode** is enabled — all components and utilities are fully typed.
- **Feature-based folders** — each major feature lives in its own directory under `src/components/` and `src/services/`.
- **Zustand selectors** — use atomic selectors to prevent unnecessary re-renders.
- **CSS Variables** — the design system is driven by CSS custom properties (`--ui-bg`, `--ui-text`, `--ui-border`, etc.) for instant theme switching.

---

## Testing

Tests are co-located with source files under `src/services/__tests__/` and run with **Vitest**.

```bash
# Run all tests
npm test

# Interactive UI
npm run test:ui

# Watch mode during development
npm run test:watch
```

Current test coverage includes:
- Prompt composition logic
- Negative prompt generation
- Mutation engine variations
- Style compatibility analysis
- Prompt diff calculation
- Compression strategies

---

## Deployment

### GitHub Pages (Default)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on every push to `main`.

1. Go to **Settings → Pages** in your GitHub repository.
2. Set the source to **GitHub Actions**.
3. Push to `main` — the site will be live at `https://<username>.github.io/promptsmith/`.

### Manual Deploy to Any Static Host

```bash
npm run build
# Upload the contents of `dist/` to your host
```

Because the app is a static SPA with client-side routing, ensure your host supports fallback to `index.html` for deep links (GitHub Pages handles this automatically via `404.html` generation if configured; otherwise, use hash-based routing or host rules).

---

## Roadmap

- [ ] **Community Gallery** — Share and discover public prompts and DNA recipes.
- [ ] **Cloud Sync** — Optional backend for cross-device synchronization.
- [ ] **Plugin System** — Third-party taxonomy packs and custom model configs.
- [ ] **Image Grid** — Built-in viewer for batch generation results.
- [ ] **Prompt Evaluation** — Automated scoring against reference images (CLIP-based).
- [ ] **Multi-language Taxonomy** — i18n support for tag labels and descriptions.

---

## Contributing

Contributions are welcome! Please open an issue first to discuss large changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Taxonomy Categories

1. Create a new YAML file in `public/taxonomy/` following the existing schema.
2. Add the file to the loader manifest in `src/utils/taxonomy-loader.ts`.
3. Add a category color mapping in `src/data/category-colors.ts` if needed.
4. Run the app and verify search indexing works.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  <sub>Built with care for the AI art community.</sub>
</p>
