# MUSE interface direction

The authoritative implementation system is [.interface-design/system.md](.interface-design/system.md). This document is the short contributor-facing summary.

## Product intent

MUSE is a private creative workbench for someone turning an image idea into a deliberate, reusable prompt. It should feel like an editorial studio notebook: calm, exact, tactile, and quietly premium—not like a generic developer dashboard or an image-generation control room.

The primary product verb is **craft**. The core sequence is **Describe → Refine → Save**.

## Signature

MUSE keeps authored words and structured ingredients visibly distinct. The interface should always make it possible to answer:

1. What did the person write?
2. What optional structure did MUSE add?
3. What formatted result is ready to use?

Blueprint templates extend that signature by exposing purpose, prompt anatomy, editable starter text, and exact taxonomy ingredients before application.

## Visual system

- Warm paper-and-ink surfaces from the `--ui-*` tokens in `src/index.css`
- Playfair Display for editorial headings and the application sans-serif for controls/body
- Four-pixel spacing base using the established 8, 12, 16, 20, 24, and 32px increments
- Borders and subtle surface changes for depth; shadows reserved for overlays
- Minimum 44px interactive targets
- Restrained color used for meaning, not decoration
- Light and dark modes with the same hierarchy and warm temperature

Do not introduce arbitrary hex values, decorative gradients, unrelated accent colors, dramatic shadows, or a second component depth strategy.

## Product hierarchy

### Home

Lead with authored language. Related ingredients, formats, guided start, and inspiration must remain optional supporting routes.

### Craft

Default to Simple. Keep authored text, ingredients, attribution, formatted output, and save/copy actions central. Studio tools are opt-in, collapsed by default, and limited to one open refinement section at a time.

### Library

Optimize for retrieval, not decoration. Titles, search, favorites, sorting, metadata, versions, and `Open in Craft` should make a growing collection scannable.

### Ingredient discovery

Start with intent directions and a small familiar set. Preserve the complete taxonomy behind an explicit advanced route. This is progressive disclosure, never tag deletion.

## Accessibility and interaction

- Use semantic buttons, regions, tabs, groups, dialogs, lists, and definition lists.
- Give every icon-only control an accessible name.
- Use visible focus treatment through the strong border/focus token.
- Respect reduced motion.
- Keep transitions around 150–200ms and avoid bounce or ornamental motion.
- Provide loading, empty, error, disabled, saving, saved, and recovery states where relevant.
- Test primary flows at desktop and mobile widths with axe-core checks in the release suite.

## Contribution rule

Before adding a new pattern, check [.interface-design/system.md](.interface-design/system.md). Update that file only when the pattern is reusable across the product or contains measurements future work must preserve.
