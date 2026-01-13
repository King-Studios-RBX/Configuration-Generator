#!/usr/bin/env bun

import { google } from "googleapis";
import { stringify } from "csv-stringify/sync";
import { promises as fs } from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface SheetMapping {
	csvFilename: string;
	sheetName: string;
}

async function fetchFromGoogleSheets() {
	console.log("🔄 Fetching configuration from Google Sheets...");

	// Check if Google Sheets is configured
	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
	const sheetsId = process.env.GOOGLE_SHEETS_ID;
	const sheetsMapping = process.env.SHEETS_MAPPING;

	if (!keyPath || !sheetsId || !sheetsMapping) {
		console.log(
			"⚠️  Google Sheets not configured. Using example CSV files instead.",
		);
		console.log(
			"   To use Google Sheets, configure .env file with GOOGLE_SERVICE_ACCOUNT_KEY_PATH, GOOGLE_SHEETS_ID, and SHEETS_MAPPING",
		);
		return;
	}

	try {
		// Parse sheets mapping
		const mappings: SheetMapping[] = sheetsMapping.split(",").map((mapping) => {
			const [csvFilename, sheetName] = mapping.split(":");
			return { csvFilename: csvFilename.trim(), sheetName: sheetName.trim() };
		});

		// Load service account credentials
		const keyFile = await fs.readFile(keyPath, "utf-8");
		const credentials = JSON.parse(keyFile);

		// Initialize Google Sheets API
		const auth = new google.auth.GoogleAuth({
			credentials,
			scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
		});

		const sheets = google.sheets({ version: "v4", auth });

		// Fetch each sheet and save as CSV
		for (const mapping of mappings) {
			try {
				console.log(
					`  📥 Fetching sheet "${mapping.sheetName}" -> ${mapping.csvFilename}.csv`,
				);

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
				const csvPath = path.join(
					process.cwd(),
					"config",
					"csv",
					`${mapping.csvFilename}.csv`,
				);
				await fs.writeFile(csvPath, csv);

				console.log(`    ✅ Saved to ${mapping.csvFilename}.csv`);
			} catch (error) {
				console.error(
					`    ❌ Error fetching sheet "${mapping.sheetName}":`,
					error instanceof Error ? error.message : String(error),
				);
			}
		}

		console.log("✅ Configuration fetched successfully from Google Sheets");
	} catch (error) {
		console.error(
			"❌ Error fetching from Google Sheets:",
			error instanceof Error ? error.message : String(error),
		);
		console.log("   Using example CSV files instead.");
	}
}

// Run the script
fetchFromGoogleSheets().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
