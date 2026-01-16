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

/**
 * Reads a CSV file and returns typed records with inferred column types.
 * No files are written; this is a pure function suitable for tests and programmatic use.
 */
export async function compileConfig<T extends Record<string, unknown>>(
	csvFilePath: string,
): Promise<{ data: T[]; types: InferredTypes }> {
	const csvContent = await fs.readFile(csvFilePath, "utf-8");
	const rows = parse(csvContent, {
		columns: true,
		skip_empty_lines: true,
		trim: true,
	}) as Record<string, string>[];

	if (rows.length === 0) {
		return { data: [], types: {} };
	}

	// Infer types per column across all rows
	const types: InferredTypes = {};
	const sample = rows.length > 0 ? rows[0] : {};
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
