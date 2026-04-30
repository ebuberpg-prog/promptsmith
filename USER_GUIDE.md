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
- **Experiment** with randomization and variations
- **Organize** your work with templates, saved prompts, and version history
- **Enhance** prompts with optional local AI assistance

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
- **View Negative Prompt** — Shows the auto-generated negative prompt
- **Edit Custom Text** — Opens the free-form text editor
- **Expert Mode** — Reveals advanced controls like trigger words and per-tag weights

### Tag Suggestions

MUSE analyzes your current selections and suggests related tags that complement your prompt. These appear as tappable chips below the prompt output.

### Entity Presets

Save the current tag selection as a named **Entity** (character, environment, style, mood, or custom). Entities are reusable building blocks you can load into any future prompt.

### Reference Images

Upload reference images to attach visual context to your prompt. You can also use the **AI Tools** panel to extract descriptive tags from an uploaded image via a connected vision model.

---

## Creative Tools

### Randomizer

Stuck? The **Randomizer** generates unexpected but coherent tag combinations.

**Modes:**

- **Smart** — Coherence-driven randomization that picks conflict-free tags across prompt slots. Optionally provide a story seed to guide the narrative direction.
- **Wild** — Chaos-driven randomization with no coherence checks. Great for breaking out of familiar patterns.

**Options:**

- **Intensity** — Quick (3–5 tags across core slots) or Full (8–14 tags across all slots)
- **Vibe** — Lock to a specific aesthetic direction (Cinematic, Dreamy, Gritty, etc.)
- **Story Seed** — Provide a narrative theme to guide randomization in Smart mode
- **Lock pinned tags** — Pinned tags are preserved during randomization

> **Tip:** After randomizing, use Undo (`Cmd/Ctrl + Z`) to step back if you don't like the result.

### AI Tools

When connected to a local or remote LLM (Ollama, LM Studio, or OpenAI-compatible), MUSE offers several AI-powered assistance features:

- **Enhance Prompt** — Rewrite your current prompt with improved structure, lighting, and mood details.
- **Describe → Tags** — Type a natural language description and get matching taxonomy tags back.
- **Suggest More** — Based on your selected tags, get AI-generated complementary suggestions.
- **Image → Tags** — Upload an image to a vision-capable model and extract descriptive tags.

Open the **AI Tools** panel from the header to access these features.

---

## Organization & Workflow

### Version History

Every significant change is automatically saved as a version snapshot. You can:

- **Undo** (`Cmd/Ctrl + Z`) — Step back through changes
- **Redo** (`Cmd/Ctrl + Shift + Z` or `Cmd/Ctrl + Y`) — Step forward
- **Save a named version** — Lock a milestone with notes
- **Load a previous version** — Return to any saved snapshot

Version history is stored locally in your browser.

### Saved Prompts

Save your current tag selections and custom text as reusable templates.

**To save a prompt:**

1. Build your prompt.
2. Open the **Command Palette** (`Cmd/Ctrl + K`) and select **Save prompt**.
3. Enter a name.
4. It appears in your saved templates gallery for future use.

**To load a saved prompt:**

1. Browse the **Templates** tab or search for it by name in the command palette.
2. Click to apply its tags and structure to your current session.

---

## Local AI Integration

MUSE can connect directly to local and remote AI services for text enhancement and tag extraction.

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

### CORS Proxy

If your local service blocks browser requests due to CORS, enter a CORS proxy URL in settings (e.g., a local Cloudflare Worker or a public proxy).

---

## Settings

Open settings from the header menu. Available options include:

| Setting | Description |
|---------|-------------|
| **Theme** | Toggle between Dark and Light modes |
| **Explicit Content** | Show or hide mature-content tags |
| **AI Provider URLs** | Configure connections to Ollama, LM Studio, and OpenAI-compatible APIs |
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

When experimenting with the Randomizer, **pin** the tags you definitely want to keep. This prevents them from being changed.

### Save Early, Save Often

Use **Saved Prompts** for workflows you want to reuse, **Entities** for reusable characters or scenes, and **Templates** for repeatable starting points. Version history protects your experiments.

### Reference Images

Upload reference images that capture the vibe you want. They serve as visual context alongside your prompt. For deeper analysis, use the **Image → Tags** feature in the AI Tools panel if you have a vision-capable model connected.

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
