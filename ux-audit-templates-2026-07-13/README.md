# MUSE template system audit

Date: 2026-07-13

## Verdict

The template gallery is visually good and credible, but the template content and application system are not yet at the same level. It is suitable for an early beta, but it is not yet strong enough to be a defining, production-grade feature for a prompt-crafting product.

## Flow reviewed

1. Open Library > Templates.
2. Scan categories and built-in template cards.
3. Apply the Studio Portrait built-in template.
4. Inspect the applied result in Craft.
5. Complete the Wizard with Portrait > Dramatic > Photography.
6. Inspect the Wizard's proposed tags and resulting prompt.

## Strengths

- The gallery feels polished, calm, and consistent with MUSE's editorial visual language.
- Search, categories, built-in templates, personal templates, import, and the Wizard create a strong feature frame.
- Cards are easy to scan and expose a title, description, visual, tags, difficulty, and a clear apply action.
- Applying a built-in template is fast and preserves undo history.
- Built-in templates include some useful per-model defaults for Midjourney, Stable Diffusion, and Flux.

## Highest-impact issues

1. The cards promise more structure than they apply. All 53 built-in templates currently have empty `tagIds`, so the visible "5 tags" are display labels rather than taxonomy ingredients. Applying Studio Portrait produced prompt text but no selected template tags.
2. Most template prompts are generic style recipes rather than genuinely useful blueprints. They describe a look, but usually omit a subject slot, intent, composition choices, constraints, or editable variables.
3. Every template in a category reuses the same image. This makes Studio, Cinematic, Editorial, and Fantasy Portrait look nearly identical before selection, weakening comparison and trust.
4. Apply confirms in place but does not take the user to Craft or offer a clear "Continue editing" action. The user must infer the next step from the top navigation.
5. Difficulty labels are not explained and do not visibly correspond to a different editing experience. "Advanced" often means only a slightly longer prompt or higher model settings.
6. The Wizard relies on fuzzy taxonomy search and can produce irrelevant ingredients. Portrait > Dramatic > Photography returned "passionate" and "realistic tattoo" while failing to include a clear portrait ingredient.
7. The Wizard's authored prompt omits the chosen style. The tested path produced `close-up portrait, person, dramatic`; Photography appeared only indirectly through noisy tags.
8. The system is broad but shallow: 53 templates across 18 categories creates coverage, yet many options differ only by a few adjectives.

## Recommended direction

- Keep the gallery shell, but rebuild templates around explicit prompt slots: subject, action, environment, composition, camera or medium, lighting, palette, constraints, and model settings.
- Curate 12-18 excellent flagship templates first, then expand only after each one has a distinct example image and verified output.
- Connect every visible tag to an exact taxonomy ID, or stop calling the display labels applied tags.
- Replace category-level images with template-specific outputs that accurately preview the recipe.
- Add a lightweight preview/details state showing the full prompt, what will change, model compatibility, and editable fields before applying.
- After apply, offer `Continue in Craft` as the primary next action.
- Rework the Wizard to assemble from curated exact IDs and deterministic rules, then let the user remove or replace ingredients before saving.
- Rename difficulty to something more meaningful, such as `Quick start`, `Guided`, and `Technical`, or remove it until the levels change the experience.

## Accessibility risks

- Filter and gallery-mode buttons do not expose an obvious selected state in the accessibility tree.
- Each card is one large button with a very long accessible name; previewing and applying are not distinct actions.
- The Wizard's progress dots are mostly visual and do not expose a clear step count or completion state.
- Screenshot review cannot confirm keyboard focus visibility, reflow, contrast ratios, or screen-reader announcements; those need dedicated testing.

## Evidence

- `01-templates-gallery-top.png`: gallery entry and controls.
- `02-template-cards.png`: card comparison and repeated category imagery.
- `03-applied-template.png`: built-in template in Craft.
- `04-template-wizard.png`: Wizard entry state.
- `05-template-wizard-review.png`: noisy generated tag set.
- `06-wizard-template-applied.png`: sparse authored prompt.
- `07-wizard-template-output.png`: final generated output with irrelevant ingredients.
