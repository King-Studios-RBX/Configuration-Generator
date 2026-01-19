# Configuration Generator

A reusable, typed configuration pipeline for TypeScript projects. Edit configuration in Google Sheets or CSV, then generate strongly-typed TypeScript modules that your game or app can import directly.

## Highlights

- **CSV → Typed TS**: Infers column types and emits interfaces plus data arrays (and helper getters when an `id` column exists).
- **Google Sheets support**: Fetch sheets as CSV using a service account, with optional tab-to-filename mapping.
- **CLI-ready**: Ships a `configgen` binary with `compile`, `build`, `fetch`, and `verify` commands.
- **Flexible defaults**: Uses `config/csv` for inputs and `dist/generated` for outputs; configurable via flags.
- **Bun-first toolchain**: Uses Bun for scripts, testing, and bundling.

## Requirements

- Bun **1.3.x** or newer
- Node.js 18+ recommended for tooling compatibility
- (Optional) Google Cloud project with Sheets API enabled and a service account that can read your spreadsheet

## Quick start

1. Install dependencies with Bun.
2. Copy `.env.example` to `.env` and fill in Google Sheets details if you want remote fetching.
3. Put your CSV files in `config/csv/` (sample CSVs are already provided).
4. Generate typed modules to `dist/generated/`:
   - `bun run compile` — compile all CSVs
   - `bun run build` — bundle the CLI (`dist/cli.js`) and compile configs

You can also target a different output directory:
- `bun run compile --output-dir ./src/generated`

## CLI usage (local binary)

After running `bun run build`, use the bundled CLI:

```
configgen compile <input.csv> [output.json]   Convert a single CSV to JSON (prints to stdout if no output file)
configgen build                                Compile all CSVs to typed TS modules
configgen fetch                                Pull CSVs from Google Sheets into config/csv
configgen verify                               Check service-account access to the sheet

Options (all commands):
  --input-dir <path>   CSV input directory (default: ./config/csv)
  --output-dir <path>  Output directory for generated TS (default: ./dist/generated)
```

Script equivalents:
- `bun run fetch` — fetch from Google Sheets
- `bun run compile` — compile CSVs
- `bun run verify` — validate service account + sheet access
- `bun run sync` — fetch, then compile

## Google Sheets setup (optional)

Environment variables (see `.env.example`):

- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` — path to your service account JSON key
- `GOOGLE_SHEETS_ID` — spreadsheet ID from the Sheets URL
- `SHEETS_MAPPING` — optional CSV-to-sheet mapping (`csvName:Sheet Name,csv2:Another Tab`); if omitted, all tabs are auto-discovered and slugified
- `STRICT_CONFIG_MODE` — when `true`, `fetch` exits non-zero if any sheet fails

Steps:
1. Create a Google Cloud project and enable the **Google Sheets API**.
2. Create a service account, download the JSON key, and save it (e.g., `service-account-key.json`).
3. Share the spreadsheet with the service account email.
4. Populate the variables above (copy `.env.example` to `.env`).

## Project layout

- `config/csv/` — source CSVs (fetched or hand-edited)
- `dist/generated/` — generated TypeScript modules
- `src/cli.ts` — command-line entrypoint
- `src/commands/` — implementations for `compile`, `fetch`, and `verify`
- `src/config_generator.ts` — pure CSV compiler used by the CLI and tests
- `tests/` — Bun-based test suite

## Development

- Install deps: `bun install`
- Lint: `bun run lint`
- Tests: `bun test`
- Bundle + compile: `bun run build`

Commit hooks (Husky) and commitlint (conventional commits) are set up via `prepare`. If hooks aren1t installed, run `bun install` to bootstrap them.

## Publishing / consuming

- The npm `bin` points to `dist/cli.js` as `configgen`. Running `bun run build` refreshes it.
- When used as a library, you can import the pure compiler `compileConfig` from `src/config_generator.ts` for programmatic CSV parsing and type inference.

## Troubleshooting

- **Fetch succeeds but types look wrong**: ensure columns are consistent; mixed strings force the column to `string`.
- **Service account can1t read**: verify the spreadsheet is shared with the account email; re-check `GOOGLE_SHEETS_ID`.
- **No CSV files found**: `compile` skips `example-*` CSVs unless no other CSVs exist; drop the `example-` prefix to include them.
