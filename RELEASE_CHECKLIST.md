# MUSE release checklist

Use this checklist for production GitHub Pages releases and version tags.

## 1. Prepare

- [ ] Confirm `package.json` and `CHANGELOG.md` use the intended version.
- [ ] Use Node 24 LTS (`nvm use` reads `.nvmrc`).
- [ ] Run `npm ci` from the committed lockfile.
- [ ] Review `git status --short`; exclude audit captures and unrelated local files.
- [ ] Confirm documentation matches the current interface and storage behavior.
- [ ] Export a real workspace backup and restore it into a disposable browser profile for high-risk storage changes.

## 2. Local release gate

```bash
npm run lint
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=moderate
```

- [ ] Lint passes with zero warnings.
- [ ] Unit/integration tests pass.
- [ ] Production build succeeds.
- [ ] Desktop and mobile Playwright projects pass.
- [ ] Accessibility checks report no serious or critical violations in the covered flow.
- [ ] Legacy migration and offline PWA reload tests pass.
- [ ] Production dependencies report zero known advisories.
- [ ] Review and record any development-tooling advisories that require a future major upgrade.
- [ ] Review bundle and PWA precache sizes for unexpected growth.

## 3. Publish to `main`

- [ ] Commit only the reviewed release files.
- [ ] Push `main`.
- [ ] Open the [Deploy to GitHub Pages workflow](https://github.com/ebuberpg-prog/promptsmith/actions/workflows/deploy.yml).
- [ ] Confirm the build job passes lint, tests, build, and browser release tests.
- [ ] Confirm the deploy job succeeds in the `github-pages` environment.

Do not tag the release while Pages still serves an older bundle.

## 4. Verify production

- [ ] Open `https://ebuberpg-prog.github.io/promptsmith/` in a clean browser profile.
- [ ] Confirm the deployed HTML references the new production asset hashes.
- [ ] Complete Describe → Craft → Save → Library → Open in Craft.
- [ ] Confirm authored text is unchanged after save/reopen and variation actions.
- [ ] Check the tag Library guided state and complete taxonomy route.
- [ ] Reload once online, then reload offline with the draft preserved.
- [ ] Confirm **Settings → Data → Check now** reports the current PWA version state.
- [ ] Check one mobile viewport and one desktop viewport.

## 5. Tag and release

After production verification:

```bash
git tag -a v1.0.0 -m "MUSE v1.0.0"
git push origin v1.0.0
gh release create v1.0.0 --title "MUSE v1.0.0" --generate-notes --notes "See CHANGELOG.md for the curated v1.0.0 product summary."
```

- [ ] Confirm the tag points to the verified production commit.
- [ ] Create the GitHub release from the matching changelog section.
- [ ] Link the live app and user guide in the release notes.

## 6. Rollback

If production is broken:

1. Stop promotion/tagging.
2. Identify the last known-good commit and Pages workflow run.
3. Revert the failing commit with a new commit; do not rewrite published `main` history.
4. Push the revert and monitor Pages until the known-good bundle is live again.
5. Document the incident and add a regression test before the next release.
