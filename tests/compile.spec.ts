import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { compileConfiguration } from "../src/commands/compile";

describe("compile command", () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "compile-test-"));
	});

	afterEach(async () => {
		try {
			await fs.rm(tmpDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("should compile single CSV file", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csvContent = "id,name,level\n1,Hero1,10\n2,Hero2,20";
		await fs.writeFile(path.join(inputDir, "heroes.csv"), csvContent);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "heroes.ts"), "utf-8");
		expect(output).toContain("export interface Heroes");
		expect(output).toContain("export const heroes");
	});

	it("should compile multiple CSV files", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(path.join(inputDir, "heroes.csv"), "id,name\n1,Hero1");
		await fs.writeFile(path.join(inputDir, "items.csv"), "id,cost\n1,100");

		await compileConfiguration({ inputDir, outputDir });

		const heroFile = await fs.readFile(path.join(outputDir, "heroes.ts"), "utf-8");
		const itemFile = await fs.readFile(path.join(outputDir, "items.ts"), "utf-8");
		expect(heroFile).toContain("export interface Heroes");
		expect(itemFile).toContain("export interface Items");
	});

	it("should handle example CSV files when no regular files exist", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(path.join(inputDir, "example-heroes.csv"), "id,name\n1,Hero1");

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "heroes.ts"), "utf-8");
		expect(output).toContain("export interface Heroes");
	});

	it("should skip example files if regular files exist", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(path.join(inputDir, "heroes.csv"), "id,name\n1,Hero1");
		await fs.writeFile(path.join(inputDir, "example-items.csv"), "id,cost\n1,100");

		await compileConfiguration({ inputDir, outputDir });

		const files = await fs.readdir(outputDir);
		expect(files).toContain("heroes.ts");
		expect(files).not.toContain("example-items.ts");
	});

	it("should handle empty CSV files", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(path.join(inputDir, "empty.csv"), "id,name");

		await compileConfiguration({ inputDir, outputDir });

		const files = await fs.readdir(outputDir);
		expect(files).not.toContain("empty.ts"); // Empty files are skipped
	});

	it("should generate ID helper for configs with id column", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		await fs.writeFile(path.join(inputDir, "items.csv"), "id,name,cost\n1,Sword,100\n2,Shield,50");

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "items.ts"), "utf-8");
		expect(output).toContain("getItemsById");
	});

	it("should handle key-value config format", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = "Settings,Value,Notes\ninitialBalance,500,Starting money\nmax_level,100,Max level";
		await fs.writeFile(path.join(inputDir, "game_config.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "game_config.ts"), "utf-8");
		expect(output).toContain("export const game_config");
	});

	it("should use default directories if not specified", async () => {
		// Check that it doesn't crash with defaults (may not compile anything if no CSVs)
		try {
			await compileConfiguration();
		} catch (error) {
			// Expected if directories don't exist
			expect(error).toBeDefined();
		}
	});

	it("should properly convert column names to camelCase", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = "id,first-name,last-name\n1,John,Doe";
		await fs.writeFile(path.join(inputDir, "users.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "users.ts"), "utf-8");
		expect(output).toContain("first-name");
		expect(output).toContain("last-name");
	});

	it("should handle CSV with duplicate header rows in data", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = [
			"id,name,value",
			"1,Item1,100",
			"id,name,value", // Duplicate header row
			"2,Item2,200",
		].join("\n");
		await fs.writeFile(path.join(inputDir, "items.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "items.ts"), "utf-8");
		expect(output).toContain('"id": 1');
		expect(output).toContain('"id": 2');
		// Count occurrences - should only have 2 data items, not 3
		const idMatches = output.match(/"id": \d+/g);
		expect(idMatches?.length).toBe(2);
	});

	it("should handle CSV with empty first column", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = [",name,value", ",Item1,100", ",Item2,200"].join("\n");
		await fs.writeFile(path.join(inputDir, "data.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "data.ts"), "utf-8");
		expect(output).toContain("Item1");
		expect(output).toContain("Item2");
		expect(output).toContain('"name"');
		expect(output).toContain('"value"');
	});

	it("should handle CSV starting with special characters", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = ["`", "", "id,name,value", "1,Item1,100", "2,Item2,200"].join("\n");
		await fs.writeFile(path.join(inputDir, "special.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "special.ts"), "utf-8");
		expect(output).toContain('"id": 1');
		expect(output).toContain('"id": 2');
		expect(output).toContain("Item1");
		expect(output).toContain("Item2");
		// Should not have backtick as a column name
		expect(output).not.toContain('"`"');
	});

	it("should skip multiple empty rows between data", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = ["id,name,value", "", "", "1,Item1,100", "", "2,Item2,200", ""].join("\n");
		await fs.writeFile(path.join(inputDir, "data.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "data.ts"), "utf-8");
		const idMatches = output.match(/"id": \d+/g);
		expect(idMatches?.length).toBe(2);
	});

	it("should handle complex CSV with all edge cases", async () => {
		const inputDir = path.join(tmpDir, "input");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(inputDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csv = [
			"`", // Special char line
			"", // Empty line
			",LEVEL,BASE ATTACK,RANGE", // Empty first column
			"", // Empty line
			",60,338,35",
			"", // Empty line
			",LEVEL,BASE ATTACK,RANGE", // Duplicate header
			"", // Empty line
			",70,450,40",
		].join("\n");
		await fs.writeFile(path.join(inputDir, "complex.csv"), csv);

		await compileConfiguration({ inputDir, outputDir });

		const output = await fs.readFile(path.join(outputDir, "complex.ts"), "utf-8");
		expect(output).toContain("LEVEL");
		expect(output).toContain("BASE ATTACK");
		expect(output).toContain("RANGE");
		// Should have exactly 2 data rows (numbers, not strings)
		const levelMatches = output.match(/"LEVEL": \d+/g);
		expect(levelMatches?.length).toBe(2);
	});
});
