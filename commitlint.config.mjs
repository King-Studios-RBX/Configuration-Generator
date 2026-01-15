export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"type-enum": [
			2,
			"always",
			[
				"feat", // New feature
				"fix", // Bug fix
				"docs", // Documentation only
				"style", // Formatting, missing semicolons, etc
				"refactor", // Code change that neither fixes a bug nor adds a feature
				"perf", // Performance improvement
				"test", // Adding tests
				"build", // Changes to build system or dependencies
				"ci", // Changes to CI configuration
				"chore", // Other changes that don't modify src or test files
				"revert", // Revert a previous commit
			],
		],
		"scope-enum": [
			2,
			"always",
			[
				// CLI & Commands
				"cli",
				"compile",
				"fetch",
				"verify",

				// Core
				"core",
				"config",

				// Infrastructure
				"build",
				"deps",
				"test",
				"ci",
				"docs",
			],
		],
		"scope-case": [2, "always", "kebab-case"],
		"subject-case": [2, "never", ["start-case", "pascal-case", "upper-case"]],
		"subject-empty": [2, "never"],
		"subject-full-stop": [2, "never", "."],
		"header-max-length": [2, "always", 200],
		"body-leading-blank": [2, "always"],
		"body-max-line-length": [2, "always", 100],
		"footer-leading-blank": [2, "always"],
	},
};