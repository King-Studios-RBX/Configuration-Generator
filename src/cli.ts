#!/usr/bin/env node
import { compileConfig } from "./config_generator";
import { promises as fs } from "fs";

async function main() {
	const [, , cmd, ...args] = process.argv;
	if (!cmd || cmd === "--help" || cmd === "-h") {
		console.log(`
Configuration Generator CLI

Usage:
  configgen compile <input.csv> [output.json]

Notes:
  - For Google Sheets fetching and full TS file generation, use the Bun scripts:
    bun run scripts/fetch-config.ts
    bun run scripts/compile-config.ts
`);
		return;
	}

	if (cmd === "compile") {
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
			console.log(`Written ${output}`);
		} else {
			console.log(json);
		}
		return;
	}

	console.error(`Unknown command: ${cmd}`);
	process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
