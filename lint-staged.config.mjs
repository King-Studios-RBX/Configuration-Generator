export default {
	// Only check files under src/ directory
	"src/**/*.{ts,tsx,js,mjs,cjs,json,md,yml,yaml}": [
		"biome check --write --unsafe --no-errors-on-unmatched",
		"cspell --no-must-find-files"
	],
	// Validate file naming conventions only for src/ files
	"src/**/*": ["ls-lint"],
};