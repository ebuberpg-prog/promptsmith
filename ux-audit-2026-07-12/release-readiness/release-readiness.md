# MUSE Prompt Studio — Release-readiness audit

## Verdict

MUSE is a strong private beta with a credible, distinctive core loop. Its visual identity and local-first positioning are close to a public-release bar. It is not yet ready for a long-lived, low-maintenance 1.0 because data recovery, suggestion relevance, model-profile durability, and verified accessibility still create avoidable trust risk.

## Captured flow

1. Current Studio workspace — healthy visual hierarchy, but expert controls become vertically repetitive.
2. Home — healthy task entry and clear local-first reassurance.
3. Simple Craft — needs work: selected ingredients can produce a copyable prompt while the primary authored canvas says `0 characters` and the formatted result is collapsed.
4. Library — healthy empty-state hierarchy, but no whole-library backup, recovery, or storage-health affordance is visible.
5. Mobile Home — generally healthy responsive structure and touch targets.
6. Live taxonomy discovery — promising interaction, but a rainy portrait produced `wearing shoes`, demonstrating that weak fuzzy matches need a confidence floor.

## Release blockers

- Make the complete effective prompt visible in Simple mode regardless of whether it came from authored text, tags, or both.
- Add whole-library export, validated restore, automatic recovery snapshots, and clear local-storage durability information.
- Raise related-tag precision with scored confidence, category diversity, weak-match suppression, and regression fixtures.
- Decouple durable formatting profiles from fast-changing marketed model versions.
- Complete keyboard, screen-reader, 200% zoom, contrast, reduced-motion, focus-management, offline-recovery, and storage-eviction testing.
- Replace ad-hoc menu and destructive confirmation behavior with consistently tested accessible primitives.

## High-value additions

- Local prompt history with named snapshots, diff, and one-click restore.
- Reusable prompt variables and recipes.
- Side-by-side model-format comparison without generating images.
- Deterministic local prompt checks for missing dimensions, contradictions, repetition, and model-specific syntax.
- A reproducible taxonomy/formatter evaluation pack built from real artistic prompts.

## Deliberate omissions

- Accounts, teams, collaboration, community feeds, and social metrics.
- Mandatory cloud AI or automatic prompt transmission.
- Image generation.
- Raw-text moderation or rewriting.
- Broad feature expansion that weakens the core describe → craft → refine → copy/save → reuse loop.

## Evidence limits

This audit used screenshots and DOM observations of the current desktop Home, Simple and Studio Craft, Library, and mobile Home flows. It did not establish full WCAG compliance, storage behavior under browser eviction, long-session performance, service-worker recovery after a failed update, or real screen-reader usability.
