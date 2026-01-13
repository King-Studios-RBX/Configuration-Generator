// tests/config_generator.test.ts
import { describe, it, expect } from "bun:test";
import { compileConfig } from "../src/config_generator";
import { promises as fs } from "fs";
import * as os from "os";
import * as path from "path";

describe("Configuration Generator", () => {
	it("should compile CSV correctly", async () => {
		// Create a temporary CSV file
		const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "configgen-"));
		const csvPath = path.join(tmpDir, "heroes.csv");
		const csv = ["id,name,power,isLegendary", "1,Goku,9001,true", "2,Vegeta,8500,false"].join("\n");
		await fs.writeFile(csvPath, csv, "utf-8");

		const { data, types } = await compileConfig(csvPath);
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBe(2);
		expect(types).toEqual({
			id: "number",
			name: "string",
			power: "number",
			isLegendary: "boolean",
		});
		expect(data[0]).toEqual({ id: 1, name: "Goku", power: 9001, isLegendary: true });
	});
});
