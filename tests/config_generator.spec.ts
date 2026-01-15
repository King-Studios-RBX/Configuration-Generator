import { describe, expect, it } from "bun:test";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { compileConfig } from "../src/config_generator";

describe("compileConfig", () => {
	let tmpDir: string;

	it("should compile basic CSV correctly", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "test.csv");
		const csv = ["id,name,power", "1,Goku,9001", "2,Vegeta,8500"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBe(2);
		expect(types).toEqual({
			id: "number",
			name: "string",
			power: "number",
		});
		expect(data[0]).toEqual({ id: 1, name: "Goku", power: 9001 });
		expect(data[1]).toEqual({ id: 2, name: "Vegeta", power: 8500 });
	});

	it("should compile CSV with mixed boolean fields", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "heroes.csv");
		const csv = ["id,name,power,isLegendary", "1,Goku,9001,true", "2,Vegeta,8500,false"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(types).toEqual({
			id: "number",
			name: "string",
			power: "number",
			isLegendary: "boolean",
		});
		expect(data[0]).toEqual({ id: 1, name: "Goku", power: 9001, isLegendary: true });
		expect(data[1]).toEqual({ id: 2, name: "Vegeta", power: 8500, isLegendary: false });
	});

	it("should handle boolean types correctly", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "booleans.csv");
		const csv = ["id,active,disabled", "1,true,false", "2,false,true"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(types).toEqual({
			id: "number",
			active: "boolean",
			disabled: "boolean",
		});
		expect(data[0]).toEqual({ id: 1, active: true, disabled: false });
	});

	it("should handle mixed types in columns", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "mixed.csv");
		const csv = ["id,value", "1,100", "2,text"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { types } = await compileConfig(csvPath);
		// When mixed types exist, should default to string
		expect(types.value).toBe("string");
	});

	it("should handle empty values as strings", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "empty.csv");
		const csv = ["id,name", "1,", "2,test"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(types.name).toBe("string");
		expect(data[0].name).toBe("");
	});

	it("should handle empty CSV file", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "empty.csv");
		const csv = ["id,name"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data } = await compileConfig(csvPath);
		expect(data.length).toBe(0);
	});

	it("should handle special characters in strings", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "special.csv");
		const csv = 'id,text\n1,"Hello, World"\n2,test';
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data } = await compileConfig(csvPath);
		expect(Array.isArray(data)).toBe(true);
	});

	it("should throw error for non-existent file", async () => {
		try {
			await compileConfig("/non/existent/file.csv");
			expect(true).toBe(false); // Should not reach here
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	it("should handle numeric edge cases", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "numbers.csv");
		const csv = ["id,zero,negative,decimal", "1,0,-5,3.14", "2,999,-1000,2.71"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(types.zero).toBe("number");
		expect(types.negative).toBe("number");
		expect(types.decimal).toBe("number");
		expect(data[0]).toEqual({ id: 1, zero: 0, negative: -5, decimal: 3.14 });
	});

	it("should handle leading zeros in numbers", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "zeros.csv");
		const csv = ["id,code", "1,0123", "2,0456"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { types } = await compileConfig(csvPath);
		// Leading zeros should be treated as string to preserve format
		expect(types.code).toBe("string");
	});

	it("should handle whitespace trimming", async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "spaces.csv");
		const csv = ["id,name", "1, Goku ", "2, Vegeta "].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data } = await compileConfig(csvPath);
		expect(data[0].name).toBe("Goku");
		expect(data[1].name).toBe("Vegeta");
	});
});
