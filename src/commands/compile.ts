import { promises as fs } from "node:fs";
import * as path from "node:path";
import { parse } from "csv-parse/sync";

interface CsvRecord {
	[key: string]: string;
}

function parseCSVWithQuotes(csvContent: string): CsvRecord[] {
	const records: CsvRecord[] = [];
	const lines = csvContent.split("\n");

	if (lines.length === 0) {
		return records;
	}

	// Skip empty lines to find the actual header
	let headerIndex = 0;
	let headerLine = "";
	while (headerIndex < lines.length && !lines[headerIndex]?.trim()) {
		headerIndex++;
	}

	if (headerIndex >= lines.length) {
		return records;
	}

	headerLine = lines[headerIndex] ?? "";

	// Parse header with quote awareness
	const headers: string[] = [];
	let currentHeader = "";
	let inQuotes = false;

	for (let i = 0; i < headerLine.length; i++) {
		const char = headerLine[i];
		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === "," && !inQuotes) {
			headers.push(currentHeader.trim().replace(/^"|"$/g, ""));
			currentHeader = "";
		} else {
			currentHeader += char;
		}
	}
	headers.push(currentHeader.trim().replace(/^"|"$/g, ""));

	// Parse data rows - skip empty lines and parse quoted fields properly
	let i = headerIndex + 1;
	while (i < lines.length) {
		let currentLine = lines[i] ?? "";

		// Skip empty lines
		if (!currentLine?.trim()) {
			i++;
			continue;
		}

		// Check if line has unclosed quotes - if so, accumulate lines until quotes are closed
		let unclosedQuotes = false;
		let quoteCount = 0;
		for (const char of currentLine) {
			if (char === '"') quoteCount++;
		}
		unclosedQuotes = quoteCount % 2 === 1;

		// Accumulate lines while quotes are unclosed
		while (unclosedQuotes && i + 1 < lines.length) {
			i++;
			const nextLine = lines[i];
			if (nextLine) {
				currentLine += `\n${nextLine}`;
				for (const char of nextLine) {
					if (char === '"') quoteCount++;
				}
				unclosedQuotes = quoteCount % 2 === 1;
			}
		}

		// Parse the complete line
		const values = extractFieldsFromLine(currentLine);

		// Only add rows that have at least one non-empty value
		if (values.some((v) => v.trim())) {
			const record: CsvRecord = {};
			headers.forEach((header, index) => {
				record[header] = values[index] ?? "";
			});
			records.push(record);
		}

		i++;
	}

	return records;
}

function extractFieldsFromLine(line: string): string[] {
	const fields: string[] = [];
	let currentValue = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			inQuotes = !inQuotes;
			currentValue += char;
		} else if (char === "," && !inQuotes) {
			fields.push(currentValue.trim().replace(/^"|"$/g, ""));
			currentValue = "";
		} else {
			currentValue += char;
		}
	}
	fields.push(currentValue.trim().replace(/^"|"$/g, ""));

	return fields;
}

function inferType(value: string): string {
	const trimmedValue = value.trim();

	if (trimmedValue === "") {
		return "string";
	}

	if (trimmedValue === "true" || trimmedValue === "false") {
		return "boolean";
	}

	const num = Number(trimmedValue);
	if (!Number.isNaN(num) && Number.isFinite(num) && !/^0\d/.test(trimmedValue)) {
		return "number";
	}

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
	return str.replace(/-([a-z])/g, (g) => g[1]?.toUpperCase() ?? "");
}

function toPascalCase(str: string): string {
	const camel = toCamelCase(str);
	return camel.charAt(0).toUpperCase() + camel.slice(1);
}

interface CompileOptions {
	inputDir?: string;
	outputDir?: string;
}

export async function compileConfiguration(options?: CompileOptions) {
	console.log("🔧 Compiling configuration from CSV files...");

	const csvDir = options?.inputDir || path.join(process.cwd(), "config", "csv");
	const outputDir = options?.outputDir || path.join(process.cwd(), "dist", "generated");

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

	for (const file of filesToProcess) {
		try {
			console.log(`  📝 Processing ${file}...`);

			const csvPath = path.join(csvDir, file);
			const csvContent = await fs.readFile(csvPath, "utf-8");

			// Parse CSV using fallback parser by default for Google Sheets CSVs
			// which often have complex quoted fields with newlines and commas
			let records: CsvRecord[] = [];

			try {
				// Try standard parsing first with strict settings
				records = parse(csvContent, {
					columns: true,
					skip_empty_lines: true,
					trim: true,
				}) as CsvRecord[];
			} catch {
				// If standard parsing fails, use quote-aware manual parser
				records = parseCSVWithQuotes(csvContent);
			}

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
			if (!firstRecord) {
				console.log(`    ⚠️  ${file} has no valid records, skipping`);
				continue;
			}
			const typeMap: { [key: string]: string } = {};

			for (const key of Object.keys(firstRecord)) {
				// Check all records to infer the most appropriate type
				const types = new Set<string>();
				for (const record of records) {
					types.add(inferType(record[key] ?? ""));
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
			const firstRecordKeys = Object.keys(firstRecord);
			const isKeyValueConfig =
				firstRecordKeys.length >= 2 &&
				firstRecordKeys.includes("key") &&
				firstRecordKeys.includes("value");

			if (isKeyValueConfig) {
				// Generate a flat config object
				const configInterface = `export interface ${typeName}Config {\n${records
					.map((record) => {
						const key = record.key ?? "";
						const value = record.value ?? "";
						const type = inferType(value);
						const description = record.description || "";
						return `  /** ${description} */\n  ${key}: ${type};`;
					})
					.join("\n")}\n}`;

				const configData = `export const ${variableName}Config: ${typeName}Config = {\n${records
					.map((record) => {
						const key = record.key ?? "";
						const value = record.value ?? "";
						const type = inferType(value);
						return `  ${key}: ${convertValue(value, type)},`;
					})
					.join("\n")}\n};`;

				const configContent = `${configInterface}\n\n${configData}\n`;
				const configFile = path.join(outputDir, `${configName}.ts`);
				await fs.writeFile(configFile, configContent);
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

				const fullContent = `${interfaceContent}\n\n${dataContent}${firstRecordKeys.includes("id") ? helperContent : ""}\n`;

				const outputFile = path.join(outputDir, `${configName}.ts`);
				await fs.writeFile(outputFile, fullContent);
			}

			console.log(`    ✅ Generated ${configName}.ts`);
		} catch (error) {
			console.error(
				`    ❌ Error processing ${file}:`,
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	console.log("✅ Configuration compiled successfully");
}
