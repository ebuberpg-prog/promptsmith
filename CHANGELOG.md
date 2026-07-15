# Changelog

All notable changes to MUSE are documented here.

## [1.0.2] — 2026-07-14

### Added

- Direct `Sample a missed color` correction from analyzed reference images
- Regression coverage for small accents, continuous tonal fields, and palette prominence

### Changed

- Replaced frequency-first RGB palette selection with perceptual OKLab clustering and accent-aware sampling
- Increased the local palette analysis surface from 128px to 384px
- Recalculate swatch prominence from every sampled opaque pixel
- Use border evidence when assigning palette ground roles

### Fixed

- Preserve visually important accent colors that were previously displaced by common background shades
- Report palette prominence against the complete image sample instead of selected color buckets

[1.0.2]: https://github.com/ebuberpg-prog/promptsmith/releases/tag/1.02

## [1.0.0] — 2026-07-13

### Added

- Home → Craft → Library product architecture
- Describe → Refine → Save first-prompt orientation
- Simple and Studio tool depths
- Clear attribution between authored words and MUSE-added ingredients
- Editable human-friendly suggested prompt titles
- Saved-prompt favorites, search, sorting, metadata, export, and version history
- Curated blueprint templates with preview-before-apply behavior
- Intent-led ingredient discovery with the complete taxonomy retained as an advanced view
- Prompt variables and custom formatter profiles
- IndexedDB workspace persistence, legacy migration, draft recovery, and durability status
- Complete workspace backup/restore and local diagnostics
- Local reference-image storage
- Optional Ollama, LM Studio, OpenAI-compatible, and Anthropic-compatible connections
- Session-only cloud API credentials excluded from persistence and backups
- Installable offline PWA with explicit safe-update controls
- Desktop/mobile Playwright release coverage, accessibility checks, migration checks, and offline reload coverage

### Changed

- Reorganized expert controls into collapsed Studio accordions
- Promoted Settings and local-data controls
- Increased supporting-text contrast and boundary clarity
- Reframed tag browsing around creative intent rather than the raw taxonomy hierarchy
- Made Library reuse the primary saved-prompt action
- Updated GitHub Pages CI to supported Node and GitHub Action versions

### Fixed

- Preserved authored text during ingredient variations
- Verified legacy state migration before IndexedDB becomes authoritative
- Added explicit storage failure and recovery paths
- Made long-running suggestion release evaluations reliable on GitHub-hosted runners

[1.0.0]: https://github.com/ebuberpg-prog/promptsmith/releases/tag/v1.0.0
