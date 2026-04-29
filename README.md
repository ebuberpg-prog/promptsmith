# MUSE — Prompt Studio

> A local-first prompt workspace for AI image creators.

MUSE helps image creators **build, refine, organize, and adapt prompts** across models. It is a structured, intuitive prompt drafting studio — not an all-in-one generation lab. Built as a progressive web app (PWA), it runs locally in your browser and works offline after the first load.

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
- **Taxonomy-Powered Tag Browser** — Browse curated categories (subjects, styles, lighting, poses, environments, and more) via a fast, searchable interface.
- **Smart Search** — Fuzzy search across thousands of tags using Fuse.js with instant results.
- **Model-Aware Composition** — Formats prompts for the syntax of each target model (Midjourney parameters, Stable Diffusion weighting, prose mode for DALL-E 3, etc.).
- **Negative Prompt Helper** — Suggests contextual negative prompts to reduce artifacts, with per-model tailoring.

### Organization & Workflow
- **Templates Gallery** — Built-in and user-saved templates for rapid prompt scaffolding.
- **DNA Recipes** — Save and reload your favorite tag combinations as reusable "recipes" for characters, styles, moods, or environments.
- **Entity Presets** — Save named entities (characters, scenes, styles) and load them instantly into any prompt.

### Creative Tools
- **Randomizer Engine** — Break creative block with coherence-aware randomization across multiple modes and intensities.
- **Prompt Diff** — Compare two prompts at the semantic level to see exactly what changed.
- **Prompt Compression** — Intelligently shrink long prompts to fit within model token limits while preserving the most important elements.

### Integration & Extensibility
- **Local AI Integration (Optional)** — Connect to Ollama, LM Studio, OpenAI-compatible APIs, A1111 (AUTOMATIC1111), ComfyUI, and DrawThings for local or remote generation. These are **optional** — MUSE works fully as a prompt studio without them.
- **Reference Images** — Upload reference images to inform prompt building.
- **Command Palette** — Keyboard-driven quick access to features (`Cmd/Ctrl + K`).
- **Keyboard Shortcuts** — Shortcut coverage for common actions.
- **Dark & Light Themes** — Warm, editorial design system with comfortable contrast in both modes.

### Progressive Web App
- **Installable** — Add to home screen on mobile or desktop for a native app experience.
- **Auto-Update** — Service worker automatically prompts when a new version is deployed.

> **Note on offline support:** The app caches the taxonomy and shell locally. Large asset caching is a work in progress as we optimize bundle size.

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
│   ├── taxonomy/               # YAML taxonomy files
│   ├── favicon.ico
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── App.tsx                 # Root application shell
│   ├── main.tsx                # Entry point (PWA registration)
│   ├── index.css               # Global styles + CSS variables
│   ├── types/                  # Shared TypeScript types
│   ├── store/                  # Zustand stores
│   ├── components/             # React components (feature-organized)
│   ├── services/               # Business logic engines
│   ├── utils/                  # Utility functions
│   ├── hooks/                  # Custom React hooks
│   └── data/                   # Static data & configuration
├── cors-proxy/                 # CORS proxy worker for local AI APIs
├── vite.config.ts              # Vite + PWA configuration
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## Architecture Overview

### State Management
The app uses **Zustand** with the `persist` middleware to keep the session — selected tags, custom text, model choice, settings, recipes, and entities — stored in `localStorage`. History snapshots are managed separately to support undo/redo without polluting the main persisted state.

### Taxonomy System
Tags are loaded from static YAML files at runtime, cached via a custom `taxonomy-cache.ts` using IndexedDB (via `idb`), and indexed with Fuse.js for instant search. The taxonomy covers semantic categories with aliases, weights, descriptions, and explicit-content flags.

### Prompt Composition Pipeline
1. **Selection** — User picks tags from the taxonomy or templates.
2. **Weighting** — Tags carry implicit or custom weights.
3. **Model Formatting** — `prompt-composer.ts` transforms the tag list into the correct syntax for the chosen model.
4. **Negative Generation** — `negative-prompt-engine.ts` analyzes the positive prompt and appends model-appropriate negative terms.
5. **Compression** (optional) — `compression-engine.ts` can shrink the result to fit token limits.

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

- **TypeScript strict mode** is enabled.
- **Feature-based folders** — each major feature lives in its own directory.
- **Zustand selectors** — use atomic selectors to prevent unnecessary re-renders.
- **CSS Variables** — the design system is driven by CSS custom properties for instant theme switching.

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

Because the app is a static SPA with client-side routing, ensure your host supports fallback to `index.html` for deep links.

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
