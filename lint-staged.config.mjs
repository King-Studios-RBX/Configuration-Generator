export default {
	// Check TypeScript files
	"src/**/*.{ts,js,mjs,cjs,json}": [
		"biome check --write --unsafe --no-errors-on-unmatched",
		"cspell --no-must-find-files"
	],
	"tests/**/*.{ts,js,mjs,cjs,json}": [
		"biome check --write --unsafe --no-errors-on-unmatched",
		"cspell --no-must-find-files"
	],
	// Validate file naming conventions
	"src/**/*": ["ls-lint"],
	"tests/**/*": ["ls-lint"],
};