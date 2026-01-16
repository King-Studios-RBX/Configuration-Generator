import { existsSync, promises as fs } from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { google } from "googleapis";

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

interface VerifyOptions {
	inputDir?: string;
	outputDir?: string;
}

export async function verifySheetsAccess(_options?: VerifyOptions) {
	loadEnvFiles();

	const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
	const sheetsId = process.env.GOOGLE_SHEETS_ID;
	const sheetsMapping = process.env.SHEETS_MAPPING ?? "";

	if (!keyPath || !sheetsId) {
		console.error("❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SHEETS_ID in environment.");
		process.exit(1);
	}

	const mappings = sheetsMapping
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.map((pair) => {
			const idx = pair.indexOf(":");
			const csvFilename = idx >= 0 ? pair.slice(0, idx).trim() : "";
			const sheetName = idx >= 0 ? pair.slice(idx + 1).trim() : "";
			return { csvFilename, sheetName };
		});

	try {
		const keyFile = await fs.readFile(keyPath, "utf-8");
		const credentials = JSON.parse(keyFile);
		const saEmail: string | undefined = credentials.client_email;

		console.log(`🔎 Verifying access...`);
		console.log(`🔑 Service Account: ${saEmail ?? "(email not found in key)"}`);
		console.log(`📄 Spreadsheet ID: ${sheetsId}`);

		const auth = new google.auth.GoogleAuth({
			credentials,
			scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
		});

		const sheets = google.sheets({ version: "v4", auth });

		const meta = await sheets.spreadsheets.get({
			spreadsheetId: sheetsId,
			includeGridData: false,
		});

		const titles = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];
		console.log(`📚 Found ${titles.length} sheet(s): ${titles.join(", ")}`);

		if (mappings.length > 0) {
			for (const m of mappings) {
				const ok = titles.includes(m.sheetName);
				console.log(
					`${ok ? "✅" : "❌"} Mapping ${m.csvFilename}:${m.sheetName} ${ok ? "exists" : "NOT FOUND"}`,
				);
			}
		}

		console.log("✅ Verify complete");
	} catch (err: unknown) {
		const code =
			(err as { code?: number; response?: { status: number } })?.code ||
			(err as { response?: { status: number } })?.response?.status;
		if (code === 403) {
			console.error(
				"❌ Permission denied (403). The service account does not have access to this spreadsheet.",
			);
			console.error("   Share the spreadsheet with the service account email shown above.");
		} else if (code === 404) {
			console.error("❌ Spreadsheet not found (404). Check GOOGLE_SHEETS_ID.");
		} else {
			console.error("❌ Error verifying sheets:", err?.message || String(err));
		}
		process.exit(1);
	}
}
