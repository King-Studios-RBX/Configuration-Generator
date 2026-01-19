# Contributing

Thanks for helping improve Configuration Generator! This guide explains how to set up your environment, make changes, and submit a pull request.

## Ground rules

- Be respectful and keep discussions constructive.
- Avoid committing secrets (service account keys, real sheet IDs) or production data.
- Prefer small, focused PRs with clear context and tests where reasonable.

## Getting set up

1. Install [Bun](https://bun.sh) 1.3.x or newer.
2. Install dependencies: `bun install`
3. (Optional) Copy `.env.example` to `.env` and fill in Google Sheets variables if you plan to use `fetch`/`verify`.
4. Run tests once to ensure your environment is healthy: `bun test`

## Development workflow

- Lint: `bun run lint`
- Tests: `bun test`
- Compile configs: `bun run compile` (outputs to `dist/generated` by default)
- Build the CLI bundle: `bun run build`
- Fetch from Google Sheets: `bun run fetch`

Before opening a PR, run lint and tests. If your change affects generated config outputs, commit the updated files in `dist/generated/` as well.

## Commit conventions

Commitlint enforces [Conventional Commits](https://www.conventionalcommits.org/). Examples:
- `feat: add hero rarity column`
- `fix: handle quoted multiline fields`
- `chore: bump dependencies`

Husky hooks are installed via `bun install`; if theyre missing, rerun `bun install`.

## Pull request checklist

- ✅ Description of the change and why its needed
- ✅ Tests updated or added when appropriate
- ✅ `bun run lint` and `bun test` pass locally
- ✅ Docs updated (README or inline comments) if behavior changes
- ✅ No secrets or personal data committed

## Reporting issues

When filing an issue, please include:
- What you expected vs. what happened
- Steps to reproduce (commands, sample CSV snippet, or sheet mapping)
- Relevant environment info (OS, Bun version, whether Google Sheets is configured)

Thanks for contributing! 🙌
