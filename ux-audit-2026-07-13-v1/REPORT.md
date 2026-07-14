# MUSE v1.0 product audit

Date: 2026-07-13

## Verdict

**Overall: 7.7/10.** MUSE is a credible release candidate and already feels more considered than many v1 products, but it is not yet a *great* v1.0. The product has a distinctive visual identity, a working core loop, and unusually serious local-first data handling. Its main weakness is product focus: expert features are present faster than the interface teaches a stable mental model, so the experience can feel like a beautiful control room before it feels effortless.

Recommended release status: **private beta or v1.0 release candidate**. Hold the broad “great v1.0” launch until the first-session path, Library retrieval, Studio hierarchy, mobile flow, and end-to-end release checks are tightened.

## Scorecard

| Area | Score | Summary |
| --- | ---: | --- |
| Visual design | 8.7 | Distinctive, cohesive, editorial, and calm. Tiny muted labels and faint boundaries reduce clarity. |
| Core experience | 7.8 | Home → Craft → live output → save → Library is coherent and works. Studio becomes dense quickly. |
| Interface / information architecture | 7.3 | Three top-level spaces are understandable, but Library and Studio contain too many competing concepts. |
| Functionality | 8.2 | Core local workflows worked; build, lint, and 140 unit/integration tests passed. Full current E2E was not verified in this audit. |
| Accessibility | 7.1 | Good semantic structure, focus styles, reduced-motion support, and large targets. Complex screens and mobile need broader testing. |
| Release confidence | 7.2 | Strong technical foundation, but the unverified mobile/E2E surface and onboarding/retrieval issues keep this below launch-grade confidence. |

## What is genuinely good

- The visual identity is memorable without looking gimmicky. The warm neutral palette, serif display type, photography, and restrained controls make MUSE feel like a creative tool rather than a developer utility.
- The core promise is real. Authored words move into Craft, `{subject}` resolves live, MUSE-added ingredients affect the output, and saving creates a usable Library item with a clear confirmation.
- Trust is handled unusually well. Local saving states, offline language, backup/restore, recovery, diagnostics, and session-only credentials show product maturity.
- Progressive depth is the right idea. Home, Simple/Studio, templates, global search, and expandable refinement controls give novices and experts plausible entry points.
- The product has real substance: prompt variables, formatter profiles, templates, tags, negatives, versions, references, AI provider support, randomization, and PWA behavior are not decorative feature claims.

## What keeps it from being a great v1.0

1. **The product teaches features before it teaches the model.** “Natural language,” “GPT Image 2,” “formatter,” “ingredients,” “weights and triggers,” “prompt check,” “negatives,” and “references” all appear around the core editor. A new user can operate the screen, but may not know which concepts matter or what MUSE changed.
2. **Studio is a beautiful kitchen sink.** The right rail, variable block, output, ingredient details, negative output, enhancement controls, and saving/versioning all compete vertically. The `4 / 5` prompt check is intriguing but too abstract to guide action confidently.
3. **Saved-item retrieval will degrade fast.** The default saved title is a truncated slice of prompt text (`Create a waist-up portrait of {subject},`) and the Library card truncates it again. Once a user has 30 prompts, scanning and recall will be weak unless naming, covers, folders/collections, or strong metadata improve.
4. **The taxonomy is more database than browsing experience.** The top grouping helps, but thousands of tags and a long accordion of body, pose, clothing, camera, style, and other subcategories are overwhelming. Search is good; browse needs stronger progressive disclosure and intent-based routes.
5. **Settings are important but buried.** Data durability, backup, AI connections, formats, and updates live behind an ellipsis item called “Local connections and settings.” Those are high-trust and high-value capabilities, not secondary leftovers.
6. **The visual system sometimes values atmosphere over legibility.** Muted 10–12px labels, faint borders, and low-emphasis secondary copy look elegant but slow scanning. The product would survive slightly stronger contrast and clearer section separation.
7. **Release assurance is incomplete.** Production build, lint, and 140 tests pass. The repo contains desktop/mobile/offline/accessibility E2E coverage, but that suite was not executed during this audit and the live browser review stopped before a fresh mobile run. A great v1.0 needs that full release path green from the current code.

## Highest-impact changes before launch

1. Make the first successful prompt the onboarding: one sentence in, one clearly explained improvement out, one save. Introduce ingredients, formats, and Studio only after success.
2. Redesign saved-prompt naming and retrieval: suggest a human title, let the user edit it quickly, add sort/filter, and make Library cards more information-rich at scale.
3. Give Studio a stronger hierarchy: keep one primary next action visible, explain what MUSE added, and collapse expert controls by default unless the user opts into them.
4. Turn tag browsing into intent-led discovery (subject, scene, camera, look, mood) with recently used and recommended routes; keep the raw taxonomy as an advanced view.
5. Promote Settings/Data to a named destination and run the current desktop + mobile + offline + accessibility E2E suite as a release gate.

## Audited flow

1. **Home — healthy.** Clear creative entry point, good primary action, credible privacy/offline reassurance, and useful inspiration. Fresh-reset onboarding was not captured.
2. **Home to Craft — healthy.** Prompt handoff worked and preserved authored text.
3. **Craft and live variables — healthy with UX density risk.** Variable replacement updated output immediately. Studio mode is powerful but crowded.
4. **Save prompt — healthy with naming risk.** Modal and confirmation worked. Default naming will create a weak Library at scale.
5. **Library prompts — healthy for small collections.** The saved item appeared and offered versions and reuse. The layout and title treatment are not yet optimized for a large collection.
6. **Template Library — healthy but feature-heavy.** Curated versus full depth is smart; filters, sources, wizard, import, and many categories compete for attention.
7. **Tag Library — functional but overwhelming.** Search, recents, selected states, and semantic groups help, but the raw taxonomy is too large to be the main browse experience.
8. **Global search — healthy.** Search returned both a matching tag and starter quickly, with clear keyboard guidance.
9. **Settings — partially verified.** The panel structure and General/AI/Formats/Data organization were inspected, but the browser review stopped before an accepted settings screenshot and mobile pass.

## Evidence limits

- This audit used the currently persisted local workspace, so it did not prove the completely fresh first-run state.
- Desktop screenshots were captured at the in-app browser's current viewport. A fresh mobile screenshot pass was not completed.
- Screenshot review cannot establish full WCAG compliance, screen-reader quality, offline reliability, API-provider interoperability, or performance on low-end devices.
- The automated checks completed here were build, lint, and the default Vitest suite. The Playwright E2E suite was not run in this audit.

## Screenshots

- `01-craft-default.png`
- `02-home.png`
- `04-craft-variable-output.png`
- `05-save-prompt-dialog.png`
- `06-library.png`
- `07-template-library.png`
- `08-tags-library.png`
- `09-global-search.png`
