# MUSE Prompt Studio interface system

## Direction and feel

MUSE is a private creative workbench for people turning an image idea into a deliberate, reusable prompt. It should feel like an editorial studio notebook: calm, exact, tactile, and quietly premium. The interface should help someone inspect creative decisions without becoming a technical dashboard.

Domain language: craft, blueprint, prompt anatomy, ingredients, references, variables, composition, light, medium, constraints, and studio refinement.

Signature pattern: expose every reusable prompt as a **blueprint** with a distinct visual reference, editable starter prompt, named anatomy, and exact taxonomy ingredients. The person should understand what will be applied before entering Craft.

Avoid generic dashboard conventions:

- Do not lead with undifferentiated card grids; lead with curated, inspectable blueprints.
- Do not apply a template immediately from its card; open a useful preview first.
- Do not hide prompt structure behind tags alone; show human-readable anatomy alongside exact ingredients.
- Do not resolve taxonomy by fuzzy label matching; store and apply exact tag IDs.

## Color and surfaces

Use the existing warm paper-and-ink tokens from `src/index.css`. All component colors must resolve through the `--ui-*` primitives.

- Canvas: `--ui-bg`
- Inset/editable areas: `--ui-surface-soft`
- Quiet raised sections: `--ui-surface-elevated`
- Primary ink/action: `--ui-text`
- Supporting text: `--ui-muted-text`
- Metadata: `--ui-muted-text-faint`
- Standard, hover, strong, and faint boundaries: the corresponding `--ui-border*` tokens

Color communicates hierarchy and state, not decoration. Selected controls invert ink and paper (`--ui-text` background with `--ui-bg` text). Keep imagery expressive; keep interface chrome restrained.

## Depth strategy

Use borders and subtle surface shifts as the default depth system. Standard cards, filters, anatomy cells, and inputs use quiet borders without decorative shadows. Reserve one restrained shadow for true overlay surfaces such as dialogs. Backdrops use `--ui-overlay`.

Inputs should feel inset using `--ui-surface-soft`. Raised library summaries may use `--ui-surface-elevated`. Avoid gradients, colored card backgrounds, thick borders, and repeated drop shadows.

## Typography

- Display/editorial headings: `font-display` (Playfair Display), normal weight, balanced wrapping.
- Controls and body copy: the existing application sans-serif.
- Eyebrows, anatomy terms, and ingredient counts: small uppercase text, usually 10–12px, medium weight.
- Prompt text: 14px with approximately 24px line height and pretty wrapping.
- Use weight, case, and spacing with size to establish hierarchy; do not rely on font size alone.

## Spacing and shape

Base spacing unit: **4px**. Prefer the established 8, 12, 16, 20, 24, and 32px increments.

- Icon/text micro gaps: 8px
- Card and compact panel padding: 12–16px
- Dialog sections: 20px on small screens, 24px from the `sm` breakpoint
- Major content separation: 24–32px
- Controls: minimum 44px hit height

Radius scale:

- Controls, chips, and small icon containers: 8px
- Inset prompt/anatomy panels: 12px
- Cards and dialogs: 16px

## First-success and progressive-depth patterns

### First prompt path

For a new local Library, teach the product through the first successful prompt rather than a detached tutorial. Show the compact three-step path **Describe → Refine → Save** on Home and Craft until the person has saved a prompt or opened an existing one.

- Describe starts with the person's own words.
- Refine introduces only useful optional direction.
- Save explains that the idea becomes retrievable in the local Library.
- Always reinforce that authored words remain editable and are not silently replaced.

The path is orientation, not a gate: it must never block drafting, copying, or saving.

### Simple and Studio depth

Default Craft to **Simple**, with the authored prompt, selected ingredients, formatted output, and a single `Find ingredients` action visible. Name the opt-in depth **Studio tools** and explain what it reveals.

Studio tools use a single accordion rail for prompt check, suggestions, variations, negatives, references, and format comparison. All sections start collapsed. Open one tool at a time so expert controls do not compete with the prompt and output.

### Prompt attribution

When content exists, show a compact `What MUSE added` explanation before the formatted output. Distinguish structured ingredients from authored text, state the ingredient count, and name a few examples. Label the formatted result `Ready to use`; do not imply that MUSE authored or replaced the person's original language.

## Visual analysis patterns

Analyze is the top-level workspace for turning one visible reference into an inspectable art-direction study. Its sequence is **Upload → Analyze explicitly → Inspect → Use in Craft**.

### Visual Anatomy Ledger

Keep visual analysis as one continuous editorial document rather than a dashboard grid. The uploaded image remains the stable evidence surface; the literal description, creative read, palette, ledger, and prompt outputs follow in that order.

- Every observation names a visual dimension, distinguishes observed evidence from inference, and can be edited or excluded.
- Ledger edits update natural-language and tag-based prompts locally. Generated outputs remain read-only until they enter Craft.
- `Recreate closely` retains scene-specific observations. `Extract art direction` removes scene-specific subject matter while retaining transferable composition, light, palette, medium, texture, and mood.
- Palette hex values come from local pixel analysis. Show semantic name, role, and prominence without allowing a vision model to replace the measured color.
- Do not send an image automatically. Uploads save locally; analysis always requires an explicit action and a vision-capable provider.

### Analyze layout and handoff

Use a sticky reference sheet beside the continuous study on desktop and a stacked reference-first layout on mobile. Keep previous studies in Library → References rather than adding a competing history rail.

