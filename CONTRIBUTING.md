# Contributing to Anime-Reborn-Template

Thank you for your interest in contributing! We welcome all contributions, including bug reports, feature requests, and code improvements.

## Development Environment Setup

### Recommended: Dev Container

This project includes a **Docker dev container** configuration for a fully isolated and consistent development environment. This is **especially recommended if you're on Windows**.

**Using VSCode (Fully Recommended):**
1. Install [Docker](https://www.docker.com/) and [VSCode](https://code.visualstudio.com/)
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Open the repository and VSCode will prompt to reopen in container
4. The container comes with **Rokit (with Rojo installed via Rokit) pre-installed** and all dependencies ready

**Using Zed:**
- Zed recently added dev container support, though VSCode provides more complete integration
- You can open this project in Zed with dev container support, though VSCode is the fully recommended editor
- Zed task definitions are included in `.zed/` for those using Zed

### Without Dev Container (Local Setup)

If you prefer local development:
1. Ensure you have [Bun](https://bun.sh/) and [Rokit](https://github.com/rojo-rbx/rokit) installed (Rokit will install Rojo for you)
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `bun install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

**Use Turbo tasks** for streamlined builds and caching. Available tasks:

- **Build**: `turbo run build` - Compiles TypeScript and generates the Roblox model file (uses cached outputs when possible)
- **Dev**: `bun run dev` - Starts Rojo serve and watches for TypeScript changes concurrently
- **Compile**: `turbo run compile` - Runs rbxtsc compiler with incremental compilation
- **Watch**: `turbo run watch` - Watches TypeScript files for changes with caching disabled

**Note:** Rojo is pre-installed in the dev container. Turbo provides intelligent task caching and parallel execution—use these instead of running commands directly when possible.

## Code Standards

- All code must pass linting with [Biome](https://biomejs.dev/)
- Use TypeScript with strict mode enabled
- Follow the project structure in `src/`
- Write clear, descriptive commit messages

## Commit Guidelines

This project uses [Commitlint](https://commitlint.js.org/) to enforce conventional commits:

```
type(scope): subject

body (optional)
footer (optional)
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example: `feat(runtime): add initial runtime setup`

## Pull Requests

1. Ensure all tests and linting pass
2. Provide a clear description of your changes
3. Reference any related issues
4. Keep PRs focused on a single feature or fix

## Reporting Issues

When reporting bugs, please include:
- A clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Your environment (OS, Bun version, etc.)

## Questions?

Feel free to open an issue with your question or start a discussion.
