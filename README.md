# Anime-Reborn-Template

A private Roblox game template for Anime Reborn, using Roblox-TS, Bun, Rokit (with Rojo), and Turbo for fast builds and caching.

## What’s Inside
- Bun-based tooling and scripts
- Rokit-managed Rojo install (preinstalled in the dev container)
- Roblox-TS setup with strict TypeScript
- Turbo tasks for builds and watch workflows
- Husky + Commitlint + Biome + cspell for quality gates
- Dev container for consistent, ready-to-code environment

## Requirements
- **Recommended**: Docker + VSCode Dev Containers (works best on Windows too)
- **CLI**: Bun and Rokit (Rokit installs Rojo)
- Optional: Zed (dev container supported; VSCode is fully recommended)

## Quickstart (Dev Container)
1. Install Docker and VSCode
2. Install the Dev Containers extension
3. Open the repo; reopen in container when prompted
4. Everything (Rokit/Rojo, Bun deps) is preinstalled

## Quickstart (Local)
1. Install Bun and Rokit
2. Clone your fork: `git clone <your-fork-url>`
3. Install deps: `bun install`
4. Run dev: `bun run dev` (Rojo serve + watch)

## Tasks (Turbo / Bun)
- **Build**: `turbo run build` — compile TS and emit `default.rbxl`
- **Compile**: `turbo run compile` — rbxtsc with incremental builds
- **Watch**: `turbo run watch` — watch TS changes (no cache)
- **Dev**: `bun run dev` — Rojo serve + Turbo watch concurrently

## Project Layout
- `src/` — TypeScript game/client code
- `include/` — Luau/TS runtime includes
- `dist/` — compiled output
- `default.project.json` — Rojo project file

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). Please use conventional commits and keep PRs focused.

## License & Ownership
This project is **private and proprietary**. Copyright (c) 2026 King Studios. Code owners: Matthew Radulovich and royalty-based contributors under King Studios. No sharing, selling, or distribution without explicit permission. See [LICENSE](LICENSE) for full terms.
