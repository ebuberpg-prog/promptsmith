# MUSE User Guide

MUSE helps you turn an image idea into a formatted prompt while keeping your original words visible, editable, and separate from the optional structure MUSE adds.

## The shortest path to a useful prompt

1. Open **Home**.
2. Describe the image in your own words.
3. Choose **Craft prompt**.
4. Review **What MUSE added** and the **Ready to use** output.
5. Copy the result, or save it to the Library.

For an empty Library, MUSE shows **Describe → Refine → Save** as lightweight orientation. It does not block or require any feature.

## Navigation

MUSE has three workspaces:

- **Home** — Start a prompt, continue a recent idea, or use inspiration and starting points.
- **Craft** — Edit authored text, manage ingredients, inspect output, and use optional refinement tools.
- **Library** — Find saved prompts, preview templates, browse ingredients, and manage references.

Desktop navigation appears in the header. Mobile navigation appears at the bottom. Search and the overflow menu remain in the header on both layouts.

## Home

### Start with your words

Write a concrete image description in the main field. MUSE may show related local taxonomy ingredients while you type. Choosing one adds structure; ignoring them leaves your text unchanged.

Use **Craft prompt** when you are ready to inspect the formatted result. The current formatter can be changed from the header control.

### Starting points and inspiration

- Example descriptions fill the authored-text field without saving anything.
- Starting points open Craft with an editable prompt.
- Built-in inspiration images can start a prompt or suggest a visual direction.
- **Guided start** opens a structured Subject → Style → Mood → Model sequence. It is optional and does not open automatically.

## Craft

### Your words

The authored prompt remains the source text you control. Edit it directly at any time. If it contains variables such as `{subject}`, MUSE shows inputs for their values while preserving the variable-bearing source.

Undo and redo operate on the current draft. Starting a new blank prompt clears the working draft and its Library link; it does not delete saved prompts.

### Ingredients

Ingredients are structured taxonomy tags that guide formatting. Each selected ingredient can be removed or adjusted without rewriting the authored prompt.

Choose **Find ingredients** to open the browser:

1. Start with Subject, Appearance, Setting, Style, Mood, or Quality.
2. Select a smaller category within that direction.
3. Search when you know the exact term.
4. Use **Browse complete taxonomy** only when you want the full hierarchy.

The complete taxonomy remains available. Guided discovery changes how it is presented, not which tags exist.

### What MUSE added

This section states how many structured ingredients affect the output and names the first few. Your authored words remain editable above it. If no ingredients are selected, the output preserves your text without adding taxonomy structure.

### Ready to use

The output is formatted for the selected formatter profile and model workflow. You can:

- Copy it to the clipboard.
- Save it as a new prompt.
- Update the active saved prompt.
- Add the draft as a version of another saved prompt.
- Create a duplicate or a variation from the prompt actions menu.

### Simple and Studio tools

**Simple** is the default and keeps writing, ingredients, and output central.

**Studio tools** reveals an accordion rail. Only one section opens at a time:

- **Prompt check** — Optional coverage guidance for subject, setting, lighting, composition, and style.
- **Suggestions** — Related local ingredients.
- **Variations** — Seeded or randomized ingredient changes that preserve authored words.
- **Negatives** — Model-aware negative-prompt help where the selected workflow supports it.
- **References** — Attach local visual context.
- **Compare formats** — Inspect how the same draft changes across formatter profiles.

### Optional AI enhancement

When an AI provider is connected, the enhancement panel can perform explicit actions such as refining text or analyzing a reference. MUSE does not call a provider merely because you typed or selected an ingredient.

## Saving and versions

### Save a new prompt

1. Choose **Save new prompt**.
2. Review the suggested short title.
3. Edit the title to match how you will remember the idea.
4. Confirm the save.

Suggested titles remove generic generation instructions and unresolved variable tokens when possible.

### Update a saved prompt

Opening a Library prompt links the current draft to it. MUSE shows whether the draft still matches the saved prompt. Use **Update prompt** to create an explicit saved version.

Undo history, draft-recovery snapshots, and Library versions are different:

- **Undo/redo** covers current editing actions.
- **Draft recovery** stores recent working snapshots on this device.
- **Library versions** are created by explicit save/update actions and remain attached to the saved prompt.

## Library

The Library has four sections.

### Prompts

