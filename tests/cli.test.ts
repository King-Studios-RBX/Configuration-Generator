import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

describe("CLI", () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-test-"));
	});

	afterEach(async () => {
		try {
			await fs.rm(tmpDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it("should show help with --help flag", () => {
		const output = execSync("node dist/cli.js --help", { encoding: "utf-8" });
		expect(output).toContain("Config Generator CLI");
		expect(output).toContain("configgen compile");
		expect(output).toContain("--input-dir");
		expect(output).toContain("--output-dir");
	});

	it("should show help with -h flag", () => {
		const output = execSync("node dist/cli.js -h", { encoding: "utf-8" });
		expect(output).toContain("Config Generator CLI");
	});

	it("should show help when no command provided", () => {
		const output = execSync("node dist/cli.js", { encoding: "utf-8" });
		expect(output).toContain("Config Generator CLI");
	});

	it("should fail on unknown command", () => {
		try {
			execSync("node dist/cli.js unknown", { encoding: "utf-8" });
			expect(true).toBe(false); // Should fail
		} catch (error: any) {
			expect(error.status).toBeGreaterThan(0);
		}
	});

	it("should compile CSV to JSON and output to stdout", async () => {
		const csvDir = path.join(tmpDir, "csv");
		await fs.mkdir(csvDir, { recursive: true });
		const csvPath = path.join(csvDir, "test.csv");
		await fs.writeFile(csvPath, "id,name\n1,Test");

		const output = execSync(`node dist/cli.js compile ${csvPath}`, { encoding: "utf-8" });
		const json = JSON.parse(output);
		expect(Array.isArray(json)).toBe(true);
		expect(json[0]).toEqual({ id: 1, name: "Test" });
	});

	it("should compile CSV to JSON file", async () => {
		const csvDir = path.join(tmpDir, "csv");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(csvDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });

		const csvPath = path.join(csvDir, "test.csv");
		const outputPath = path.join(outputDir, "test.json");
		await fs.writeFile(csvPath, "id,name\n1,Test");

		const output = execSync(`node dist/cli.js compile ${csvPath} ${outputPath}`, {
			encoding: "utf-8",
		});
		expect(output).toContain("Written to");

		const content = await fs.readFile(outputPath, "utf-8");
		const json = JSON.parse(content);
		expect(json[0]).toEqual({ id: 1, name: "Test" });
	});

	it("should fail compile with missing CSV", () => {
		try {
			execSync("node dist/cli.js compile", { encoding: "utf-8" });
			expect(true).toBe(false);
		} catch (error: any) {
			expect(error.stderr.toString()).toContain("Missing <input.csv>");
		}
	});

	it("should run build with custom directories", async () => {
		const csvDir = path.join(tmpDir, "my-csvs");
		const outputDir = path.join(tmpDir, "output");
		await fs.mkdir(csvDir, { recursive: true });
		await fs.mkdir(outputDir, { recursive: true });
		await fs.writeFile(path.join(csvDir, "test.csv"), "id,name\n1,Test");

		const output = execSync(
			`node dist/cli.js build --input-dir ${csvDir} --output-dir ${outputDir}`,
			{ encoding: "utf-8" },
		);
		expect(output).toContain("Compiling configuration");
		expect(output).toContain("Configuration compiled successfully");

		const files = await fs.readdir(outputDir);
		expect(files).toContain("test.ts");
	});
});
