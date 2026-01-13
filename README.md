# Configuration Generator (Open Source)

An open-source configuration generator that lets non-programmers edit game/app configuration via Google Sheets or CSV, then compiles to TypeScript artifacts you can consume from a private npm package.

## Features

- Edit config in Google Sheets or local CSV
- Fetch sheets into CSV with a service account
- Compile CSV to typed TypeScript modules under `src/generated/`
- Auto-infer column types (number, boolean, string)
- Lightweight CLI for CSV -> JSON (`configgen compile`)
- Bun-native test suite via `bun:test`

## Quick Start

1. Install dependencies:

```bash
bun install
```

2. Configure Google Sheets (optional):
- Copy `.env.example` to `.env` and fill values
- Ensure your sheet is shared with the service account
- `SHEETS_MAPPING` is optional. Leave it empty to auto-discover every tab and write CSVs using slugified tab names. Only set it if you want custom CSV filenames or to fetch specific tabs.

3. Fetch and compile:

```bash
# Fetch from Google Sheets -> CSV files
bun run scripts/fetch-config.ts

# Compile CSV -> TypeScript modules (under src/generated) and update src/index.ts
bun run scripts/compile-config.ts

# Or do both in one step
bun run sync-config
```

4. Run tests:

```bash
bun test
```

## CLI Usage

The package publishes a small CLI for CSV -> JSON conversion:

```bash
# Compile a single CSV to JSON (stdout)
configgen compile ./config/csv/example-heroes.csv

# Or write to a file
configgen compile ./config/csv/example-heroes.csv ./heroes.json
```

For full Google Sheets fetching and TypeScript generation, use the Bun scripts above.

## Use as a Private Package

- Build the library:

```bash
bun run build
```

- Publish to your private registry (e.g., GitHub Packages or npm with access controls). Then, in your configuration repository:

```ts
import { heroes } from "@your-scope/config-generator";
```

## Project Layout

- `scripts/fetch-config.ts`: Fetch Google Sheets -> CSV
- `scripts/compile-config.ts`: Compile CSV -> TS modules
- `src/config_generator.ts`: Library API to read CSV and infer types
- `src/cli.ts`: Minimal CLI for CSV -> JSON
- `tests/`: Bun tests
- `config/csv/`: Example CSVs and your real ones

## Environment

If using Sheets fetching, ensure `.env` exists with:
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`
- `GOOGLE_SHEETS_ID`
- `SHEETS_MAPPING`
- Optional: `STRICT_CONFIG_MODE`

## License

MIT
