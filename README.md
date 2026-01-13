# Anime Reborn Configuration

A configuration system for Anime Reborn that allows non-programmers to balance game parameters via Google Sheets while providing type-safe TypeScript exports for developers.

## 🎯 Features

- **Google Sheets Integration**: Edit game configuration via Google Sheets for easy collaboration
- **CSV Compilation**: Automatically compiles CSV data to TypeScript types and data structures
- **Type Safety**: Generated TypeScript interfaces and types for compile-time safety
- **NPM Package**: Publish and use across multiple TypeScript/Roblox-TS projects
- **Zero Runtime Dependencies**: Only build-time dependencies, no runtime overhead
- **Hot Reload Support**: Fetch latest config from Google Sheets on demand

## 📦 Installation

```bash
npm install @king-studios-rbx/anime-reborn-configuration
# or
yarn add @king-studios-rbx/anime-reborn-configuration
```

## 🚀 Usage

### In Your TypeScript/Roblox-TS Project

```typescript
import {
  heroes,
  getHeroesById,
  items,
  getItemsById,
  gameSettingsConfig,
  Heroes,
  Items,
  GameSettingsConfig
} from '@king-studios-rbx/anime-reborn-configuration';

// Get all heroes
console.log(heroes);
// [{ id: 1, name: "Starter Hero", ... }, ...]

// Get a specific hero by ID
const hero = getHeroesById(1);
console.log(hero?.name); // "Starter Hero"

// Access game settings
console.log(gameSettingsConfig.maxPlayerLevel); // 100
console.log(gameSettingsConfig.pvpEnabled); // true

// Use TypeScript types
function damageCalculation(hero: Heroes): number {
  return hero.baseDamage * gameSettingsConfig.experienceMultiplier;
}
```

## 🔧 Configuration Setup (For Package Maintainers)

### 1. Google Sheets API Setup

1. Create a [Google Cloud Project](https://console.cloud.google.com/)
2. Enable the **Google Sheets API**
3. Create a **Service Account**
4. Download the JSON key file
5. Share your Google Sheet with the service account email (found in the JSON key)

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# Path to your Google Service Account JSON key
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./service-account-key.json

# Google Sheets document ID (from the URL)
GOOGLE_SHEETS_ID=your-spreadsheet-id-here

# Sheet names mapping (CSV_FILENAME:SHEET_NAME)
SHEETS_MAPPING=heroes:Heroes,items:Items,game-settings:GameSettings
```

### 3. Google Sheets Format

Your Google Sheets should follow these formats:

#### For List-Based Config (Heroes, Items, etc.)

| id | name | description | rarity | baseDamage | baseSpeed | maxLevel | unlockCost |
|----|------|-------------|--------|------------|-----------|----------|------------|
| 1 | Starter Hero | A basic hero | Common | 100 | 1.0 | 50 | 0 |
| 2 | Fire Warrior | Fire damage | Rare | 250 | 1.2 | 75 | 500 |

#### For Key-Value Config (Game Settings)

| key | value | description |
|-----|-------|-------------|
| maxPlayerLevel | 100 | Maximum level a player can reach |
| startingGold | 1000 | Amount of gold players start with |
| pvpEnabled | true | Whether PVP is enabled |

### 4. Compile Configuration

```bash
# Fetch latest config from Google Sheets
npm run fetch-config

# Compile CSV files to TypeScript
npm run compile-config

# Build the package
npm run build
```

## 📁 Project Structure

```
anime-reborn-configuration/
├── config/
│   └── csv/                    # CSV configuration files
│       ├── example-heroes.csv
│       ├── example-items.csv
│       └── example-game-settings.csv
├── src/
│   ├── generated/              # Auto-generated TS files (gitignored)
│   │   ├── heroes.ts
│   │   ├── items.ts
│   │   └── game-settings.ts
│   └── index.ts               # Main export file
├── dist/                      # Compiled output (gitignored)
├── scripts/
│   ├── fetch-config.ts        # Fetches from Google Sheets
│   └── compile-config.ts      # Compiles CSV to TypeScript
└── package.json
```

## 🔄 Workflow

### For Non-Programmers (Game Designers)

1. Edit the Google Sheet with your configuration changes
2. Notify developers that changes are ready
3. Developers will fetch and publish a new version

### For Developers (Package Maintainers)

1. Run `npm run fetch-config` to pull latest from Google Sheets
2. Run `npm run compile-config` to generate TypeScript files
3. Run `npm run build` to compile the package
4. Test the changes
5. Publish to npm: `npm publish --access public`

### For Consumers (Game Developers)

1. Update the package: `npm update @king-studios-rbx/anime-reborn-configuration`
2. Your code automatically uses the new configuration
3. TypeScript will catch any breaking changes

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Compile configuration from example CSV files
npm run compile-config

# Build the package
npm run build

# Run in development mode (for Roblox-TS projects)
npm run dev
```

### Adding New Configuration Types

1. Create a new CSV file in `config/csv/` (e.g., `weapons.csv`)
2. Add the sheet to your Google Sheets
3. Update `SHEETS_MAPPING` in `.env`:
   ```
   SHEETS_MAPPING=heroes:Heroes,items:Items,game-settings:GameSettings,weapons:Weapons
   ```
4. Run `npm run fetch-config && npm run compile-config`
5. The new config will be automatically exported from `src/index.ts`

## 📊 Type Inference

The compilation script automatically infers types from your CSV data:

- **Numbers**: Values that can be parsed as numbers (e.g., `100`, `1.5`)
- **Booleans**: Values that are exactly `true` or `false`
- **Strings**: Everything else (default)

## 🎮 Roblox-TS Integration

This package is designed to work seamlessly with Roblox-TS projects:

```typescript
import { heroes, gameSettingsConfig } from '@king-studios-rbx/anime-reborn-configuration';

// Use in your Roblox game
const ReplicatedStorage = game.GetService("ReplicatedStorage");

for (const hero of heroes) {
  print(`${hero.name}: ${hero.baseDamage} damage`);
}

if (gameSettingsConfig.pvpEnabled) {
  print("PVP is enabled!");
}
```

## 📄 License & Ownership

This project is **private and proprietary**. Copyright (c) 2026 King Studios. Code owners: Matthew Radulovich and royalty-based contributors under King Studios. No sharing, selling, or distribution without explicit permission. See [LICENSE](LICENSE) for full terms.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines. Please use conventional commits and keep PRs focused.

## 🔐 Security

- Never commit your `.env` file or `service-account-key.json`
- Keep your Google Sheets permissions restricted
- Only share sheets with the service account email
- Review all configuration changes before publishing

## 📚 Examples

See the `config/csv/example-*.csv` files for example configuration formats that you can use as templates.
