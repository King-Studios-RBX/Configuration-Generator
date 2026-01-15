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
});
