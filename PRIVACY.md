# MUSE privacy and data handling

Last updated: 2026-07-14

MUSE is designed as a local-first browser and desktop application. It has no account system and does not include product analytics, advertising trackers, or behavioral telemetry.

## Data stored on the device

MUSE can store the following in the current browser profile or Mac app-local data directory:

- Current authored text and selected ingredients
- Prompt variables, formatter choice, model parameters, and negative-prompt state
- Saved prompts and explicit version history
- Draft-recovery snapshots and undo-related state
- Favorites, pinned/recent ingredients, and preferences
- Custom formatter profiles
- Reference images and prompt covers
- Storage and backup metadata

In the PWA, workspace metadata is stored in IndexedDB and reference binaries are stored as IndexedDB Blobs. Theme, the small workspace registry, and recoverable legacy state may use local storage. In the Mac app, workspace metadata and the registry are stored in SQLite while reference binaries are regular app-local files. Cloud-provider API keys use session storage only.

## API credentials

Keys for OpenAI-compatible and Anthropic-compatible providers:

- Remain in the current browser session
- Are removed when the browser session ends or when cleared by the user
- Are not written into the IndexedDB workspace
- Are not included in prompt exports, complete backups, or diagnostics

Ollama and LM Studio normally use local URLs and do not require MUSE to store a key.

## Network requests

MUSE makes network requests in these situations:

1. **Application loading and updates** — GitHub Pages serves the PWA, taxonomy, built-in inspiration, manifest, and service-worker updates. The desktop bundle loads its application files locally.
2. **Provider connection tests** — A request is sent to the provider URL only after the user chooses a test/connect action.
3. **Explicit AI actions** — Prompt or image content is sent to the active provider only after the user invokes an AI feature.
4. **Optional browser gateway** — When enabled, compatible remote-provider requests can pass through the configured gateway. The gateway is not contacted for ordinary local drafting, taxonomy search, saving, or formatting.

Provider operators, gateway operators, hosting providers, browsers, and local-network services may keep their own logs under their respective policies. MUSE cannot control those systems.

## Backups, exports, and diagnostics

- Prompt exports contain the selected prompt/template data needed for reuse.
- Complete backups contain drafts, saved prompts, versions, formatter profiles, references, covers, and preferences.
- Diagnostics contain technical counts and state. Current prompt text is excluded unless the user explicitly includes it.
- None of these files include AI API keys.

Exported files are ordinary local files. Their protection becomes the user's responsibility after download.

## Data deletion

Users can delete individual prompts, versions, references, workspaces, and other Library records in the interface. Clearing site data removes PWA workspaces. Removing the Mac app's application-support data removes desktop workspaces. Because there is no MUSE account or cloud sync, deleted local data cannot be recovered unless an exported backup exists.

## Content visibility

Filtered taxonomy visibility changes what appears in suggestions and randomization. It does not transmit content and does not remove existing authored words or selected ingredients.

## Questions

For privacy or security concerns, use the repository's [private vulnerability reporting](https://github.com/ebuberpg-prog/promptsmith/security/advisories/new) for sensitive reports or open a public issue for non-sensitive documentation questions.