- Search titles, authored text, and ingredient labels.
- Filter by **All prompts** or **Favorites**.
- Sort by recent use or name.
- Read model, version count, and ingredient count from each card.
- Choose **Open in Craft** to continue editing.
- Choose **Versions** to inspect, copy, edit, or delete an individual version.
- Use the card menu to duplicate, rename, export, or delete a saved prompt.
- Import a previously exported `.muse.json` prompt from the Library header.

Deleting a saved prompt removes that prompt and its local version history. It does not clear an unrelated current draft.

### Templates

Templates are curated blueprints rather than saved prompts.

- The default collection is curated; the complete catalog remains available.
- Preview a blueprint before it changes the draft.
- The preview shows purpose, anatomy, editable starter text, exact ingredient count, and model compatibility.
- **Apply here** keeps you in the Library; **Apply and continue in Craft** opens the result for editing.
- The template wizard builds a Subject → Mood → Medium → Review blueprint before applying it.

### Tags

This is the full ingredient-discovery experience described in the Craft section. Selecting tags here updates the current draft; it does not create or delete taxonomy records.

### References

References are stored locally in the current browser. Add supported images, review their local metadata, and use them from Craft. Large collections consume browser storage, so export a workspace backup before clearing site data.

## Search and commands

Open global search with the header search button or `Cmd/Ctrl + K`.

Search can find:

- Taxonomy ingredients
- Built-in templates
- Saved prompts
- Model presets
- Commands such as opening Home, Craft, or Library and starting a blank prompt

Use Up/Down to move through results, Enter to choose, and Escape to close.

## Settings

Open **Settings** from the desktop header or **Local connections and settings** from the overflow menu.

### General

- Choose filtered or complete taxonomy visibility for suggestions and randomization.
- Show or hide built-in inspiration.

### AI

- Configure and test Ollama or LM Studio.
- Configure OpenAI-compatible or Anthropic-compatible endpoints.
- Load available models after a successful connection test.
- Optionally use the browser gateway for OpenAI-compatible requests.

Cloud API keys are stored only for the browser session. They are not written into the durable workspace and are not included in backups.

### Formats

Review built-in formatter profiles and manage custom formatters. The active formatter controls output structure independently of the authored text.

### Data

- Inspect storage durability, draft state, and Library counts.
- Request persistent browser storage.
- Export a complete workspace backup.
- Restore by merging with current data or replacing it after a recovery snapshot.
- Export local diagnostics, optionally including the current prompt text.
- Check for and safely apply PWA updates.

Backups include drafts, saved prompts, versions, formatter profiles, references, covers, and preferences. They exclude AI credentials.

## Storage and offline behavior

MUSE stores the workspace in IndexedDB. If IndexedDB cannot be opened, it can use recoverable legacy storage and clearly reports the reduced durability.

The first successful online load installs the PWA shell and local assets. After that, tested core workflows can reload offline. Optional AI providers still require their corresponding local or network connection.

Browser storage is not the same as cloud sync. To move devices or protect against cleared site data, export a backup.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + K` | Open global search |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + Y` | Redo alternative |
| `/` | Focus ingredient search when the tag browser is open |
| `Escape` | Close search or clear focused ingredient search |

## Troubleshooting

### The app still shows an older version

Open **Settings → Data → App updates** and choose **Check now**. When an update is available, use **Update safely** so the draft is flushed before reload. A hard refresh can also request the newest deployment, but the in-app update path is safer for an active draft.

### The prompt library cannot load

Retry from the error screen. The taxonomy is a static part of the deployment and is cached after loading. If the issue persists, verify that the deployment base path is correct and that `taxonomy/*.yaml` requests succeed.

### Storage needs attention

Use **Retry** first. If IndexedDB remains unavailable, export recoverable data before continuing with legacy storage or changing browser privacy settings.

### A local AI provider will not connect

- Confirm the provider is running at the configured URL.
- Verify its model endpoint responds in the browser environment.
- Check provider CORS configuration.
- Use the browser gateway only for a compatible remote endpoint you trust.
- Remember that an installed PWA cannot make an offline cloud provider available.

### A saved idea is missing

Search the Library with words from the title, authored text, or ingredients. Clear the Favorites filter and sort by Recent. If browser data was cleared, restore the latest exported backup.

## More information

- [Privacy and data handling](PRIVACY.md)
- [Security policy](SECURITY.md)
- [Release history](CHANGELOG.md)
