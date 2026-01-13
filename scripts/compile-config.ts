#!/usr/bin/env bun

import { parse } from "csv-parse/sync";
import { promises as fs } from "fs";
import * as path from "path";

interface CsvRecord {
	[key: string]: string;
}

function inferType(value: string): string {
	// Trim whitespace for accurate type checking
	const trimmedValue = value.trim();

	// Check for empty or whitespace-only strings
	if (trimmedValue === "") {
		return "string";
	}

	// Check for boolean
	if (trimmedValue === "true" || trimmedValue === "false") {
		return "boolean";
	}

	// Check for number - must not be empty after trim and must parse as valid number
	// Also exclude strings that start with 0 (like zip codes) unless it's just "0" or a decimal
	const num = Number(trimmedValue);
	if (!Number.isNaN(num) && Number.isFinite(num) && !/^0\d/.test(trimmedValue)) {
		return "number";
	}

	// Default to string
	return "string";
}

function convertValue(value: string, type: string): string {
	const trimmedValue = value.trim();

	if (type === "boolean") {
		return trimmedValue;
	}
	if (type === "number") {
		return trimmedValue;
	}
	return `"${trimmedValue.replace(/"/g, '\\"')}"`;
}

function toCamelCase(str: string): string {
	return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function toPascalCase(str: string): string {
	const camel = toCamelCase(str);
	return camel.charAt(0).toUpperCase() + camel.slice(1);
}

async function compileConfiguration() {
	console.log("🔧 Compiling configuration from CSV files...");

	const csvDir = path.join(process.cwd(), "config", "csv");
	const outputDir = path.join(process.cwd(), "src", "generated");

	// Ensure output directory exists
	await fs.mkdir(outputDir, { recursive: true });

	// Read all CSV files
	const files = await fs.readdir(csvDir);
	const csvFiles = files.filter((f) => f.endsWith(".csv") && !f.startsWith("example-"));

	// If no CSV files (only examples), use example files
	const filesToProcess =
		csvFiles.length > 0
			? csvFiles
			: files.filter((f) => f.endsWith(".csv") && f.startsWith("example-"));

	if (filesToProcess.length === 0) {
		console.log("⚠️  No CSV files found to compile");
		return;
	}

	const allInterfaces: string[] = [];
	const allExports: string[] = [];
	const allImports: string[] = [];

	for (const file of filesToProcess) {
		try {
			console.log(`  📝 Processing ${file}...`);

			const csvPath = path.join(csvDir, file);
			const csvContent = await fs.readFile(csvPath, "utf-8");

			// Parse CSV
			const records = parse(csvContent, {
				columns: true,
				skip_empty_lines: true,
				trim: true,
			}) as CsvRecord[];

			if (records.length === 0) {
				console.log(`    ⚠️  ${file} is empty, skipping`);
				continue;
			}

			// Extract config name from filename
			const configName = file.replace(/^example-/, "").replace(/\.csv$/, "");
			const typeName = toPascalCase(configName);
			const variableName = toCamelCase(configName);

			// Infer types from first row
			const firstRecord = records[0];
			const typeMap: { [key: string]: string } = {};

			for (const key of Object.keys(firstRecord)) {
				// Check all records to infer the most appropriate type
				const types = new Set<string>();
				for (const record of records) {
					types.add(inferType(record[key]));
				}

				// If we have mixed types including string, use string
				if (types.has("string") && types.size > 1) {
					typeMap[key] = "string";
				} else if (types.has("boolean")) {
					typeMap[key] = "boolean";
				} else if (types.has("number")) {
					typeMap[key] = "number";
				} else {
					typeMap[key] = "string";
				}
			}

			// Special handling for key-value configs (only key and value columns)
			const isKeyValueConfig =
				Object.keys(firstRecord).length >= 2 &&
				Object.keys(firstRecord).includes("key") &&
				Object.keys(firstRecord).includes("value");

			if (isKeyValueConfig) {
				// Generate a flat config object
				const configInterface = `export interface ${typeName}Config {\n${records
					.map((record) => {
						const key = record.key;
						const value = record.value;
						const type = inferType(value);
						const description = record.description || "";
						return `  /** ${description} */\n  ${key}: ${type};`;
					})
					.join("\n")}\n}`;

				const configData = `export const ${variableName}Config: ${typeName}Config = {\n${records
					.map((record) => {
						const key = record.key;
						const value = record.value;
						const type = inferType(value);
						return `  ${key}: ${convertValue(value, type)},`;
					})
					.join("\n")}\n};`;

				const configContent = `${configInterface}\n\n${configData}\n`;
				const configFile = path.join(outputDir, `${configName}.ts`);
				await fs.writeFile(configFile, configContent);

				allImports.push(`export type { ${typeName}Config } from "./generated/${configName}";`);
				allImports.push(`export { ${variableName}Config } from "./generated/${configName}";`);
			} else {
				// Generate TypeScript interface
				const interfaceContent = `export interface ${typeName} {\n${Object.entries(typeMap)
					.map(([key, type]) => `  ${key}: ${type};`)
					.join("\n")}\n}`;

				// Generate data array
				const dataContent = `export const ${variableName}: ${typeName}[] = ${JSON.stringify(
					records.map((record) => {
						const obj: { [key: string]: string | number | boolean } = {};
						for (const [key, value] of Object.entries(record)) {
							const type = typeMap[key];
							if (type === "number") {
								obj[key] = Number(value);
							} else if (type === "boolean") {
								obj[key] = value === "true";
							} else {
								obj[key] = value;
							}
						}
						return obj;
					}),
					null,
					2,
				)};`;

				// Helper function to get by id
				const helperContent = `\nexport function get${typeName}ById(id: number): ${typeName} | undefined {\n  return ${variableName}.find((item) => item.id === id);\n}`;

				const fullContent = `${interfaceContent}\n\n${dataContent}${Object.keys(firstRecord).includes("id") ? helperContent : ""}\n`;

				const outputFile = path.join(outputDir, `${configName}.ts`);
				await fs.writeFile(outputFile, fullContent);

				allImports.push(`export type { ${typeName} } from "./generated/${configName}";`);
				allImports.push(
					`export { ${variableName}${Object.keys(firstRecord).includes("id") ? `, get${typeName}ById` : ""} } from "./generated/${configName}";`,
				);
			}

			console.log(`    ✅ Generated ${configName}.ts`);
		} catch (error) {
			console.error(
				`    ❌ Error processing ${file}:`,
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	// Generate index file that re-exports everything
	const indexContent = `// Auto-generated configuration exports
// This file is generated by scripts/compile-config.ts
// Do not edit manually

${allImports.join("\n")}
`;

	const indexFile = path.join(process.cwd(), "src", "index.ts");
	await fs.writeFile(indexFile, indexContent);

	console.log("✅ Configuration compiled successfully");
}

// Run the script
compileConfiguration().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
