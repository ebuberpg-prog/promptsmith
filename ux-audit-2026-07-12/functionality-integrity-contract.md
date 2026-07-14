# MUSE 1.0 Functionality Integrity Contract

This contract is a release gate. A visible feature is complete only when its success path, state mutation, persistence boundary, privacy boundary, and failure path agree with the interface copy.

| Area | User contract | Mutation and persistence | Failure contract | Integrity |
| --- | --- | --- | --- | --- |
| Home draft | Typing immediately edits the shared Home/Craft draft | Coalesced IndexedDB write; flush before navigation/pagehide | Show save failure or best-effort state; never claim success early | Complete |
| Craft output | Output is the exact string Copy uses | Preview-only format changes mark the draft dirty; Library waits for Save | Clipboard failure leaves selectable output and announces recovery | Complete |
| Library | Autosave never changes a named prompt | Explicit Save creates/updates the prompt and version | Loaded prompt stays unchanged until Save | Complete |
| Undo and recovery | Templates, variations, inspiration and AI are reversible | Session Undo plus up to 20 reachable draft snapshots | Restore captures the current draft first | Complete |
| Formatting | Equal state produces byte-identical output | Authored text leads; selected ingredients remain selected | No random connectors, hidden boosters, or generic headings | Complete |
| Local suggestions | Typing searches the bundled taxonomy only | Suggested tags require selection | Weak matches are suppressed | Complete |
| Local AI | Only an explicit AI action contacts a configured private address | Sends authored words and ingredient labels; Library waits for Save | Empty, unchanged, explanatory, long, timed-out or cancelled output leaves draft untouched | Complete |
| References | Upload stores a bounded local working copy | Analysis remains `Not analyzed` until explicit local vision action | Invalid files and text-only models show honest errors | Complete |
| Templates | Built-ins use exact IDs only | Unmapped display labels remain authored template text | Never fuzzy-select an unrelated tag | Complete |
| Inspiration | Images are optional offline sparks | Every application snapshots and requires a deliberate action | Missing images do not change prompt state | Complete |
| Backup/restore | Complete backups exclude credentials | Restore validates before merge/replace; replace captures recovery | Failed restore leaves state unchanged | Complete |
| PWA update | Current draft is flushed before reload | Service worker precaches the app, taxonomy and inspiration pack | Update failure keeps the current app usable | Complete |

## Invariants

- Authored text is never moderated, sanitized, silently rewritten, or automatically transmitted.
- Filtered discovery never removes an existing selection, saved prompt, import, reference, or copied phrase.
- Preview operations never update a named Library prompt.
- No production path returns mock image analysis, simulated connection success, or fixed placeholder tags.
- No public/cloud AI endpoint, API key, gateway, analytics, or automatic diagnostic transmission exists.
