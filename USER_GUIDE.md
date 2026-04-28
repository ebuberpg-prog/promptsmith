# MUSE User Guide

> Your complete guide to building world-class AI image generation prompts.

---

## Table of Contents

- [Introduction](#introduction)
- [First Launch & Quick Start](#first-launch--quick-start)
- [The Interface](#the-interface)
- [Building Prompts](#building-prompts)
- [Templates](#templates)
- [The Prompt Inspector](#the-prompt-inspector)
- [Creative Tools](#creative-tools)
- [Organization & Workflow](#organization--workflow)
- [Local AI Integration](#local-ai-integration)
- [Settings](#settings)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)

---

## Introduction

MUSE is a professional prompt engineering studio for AI image generation. Instead of typing prompts from scratch and guessing what works, MUSE gives you a structured taxonomy of thousands of curated tags, smart composition tools, and model-aware formatting — so you can build precise, evocative prompts in seconds.

Whether you're creating characters, landscapes, product shots, or abstract art, MUSE helps you:

- **Discover** the right tags through search and browsing
- **Compose** prompts optimized for your chosen model
- **Experiment** with randomization, mutations, and variations
- **Organize** your work with templates, DNA recipes, and version history
- **Generate** images directly from connected local or remote AI services

---

## First Launch & Quick Start

When you open MUSE for the first time, the **Quick Start Wizard** appears automatically. This four-step wizard builds your first prompt in under a minute:

1. **Subject** — Describe what you want to create (e.g., "a cyberpunk warrior", "a serene mountain lake"). Pick from suggested starters or type your own.
2. **Style** — Choose a visual style (photorealistic, oil painting, anime, cinematic, etc.).
3. **Mood** — Set the atmosphere (melancholic, vibrant, mysterious, serene, etc.).
4. **Model** — Pick your target image generation model. This determines how your prompt is formatted.

After finishing, MUSE automatically applies the relevant tags, sets your custom text, and selects the model. You can disable the wizard from appearing again by checking **"Don't show again"**.

> **Tip:** You can always reopen the wizard from the command palette (`Cmd/Ctrl + K`) by searching "Quick Start".

---

## The Interface

MUSE adapts its layout to your device:

### Desktop (Two-Panel Layout)

- **Left Panel** — Main workspace for browsing tags, templates, the randomizer, and the prompting guide.
- **Right Panel** — The **Prompt Inspector**, where you see your live prompt, selected tags, suggestions, and tools.
- **Top Bar** — App header with theme toggle, search, and settings access.

### Mobile (Bottom Tabs)

On phones and small tablets, MUSE uses three bottom tabs:

- **Templates** — Browse and apply prompt templates.
- **Build** — Search tags, browse categories, randomize, and read the guide.
- **Prompt** — View and edit your prompt, see suggestions, and access advanced tools.

### View Modes (Desktop & Tablet)

At the top of the main workspace, four tabs let you switch contexts:

| Tab | Purpose |
|-----|---------|
| **Templates** | Browse built-in and saved prompt templates |
| **Browse Tags** | Explore the taxonomy by category or search |
| **Randomize** | Break creative block with AI-assisted randomization |
| **Guide** | Read best practices for prompting each model |

---

## Building Prompts

### Searching Tags

The fastest way to build a prompt is to use the **hero search bar** at the top of the workspace:

1. Click the search field (or press `Cmd/Ctrl + K`).
2. Type what you're looking for — e.g., "golden hour", "cyberpunk", "elderly woman".
3. Results appear instantly via fuzzy search across all taxonomy tags.
4. Click a tag to add it to your prompt.

Tags are organized into **20+ categories** including:

- Subjects & Characters
- Clothing & Accessories
- Facial Features & Hair
- Poses & Gestures
- Environments & Backgrounds
- Lighting & Camera Style
- Art Medium & Style
- Mood & Emotion
- Fantasy & Sci-Fi Elements
- Props & Objects
- Weather & Effects
- Composition
- Time Period & Subculture
- And more...

### Browsing by Category

In **Browse Tags** mode, tags are grouped by category. Click a category to expand it, then click individual tags to add them. Each tag shows:

- **Label** — The tag name
- **Description** — What it represents
- **Aliases** — Alternative names you can search by
- **Weight** — Implicit importance (used by some models)

### Managing Selected Tags

Selected tags appear in the **Prompt Inspector** on the right (or in the Prompt tab on mobile). Here you can:

- **Reorder** tags by dragging (on supported devices)
- **Remove** a tag by clicking its × button
- **Pin** a tag to prevent it from being cleared or randomized
- **Adjust trigger words** for advanced control over how a tag is rendered
- **Clear all** tags at once

> **Explicit Content:** Some tags are marked as explicit. Toggle the explicit filter in settings if you want access to mature-content tags.

### Custom Text

For free-form descriptions that aren't in the taxonomy, use the **Custom Text** field in the Prompt Inspector. This text is merged with your selected tags when the final prompt is composed. Good uses include:

- Specific scene descriptions
- Character backstory context
- Narrative framing
- Unique concepts not yet in the taxonomy

---

## Templates

Templates are pre-built prompt structures that give you a head start.

### Built-In Templates

MUSE ships with a library of built-in templates for common use cases:

- Portrait photography
- Character design
- Landscape scenes
- Product shots
- Abstract art
- Fantasy illustrations

### Applying a Template

1. Go to the **Templates** tab.
2. Browse or search the gallery.
3. Click a template to apply its tags and structure to your current session.
4. Customize by adding, removing, or reordering tags.

### Saving Your Own Templates

When you've built a prompt you want to reuse:

1. Open the **Command Palette** (`Cmd/Ctrl + K`).
2. Search for **"Save prompt"** and select it.
3. Enter a name.
4. Your template is now available in the gallery.

To load a saved template, search for it by name in the command palette or browse the gallery.

### Template Slots

Advanced templates use **slots** — required or optional placeholders that you fill in. For example, a portrait template might have slots for:

- Subject (required)
- Lighting style (required)
- Background (optional)
- Mood (optional)

Fill the slots to complete the template.

---

## The Prompt Inspector

The right-side panel (or Prompt tab on mobile) is your mission control. It contains several sections:

### Live Prompt Output

This shows your composed prompt in real time as you add or remove tags. It is formatted specifically for your **selected model**:

- **Midjourney** — Prose-style with parameters (`--ar`, `--v`, `--style`)
- **Stable Diffusion** — Comma-separated tags with weight brackets `(tag:1.2)`
- **DALL-E 3** — Natural language sentences
- **Flux** — Detailed structured descriptions

### Actions on the Prompt

- **Copy** — Copies the formatted prompt to your clipboard
- **Generate Image** — If connected to a local image generation service, generates the image directly
- **View Negative Prompt** — Shows the auto-generated negative prompt
- **Edit Custom Text** — Opens the free-form text editor
- **Expert Mode** — Reveals advanced controls like trigger words and per-tag weights

### Tag Suggestions

MUSE analyzes your current selections and suggests related tags that complement your prompt. These appear as tappable chips below the prompt output.

### Prompt DNA

The **Prompt DNA** section visualizes the composition of your prompt — showing the balance of subject, style, lighting, mood, and other semantic groups. Use it to identify what's missing or overrepresented.

### Entity Presets

Save the current tag selection as a named **Entity** (character, environment, style, mood, or custom). Entities are reusable building blocks you can load into any future prompt.

### Reference Images

Upload a reference image to:

- Extract visual tags automatically
- Analyze composition, dominant colors, and mood
- Match style vectors against the taxonomy
- Use as inspiration for your prompt

---

## Creative Tools

### Randomizer

Stuck? The **Randomizer** generates unexpected but coherent tag combinations.

**Modes:**

- **Smart** — Balanced randomization that maintains semantic coherence
- **Coherence-Aware** — Stronger enforcement of compatible tag groups
- **Chaos** — Truly random, often surreal combinations
- **Story-Driven** — Generates tags that suggest a narrative
- **Vibe-Based** — Randomizes within a chosen aesthetic vibe

**Options:**

- **Intensity** — Light (few tags changed) or Full (complete rewrite)
- **Vibe** — Lock to a specific aesthetic direction
- **Intent** — Focus on subject, style, or mood
- **Story Seed** — Provide a narrative theme to guide randomization
- **Lock pinned tags** — Pinned tags are preserved during randomization

> **Tip:** After randomizing, use Undo (`Cmd/Ctrl + Z`) to step back if you don't like the result.

### Prompt Mutation

Generate systematic variations of your current prompt:

- **Style Shift** — Change the art style while keeping the subject
- **Weight Adjust** — Emphasize or de-emphasize elements
- **Synonym Swap** — Replace words with semantic equivalents
- **Composition Change** — Alter framing, angle, or layout
- **Negative Addition** — Strengthen the negative prompt

Select a mutation type, click **Generate Mutations**, then click any variation to apply it.

### Prompt Diff

Compare two prompts to see exactly what changed:

1. Enter or paste Prompt A and Prompt B.
2. MUSE highlights additions, removals, modifications, and reorderings.
3. Each change is labeled with significance: **Critical**, **High**, **Medium**, or **Low**.

Use this to understand why one prompt worked better than another, or to review changes between versions.

### Style Transfer Matrix

Before mixing styles, analyze their compatibility:

1. Select source styles (what you have).
2. Select target styles (what you want to add).
3. MUSE generates a compatibility matrix showing how well each pair works together.

High scores mean the styles complement each other. Low scores warn of potential visual clashes.

### Prompt Compression

If your prompt is too long for a model's token limit:

1. Click the compression tool.
2. Set your target token count.
3. MUSE intelligently shrinks the prompt using truncation, synonym substitution, and aggregation — while preserving the most important elements.

---

## Organization & Workflow

### Version History

Every significant change is automatically saved as a version snapshot. You can:

- **Undo** (`Cmd/Ctrl + Z`) — Step back through changes
- **Redo** (`Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y`) — Step forward
- **Save a named version** — Lock a milestone with notes
- **Load a previous version** — Return to any saved snapshot

Version history is stored locally in your browser.

### DNA Recipes

A **DNA Recipe** is a saved bundle of tags and style weights that defines a reusable aesthetic. Think of it as a "preset" for a look or character type.

**To create a recipe:**

1. Build your prompt.
2. Click **Save as DNA Recipe** in the Prompt Inspector.
3. Name it and add a description.
4. It appears in your recipe library for future use.

**To load a recipe:**

1. Open the recipe manager.
2. Click a recipe to replace or append its tags to your current prompt.

### Batch Generation

Create multiple prompt variations automatically:

1. Write a base prompt with variables in curly braces, e.g.:
   ```
   A {subject} in {lighting} light, {style} style
   ```
2. Define the variable options:
   - subject: [warrior, mage, rogue]
   - lighting: [golden hour, neon, moonlight]
   - style: [oil painting, digital art, anime]
3. MUSE generates every permutation (3 × 3 × 3 = 27 prompts).
4. Copy the batch or generate images from each.

### A/B Testing

Compare two prompt variants scientifically:

1. Enter Prompt A and Prompt B.
2. MUSE tracks impressions, clicks, and conversions (if integrated).
3. Review which variant performs better.

> **Note:** A/B metrics require manual entry or integration with an external analytics source.

---

## Local AI Integration

MUSE can connect directly to local and remote AI services for text enhancement and image generation.

### Text Enhancement (LLMs)

Connect to a local or remote LLM to enhance your prompts with AI:

- **Ollama** — Local open-source models (default: `http://localhost:11434`)
- **LM Studio** — Local model server (default: `http://localhost:1234/v1`)
- **OpenAI-compatible** — Any API that follows the OpenAI format

**Setup:**

1. Open **Settings** → **AI Integration**.
2. Enter the URL of your running service.
3. Click **Test Connection**.
4. If successful, select your preferred model.

### Image Generation

Generate images directly from MUSE without copy-pasting:

- **AUTOMATIC1111 (A1111)** — Stable Diffusion WebUI (default: `http://localhost:7860`)
- **ComfyUI** — Node-based generation (default: `http://localhost:8188`)
- **DrawThings** — Local AI generation (default: `http://localhost:3820`)

**Setup:**

1. Open **Settings** → **AI Integration**.
2. Enter the URL of your running image generation service.
3. Click **Test Connection**.
4. In the Prompt Inspector, click **Generate Image**.

### CORS Proxy

If your local service blocks browser requests due to CORS, enter a CORS proxy URL in settings (e.g., a local Cloudflare Worker or a public proxy).

---

## Settings

Open settings from the header menu. Available options include:

| Setting | Description |
|---------|-------------|
| **Theme** | Toggle between Dark and Light modes |
| **Explicit Content** | Show or hide mature-content tags |
| **AI Provider URLs** | Configure connections to Ollama, LM Studio, A1111, ComfyUI, DrawThings |
| **API Keys** | Enter OpenAI API key (stored locally) |
| **CORS Proxy** | URL for bypassing CORS restrictions |
| **Model Input Mode** | Auto-detect or manually specify OpenAI models |

All settings are saved locally in your browser.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Cmd/Ctrl + Y` | Redo (alternative) |
| `Esc` | Close Command Palette |
| `↑ / ↓` | Navigate Command Palette results |
| `Enter` | Select highlighted Command Palette result |

> **Tip:** The Command Palette is the fastest way to find tags, load templates, save prompts, and execute commands without reaching for the mouse.

---

## Tips & Best Practices

### Start with the Subject

The most important part of any prompt is the subject. Name it clearly, add physical details, and place it in context before layering style and mood.

### Layer Style and Mood

Style tags shape the feel of the image more than almost anything else. Pick:

1. A lighting style (golden hour, neon, overcast)
2. An art style (photorealistic, oil painting, anime)
3. A mood word (melancholic, vibrant, serene)

### Match Your Model

Each model responds differently to prompt structure:

- **Midjourney** — Loves evocative, poetic language. Less is often more.
- **Stable Diffusion** — Responds well to precise tags, weighting, and negative prompts.
- **DALL-E 3** — Use full sentences and describe the scene like a story.
- **Flux** — Prefers detailed, structured prompts with clear hierarchy.

### Use the Negative Prompt

Don't ignore the negative prompt. MUSE auto-generates one based on your positive selections, but you can customize it. Common negatives include: blurry, low quality, deformed hands, extra limbs, watermark.

### Pin What Matters

When experimenting with the Randomizer or Mutations, **pin** the tags you definitely want to keep. This prevents them from being changed.

### Save Early, Save Often

Use **DNA Recipes** for aesthetics you love, **Entities** for reusable characters or scenes, and **Templates** for repeatable workflows. Version history protects your experiments.

### Reference Images

Upload a reference image that captures the vibe you want. Even if the extracted tags aren't perfect, they give you a starting point and suggest categories you might have missed.

---

## Troubleshooting

### App won't load / stays on loading screen

- Check your internet connection (the taxonomy is fetched on first load).
- Clear browser cache and reload.
- If installed as a PWA, uninstall and reinstall.

### Tags don't appear in search

- Wait for the taxonomy to finish loading (the loading screen shows a lightning icon).
- Try searching with aliases or partial words — Fuse.js handles fuzzy matching.
- If a category seems empty, check that explicit content is enabled in settings if the tags are marked mature.

### Can't connect to local AI service

- Verify the service is running and accessible at the URL in settings.
- Check for CORS errors in the browser console. If present, configure a CORS proxy.
- Ensure firewall rules allow connections from your browser to the local port.
- For Ollama, make sure the Ollama server is started (`ollama serve`).
- For A1111/ComfyUI, launch with `--cors-allow-origins` or use a proxy.

### Images fail to generate

- Confirm the image generation service is running and the test connection succeeds.
- Check that your prompt isn't empty.
- Review the error message in the Prompt Inspector — it often indicates a missing model or incorrect parameter.

### Undo/Redo not working

- History snapshots are saved per session. If you clear browser storage, history is lost.
- Ensure you're not in the middle of a batch operation — history is batched during bulk changes.

### Prompt looks wrong for my model

- Verify the correct model is selected in the model dropdown.
- Different models use different syntax. MUSE auto-formats, but if you've manually edited custom text, it may need adjustment.

### Mobile layout issues

- MUSE is designed for modern mobile browsers. Ensure your browser is up to date.
- On iOS, use "Add to Home Screen" for the best PWA experience.
- If the bottom tab bar overlaps content, check that your browser isn't in a compressed view mode.

---

<p align="center">
  <sub>Happy prompting.</sub>
</p>
