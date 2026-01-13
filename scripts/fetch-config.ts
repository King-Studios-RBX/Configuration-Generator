#!/usr/bin/env bun

import { google } from "googleapis";
import { stringify } from "csv-stringify/sync";
import { promises as fs } from "fs";
import { existsSync } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local and .env (without overriding existing env)
function loadEnvFiles() {
	const envCandidates = [
		path.resolve(process.cwd(), ".env.local"),
		path.resolve(process.cwd(), ".env"),
	];
	for (const p of envCandidates) {
		if (existsSync(p)) {
			const res = dotenv.config({ path: p, override: false });
			const count = res.parsed ? Object.keys(res.parsed).length : 0;
			console.log(`📄 Loaded ${p} (${count} vars)`);
		}
	}
}
loadEnvFiles();

interface SheetMapping {
	csvFilename: string;
	sheetName: string;
}

function slugifySheetName(name: string): string {
	return (
		name
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || "sheet"
	);
}

async function fetchFromGoogleSheets() {
	console.log("🔄 Fetching configuration from Google Sheets...");

	// Check if Google Sheets is configured
	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
	const sheetsId = process.env.GOOGLE_SHEETS_ID;
	const sheetsMapping = process.env.SHEETS_MAPPING;

	if (!keyPath || !sheetsId) {
		console.log("⚠️  Google Sheets not configured. Using example CSV files instead.");
		console.log(
			"   To use Google Sheets, configure .env file with GOOGLE_SERVICE_ACCOUNT_KEY_PATH and GOOGLE_SHEETS_ID",
		);
		return;
	}

	try {
		let hadErrors = false;
		const successes: string[] = [];
		const failures: { sheet: string; error: string }[] = [];
		// Parse sheets mapping (optional). If absent, auto-fetch all tabs.
		const mappingsFromEnv: SheetMapping[] = (sheetsMapping ?? "")
			.split(",")
			.map((mapping) => mapping.trim())
			.filter(Boolean)
			.map((pair) => {
				const idx = pair.indexOf(":");
				const csvFilename = idx >= 0 ? pair.slice(0, idx).trim() : "";
				const sheetName = idx >= 0 ? pair.slice(idx + 1).trim() : "";
				return { csvFilename, sheetName } as SheetMapping;
			})
			.filter((m) => {
				const ok = m.csvFilename.length > 0 && m.sheetName.length > 0;
				if (!ok) {
					console.warn(
						`⚠️  Invalid SHEETS_MAPPING entry. Expected CSV:SheetName, got: ${JSON.stringify(m)}`,
					);
				}
				return ok;
			});

		// Load service account credentials
		const keyFile = await fs.readFile(keyPath, "utf-8");
		const credentials = JSON.parse(keyFile);
		const saEmail: string | undefined = credentials.client_email;
		console.log(
			`🔑 Using service account: ${saEmail ?? "(email not found in key)"} | Spreadsheet ID: ${sheetsId}`,
		);

		// Initialize Google Sheets API
		const auth = new google.auth.GoogleAuth({
			credentials,
			scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
		});

		const sheets = google.sheets({ version: "v4", auth });

		// If no mappings provided, auto-discover all sheet tabs
		let mappings: SheetMapping[] = mappingsFromEnv;
		if (mappings.length === 0) {
			const meta = await sheets.spreadsheets.get({
				spreadsheetId: sheetsId,
				includeGridData: false,
			});
			const titles = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];
			mappings = titles.map((title) => ({
				csvFilename: slugifySheetName(title),
				sheetName: title,
			}));
			console.log(
				`🧭 Auto-discovered ${mappings.length} sheet(s): ${mappings
					.map((m) => `${m.sheetName} -> ${m.csvFilename}.csv`)
					.join(", ")}`,
			);
		} else {
			console.log(
				`🗺️  SHEETS_MAPPING -> ${mappings.map((m) => `${m.csvFilename}:${m.sheetName}`).join(", ")}`,
			);
		}

		// Fetch each sheet and save as CSV
		for (const mapping of mappings) {
			try {
				console.log(`  📥 Fetching sheet "${mapping.sheetName}" -> ${mapping.csvFilename}.csv`);

				const response = await sheets.spreadsheets.values.get({
					spreadsheetId: sheetsId,
					range: mapping.sheetName,
				});

				const rows = response.data.values;
				if (!rows || rows.length === 0) {
					console.log(`    ⚠️  Sheet "${mapping.sheetName}" is empty, skipping`);
					continue;
				}

				// Convert to CSV
				const csv = stringify(rows);

				// Write to file
				const csvPath = path.join(process.cwd(), "config", "csv", `${mapping.csvFilename}.csv`);
				await fs.writeFile(csvPath, csv);

				console.log(`    ✅ Saved to ${mapping.csvFilename}.csv`);
				successes.push(mapping.sheetName);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(`    ❌ Error fetching sheet "${mapping.sheetName}": ${message}`);
				hadErrors = true;
				failures.push({ sheet: mapping.sheetName, error: message });
			}
		}

		if (hadErrors) {
			console.log(
				`⚠️  Completed with errors. Success: ${successes.length}, Failed: ${failures.length}`,
			);
			for (const f of failures) {
				console.log(`   - ${f.sheet}: ${f.error}`);
			}
			if (process.env.STRICT_CONFIG_MODE === "true") {
				console.error("STRICT_CONFIG_MODE is enabled. Exiting with error code due to failures.");
				process.exit(1);
			} else {
				console.log(
					"Proceeding with any successfully fetched sheets and existing CSV files for others.",
				);
			}
		} else {
			console.log("✅ Configuration fetched successfully from Google Sheets");
		}
	} catch (error) {
		console.error(
			"❌ Error fetching from Google Sheets:",
			error instanceof Error ? error.message : String(error),
		);
		console.log(
			"   ⚠️  WARNING: Using example CSV files as fallback. This may not reflect production configuration.",
		);
		console.log(
			"   Please fix the Google Sheets configuration or manually update CSV files in config/csv/",
		);
		// Exit with error code if STRICT_CONFIG_MODE is set
		if (process.env.STRICT_CONFIG_MODE === "true") {
			console.error("   STRICT_CONFIG_MODE is enabled. Exiting with error code.");
			process.exit(1);
		}
	}
}

// Run the script
fetchFromGoogleSheets().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