`Use in Craft` starts a new unsaved draft without a confirmation interruption, but captures the previous draft for recovery first. Transfer generator-neutral natural language plus exact recognized taxonomy ingredients; model-specific formatting remains Craft's responsibility.

## Workspace folio patterns

Workspaces are labelled studio folios for separating client, campaign, and personal bodies of work. They are not user profiles and should not look like an account switcher.

- Keep the active folio visible in the global header with a folder-tab affordance.
- Manage folios in a right-side editorial drawer using one continuous list, quiet dividers, last-opened metadata, and an explicit fresh-folio section.
- Flush pending state before switching or creating a folio. Reload into the new isolated persistence key so no transient store state crosses the boundary.
- Never delete the active or only remaining folio. Destructive deletion names the local data that will be removed and recommends exporting first.
- Storage settings show runtime, actual bytes used, reported quota when available, reference count, and durability. Use a single restrained capacity rule rather than dashboard metrics.

## Saved-prompt retrieval patterns

Suggested names should be short, recognisable phrases derived from the first meaningful subject clause, not a raw six-word truncation. Remove generic generation instructions and unresolved variable tokens. Keep the save-name field editable and explain that naming supports future recall.

The prompt Library provides:

- `All prompts` and `Favorites` filters with counts
- `Recent` and `Name` sorting
- Search across title, authored text, and ingredient labels
- Result count with a clear-filter recovery state
- Two-line titles plus model, version count, and ingredient count
- Primary `Open in Craft` and secondary `Versions` actions

Use card metadata to improve scanning at collection scale; do not add folders until real usage shows filtering, search, and favorites are insufficient.

## Ingredient discovery patterns

Preserve the complete taxonomy, but do not expose it as the default browsing surface. Start with six intent directions—Subject, Appearance, Setting, Style, Mood, and Quality—presented as descriptive cards with counts.

- The default guided state offers a small set of familiar starter ingredients.
- Choosing a direction reveals only its relevant categories.
- Search remains available for precise retrieval.
- `Browse complete taxonomy` explicitly reveals the raw accordion hierarchy as an advanced route.
- Taxonomy category accordions start collapsed; never auto-expand the first category.

This is progressive disclosure, not taxonomy deletion. Exact tag IDs and existing content-visibility rules remain authoritative.

## Blueprint library patterns

### Curated-first collection

The default collection is a deliberately reviewed flagship set. Preserve the full catalog behind a clear `Curated N / All N` segmented control. Searching may search the full catalog, but the default browsing experience stays curated.

Collection, category, and source controls must expose real state with `aria-pressed` or tab semantics. Reset incompatible category filters when switching collection depth.

### Blueprint card

A reusable card includes:

1. A distinct 16:9 visual reference with responsive image sources and lazy loading.
2. Editorial title and a plain-language depth label (`Quick start`, `Guided`, or `Technical`).
3. A two-line purpose description.
4. A short sample of descriptive tags.
5. An exact ingredient count or `Text-only starter` status.
6. An explicit `Preview` affordance.

The whole card may be a button when preview is its only primary action. Give it an accessible label such as `Preview [name] blueprint`.

### Blueprint preview

Preview before mutation. A preview dialog includes:

- Large visual reference
- Blueprint title, depth, and description
- Prompt anatomy as a definition list
- Complete editable starter prompt
- Exact taxonomy ingredient count
- Current model compatibility
- Secondary `Apply here` and primary `Apply and continue in Craft` actions

Preview dialogs use a responsive maximum width, a 90vh maximum height, and scroll safely at short viewport heights.

### Prompt anatomy

Use definition lists for structured creative decisions. Typical dimensions are Subject, Composition, Lighting, Medium, Mood, Setting, and Constraint. Render anatomy as a low-contrast grid of bordered cells rather than independent decorative cards.

### Exact ingredients

Reusable blueprints store exact taxonomy IDs. Apply them deterministically, deduplicate by ID, honor content visibility, and clear the previous ingredient set before applying the new blueprint. Cards and review screens should state the exact count so the handoff is predictable.

## Guided blueprint wizard

Use a four-step sequence: **Subject → Mood → Medium → Review**.

- Each choice maps to explicit prompt language and exact taxonomy IDs.
- Choice buttons use `aria-pressed` and remain at least 44px tall.
- The step list uses `aria-current="step"`.
- The review step shows the generated name, prompt anatomy, full starter prompt, and resolved ingredients before applying.
- Keep the header, step indicator, and action row stable. The review content scrolls inside the dialog so actions never cover ingredient chips.
- Primary completion action is `Use in Craft`; saving a reusable blueprint is secondary.

## Interaction and accessibility

- Use semantic buttons, tabs, groups, definition lists, and labeled regions.
- Every icon-only control requires an accessible name.
- Focus states use the existing strong border/focus treatment.
- Use approximately 150ms transitions for hover and selection feedback; avoid bounce or ornamental motion.
- Disabled states must remain visible and communicate unavailable progression.
- Dialogs must have a title, description, labeled close control, focus management, and a scroll-safe mobile layout.

## Reuse rule

When adding future prompt starters, enrich the shared blueprint data rather than hard-coding presentation details in the gallery or wizard. A flagship blueprint should have a unique image, a variable-bearing starter prompt, at least four anatomy parts, and at least three valid exact taxonomy IDs.
