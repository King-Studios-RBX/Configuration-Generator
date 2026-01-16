#!/usr/bin/env node
import { promises as fs } from "node:fs";
import { compileConfiguration } from "./commands/compile";
import { fetchConfig } from "./commands/fetch";
import { verifySheetsAccess } from "./commands/verify";
import { compileConfig } from "./config_generator";

interface Options {
	inputDir?: string; // CSV input directory
	outputDir?: string; // Generated output directory
}

function parseOptions(args: string[]): { cmd: string; args: string[]; options: Options } {
	const options: Options = {};
	const filteredArgs = [];

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--input-dir" && args[i + 1]) {
			options.inputDir = args[++i];
		} else if (args[i] === "--output-dir" && args[i + 1]) {
			options.outputDir = args[++i];
		} else {
			filteredArgs.push(args[i]);
		}
	}

	const cmd = filteredArgs[0] || "";
	return { cmd, args: filteredArgs.slice(1), options };
}

async function main() {
	const [, , ...argv] = process.argv;
	const { cmd, args, options } = parseOptions(argv);

	if (!cmd || cmd === "--help" || cmd === "-h") {
		console.log(`
Config Generator CLI - Reusable configuration tool for any project

Usage:
  configgen compile <input.csv> [output.json]   Convert CSV to JSON
  configgen build                                Generate TypeScript from all CSVs
  configgen fetch                                Fetch config from Google Sheets
  configgen verify                               Verify Google Sheets access
  configgen --help                               Show this help

Options (all commands):
  --input-dir <path>                 CSV input directory (default: ./config/csv)
  --output-dir <path>                Output directory (default: ./dist/generated)

Examples:
  configgen compile ./config/csv/heroes.csv
  configgen compile ./config/csv/heroes.csv ./heroes.json
  configgen build
  configgen build --output-dir ./src/generated
  configgen fetch --input-dir ./my-config
  configgen verify

Environment variables (optional for Google Sheets):
  GOOGLE_SERVICE_ACCOUNT_KEY_PATH    Path to service account JSON
  GOOGLE_SHEETS_ID                   Google Sheets document ID
  SHEETS_MAPPING                     Sheet name mappings (CSV:SheetName,...)
  STRICT_CONFIG_MODE                 Exit with error if fetch fails
`);
		return;
	}

	try {
		switch (cmd) {
			case "compile": {
				const input = args[0];
				const output = args[1];
				if (!input) {
					console.error("Missing <input.csv>\nUsage: configgen compile <input.csv> [output.json]");
					process.exit(1);
				}
				const { data } = await compileConfig(input);
				const json = JSON.stringify(data, null, 2);
				if (output) {
					await fs.writeFile(output, json, "utf-8");
					console.log(`✅ Written to ${output}`);
				} else {
					console.log(json);
				}
				break;
			}

			case "build": {
				await compileConfiguration(options);
				break;
			}

			case "fetch": {
				await fetchConfig(options);
				break;
			}

			case "verify": {
				await verifySheetsAccess(options);
				break;
			}

			default: {
				console.error(`❌ Unknown command: ${cmd}`);
				console.error(`Run 'configgen --help' for usage information`);
				process.exit(1);
			}
		}
	} catch (error) {
		console.error("❌ Error:", error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
