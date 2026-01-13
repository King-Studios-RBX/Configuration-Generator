# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-13

### Added
- Initial release of Anime Reborn Configuration system
- Google Sheets integration for configuration management
- CSV to TypeScript compilation with automatic type inference
- Support for list-based configurations (heroes, items, etc.)
- Support for key-value configurations (game settings)
- Auto-generated helper functions for ID-based lookups
- Comprehensive documentation and usage examples
- Example CSV files for quick start
- STRICT_CONFIG_MODE for CI/CD environments
- Improved type inference handling:
  - Empty strings and whitespace
  - Leading zeros (e.g., "007" stays as string)
  - Boolean values
  - Numeric values
- Graceful fallback to example CSV files when Google Sheets not configured
- Full TypeScript type definitions for all configuration data

### Features
- **fetch-config**: Fetch configuration from Google Sheets to CSV
- **compile-config**: Compile CSV files to TypeScript types and data
- **build**: Build the package for npm distribution
- Type-safe configuration exports
- Zero runtime dependencies
- Compatible with TypeScript and Roblox-TS projects

[1.0.0]: https://github.com/King-Studios-RBX/Anime-Reborn-Configuration/releases/tag/v1.0.0
