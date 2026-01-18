import { promises as fs } from "node:fs";
import { parse } from "csv-parse/sync";

export interface InferredTypes {
	[key: string]: "string" | "number" | "boolean";
}

function inferType(value: string): "string" | "number" | "boolean" {
	const trimmed = value.trim();
	if (trimmed === "") return "string";
	if (trimmed === "true" || trimmed === "false") return "boolean";
	const num = Number(trimmed);
	if (!Number.isNaN(num) && Number.isFinite(num) && !/^0\d/.test(trimmed)) return "number";
	return "string";
}

function parseCSVWithQuotes(csvContent: string): Array<Record<string, string>> {
	const records: Array<Record<string, string>> = [];
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
			const record: Record<string, string> = {};
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

/**
 * Reads a CSV file and returns typed records with inferred column types.
 * No files are written; this is a pure function suitable for tests and programmatic use.
 */
export async function compileConfig<T extends Record<string, unknown>>(
	csvFilePath: string,
): Promise<{ data: T[]; types: InferredTypes }> {
	const csvContent = await fs.readFile(csvFilePath, "utf-8");
	let rows: Record<string, string>[] = [];

	try {
		// Try standard parsing first
		rows = parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		}) as Record<string, string>[];
	} catch {
		// If standard parsing fails, use quote-aware manual parser
		rows = parseCSVWithQuotes(csvContent);
	}

	if (rows.length === 0) {
		return { data: [], types: {} };
	}

	// Infer types per column across all rows
	const types: InferredTypes = {};
	const sample = rows[0];
	if (sample) {
		for (const key of Object.keys(sample)) {
			const observed = new Set<string>();
			for (const r of rows) {
				observed.add(inferType(r[key] ?? ""));
			}
			if (observed.has("string") && observed.size > 1) types[key] = "string";
			else if (observed.has("boolean")) types[key] = "boolean";
			else if (observed.has("number")) types[key] = "number";
			else types[key] = "string";
		}
	}

	// Convert values according to inferred types
	const data = rows.map((r) => {
		const out: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(r)) {
			const t = types[key];
			if (t === "number") out[key] = Number(val.trim());
			else if (t === "boolean") out[key] = val.trim() === "true";
			else out[key] = val.trim();
		}
		return out as T;
	});

	return { data, types };
}
