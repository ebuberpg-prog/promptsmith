# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.0.x | Yes |
| Earlier development builds | No |

Security fixes are applied to the latest v1 release. This project does not currently promise long-term support for older browser bundles.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose user prompts, reference images, API credentials, backups, or provider requests.

Use [GitHub private vulnerability reporting](https://github.com/ebuberpg-prog/promptsmith/security/advisories/new) and include:

- A concise description and affected version
- Reproduction steps or a proof of concept
- Expected versus observed behavior
- Browser, operating system, and deployment URL
- Potential impact
- Any suggested mitigation

You should receive an acknowledgement within seven days. There is currently no paid bug-bounty program.

## Security boundaries

MUSE is a static local-first application, but it still handles sensitive creative data and optional provider credentials.

- The workspace is stored in browser storage and inherits the security of the browser profile and device account.
- Cloud API keys are session-only and excluded from durable storage and backups.
- Complete backups and prompt exports are unencrypted files after download.
- Reference images are stored locally but may be sent to a provider after an explicit vision/AI action.
- Provider URLs and the optional gateway are user-configurable trust boundaries.
- GitHub Pages provides the production application bundle and service-worker updates.

## Safe usage

- Use a supported, updated browser and operating system.
- Do not enter a provider key on a shared or untrusted device.
- Configure only provider and gateway URLs you trust.
- Review the active provider before invoking an AI action.
- Store exported backups securely; they can contain prompts and reference images.
- Verify the deployment URL before installing the PWA or entering credentials.

## Maintainer release requirements

- Use a supported Node.js LTS release.
- Keep the lockfile committed and install CI dependencies with `npm ci`.
- Require lint, unit/integration, production build, desktop/mobile browser, accessibility, migration, and offline checks before deployment.
- Deploy through the protected `github-pages` environment.
- Review dependency and GitHub Action updates before release.
