# Configuration Guide

This guide provides detailed information for working with the Anime Reborn Configuration system.

## Table of Contents

1. [Overview](#overview)
2. [Setting Up Google Sheets](#setting-up-google-sheets)
3. [CSV Format Specifications](#csv-format-specifications)
4. [Compilation Process](#compilation-process)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

The configuration system works in three main stages:

1. **Edit**: Non-programmers edit configuration in Google Sheets
2. **Fetch**: Developers fetch the latest data from Google Sheets to CSV files
3. **Compile**: CSV files are compiled into type-safe TypeScript code
4. **Build**: TypeScript code is built and published as an npm package
5. **Consume**: Other projects import and use the configuration

## Setting Up Google Sheets

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note the project ID for later use

### Step 2: Enable Google Sheets API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### Step 4: Generate Service Account Key

1. Find your service account in the list
2. Click on it to open details
3. Go to the "Keys" tab
4. Click "Add Key" > "Create New Key"
5. Select "JSON" format
6. Download the key file and save it securely (e.g., `service-account-key.json`)

### Step 5: Share Google Sheet

1. Create your Google Sheet with configuration data
2. Copy the service account email from the JSON key file (it looks like `name@project-id.iam.gserviceaccount.com`)
3. Share your Google Sheet with this email address (read-only access is sufficient)
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

## CSV Format Specifications

### List-Based Configuration

For configuration that represents a list of items (heroes, items, weapons, etc.):

**Format:**
- First row: Column headers
- Subsequent rows: Data entries
- `id` column (optional but recommended): Numeric identifier for each entry

**Example: Heroes Configuration**

```csv
id,name,description,rarity,baseDamage,baseSpeed,maxLevel,unlockCost
1,Starter Hero,A basic hero for beginners,Common,100,1.0,50,0
2,Fire Warrior,Deals fire damage to enemies,Rare,250,1.2,75,500
```

**Generated TypeScript:**

```typescript
export interface Heroes {
  id: number;
  name: string;
  description: string;
  rarity: string;
  baseDamage: number;
  baseSpeed: number;
  maxLevel: number;
  unlockCost: number;
}

export const heroes: Heroes[] = [...];

// Helper function (only if 'id' column exists)
export function getHeroesById(id: number): Heroes | undefined {
  return heroes.find((item) => item.id === id);
}
```

### Key-Value Configuration

For global settings and configuration parameters:

**Format:**
- Must have columns: `key`, `value`
- Optional column: `description`

**Example: Game Settings Configuration**

```csv
key,value,description
maxPlayerLevel,100,Maximum level a player can reach
startingGold,1000,Amount of gold players start with
pvpEnabled,true,Whether PVP is enabled
experienceMultiplier,1.5,Global experience gain multiplier
```

**Generated TypeScript:**

```typescript
export interface GameSettingsConfig {
  /** Maximum level a player can reach */
  maxPlayerLevel: number;
  /** Amount of gold players start with */
  startingGold: number;
  /** Whether PVP is enabled */
  pvpEnabled: boolean;
  /** Global experience gain multiplier */
  experienceMultiplier: number;
}

export const gameSettingsConfig: GameSettingsConfig = {
  maxPlayerLevel: 100,
  startingGold: 1000,
  pvpEnabled: true,
  experienceMultiplier: 1.5,
};
```

## Compilation Process

### Type Inference Rules

The compiler automatically infers types based on the data:

1. **Boolean**: Values exactly matching `true` or `false`
2. **Number**: Values that can be parsed as valid numbers
3. **String**: All other values (default)

**Examples:**

| Value | Inferred Type |
|-------|---------------|
| `100` | number |
| `1.5` | number |
| `true` | boolean |
| `false` | boolean |
| `Common` | string |
| `Fire Warrior` | string |

### Naming Conventions

- **File names**: `kebab-case.csv` (e.g., `game-settings.csv`)
- **Type names**: `PascalCase` (e.g., `GameSettings`)
- **Variable names**: `camelCase` (e.g., `gameSettings`)

## Usage Examples

### Basic Usage

```typescript
import { heroes, items, gameSettingsConfig } from '@king-studios-rbx/anime-reborn-configuration';

// Access all heroes
for (const hero of heroes) {
  console.log(`${hero.name}: ${hero.baseDamage} damage`);
}

// Find a specific hero
const hero = heroes.find(h => h.name === "Fire Warrior");

// Access settings
if (gameSettingsConfig.pvpEnabled) {
  console.log("PVP is enabled");
}
```

### With Helper Functions

```typescript
import { getHeroesById, getItemsById } from '@king-studios-rbx/anime-reborn-configuration';

// Get by ID
const hero = getHeroesById(1);
if (hero) {
  console.log(`Found: ${hero.name}`);
}
```

### Type-Safe Functions

```typescript
import { Heroes, gameSettingsConfig } from '@king-studios-rbx/anime-reborn-configuration';

function calculateDamage(hero: Heroes, level: number): number {
  const baseDamage = hero.baseDamage;
  const multiplier = gameSettingsConfig.experienceMultiplier;
  return baseDamage * multiplier * (1 + level * 0.1);
}
```

### Roblox-TS Integration

```typescript
import { heroes, gameSettingsConfig } from '@king-studios-rbx/anime-reborn-configuration';

// Create hero instances in Roblox
for (const heroData of heroes) {
  const model = new Instance("Model");
  model.Name = heroData.name;
  
  const damage = new Instance("IntValue", model);
  damage.Name = "BaseDamage";
  damage.Value = heroData.baseDamage;
  
  model.Parent = game.GetService("ReplicatedStorage").WaitForChild("Heroes");
}

// Use settings
const levelCap = gameSettingsConfig.maxPlayerLevel;
print(`Level cap: ${levelCap}`);
```

## Best Practices

### For Game Designers

1. **Use descriptive names**: Make configuration entries clear and self-explanatory
2. **Add descriptions**: Use the description column in key-value configs
3. **Be consistent**: Keep naming conventions consistent across sheets
4. **Test changes**: Coordinate with developers to test before publishing
5. **Document changes**: Keep a changelog of what was modified

### For Developers

1. **Version control**: Always commit CSV files along with generated TypeScript
2. **Review changes**: Review configuration changes before building and publishing
3. **Semantic versioning**: Use proper semantic versioning for configuration updates
   - **Patch** (1.0.x): Value changes only
   - **Minor** (1.x.0): New configuration fields (backward compatible)
   - **Major** (x.0.0): Removed or renamed fields (breaking changes)
4. **Test thoroughly**: Test configuration changes in development before publishing
5. **Backup sheets**: Keep backups of your Google Sheets

### Security

1. **Never commit secrets**: Add `.env` and `service-account-key.json` to `.gitignore`
2. **Restrict sheet access**: Only share sheets with necessary team members
3. **Use read-only access**: Service account only needs read access to sheets
4. **Rotate keys**: Periodically rotate service account keys

## Troubleshooting

### Google Sheets API Not Working

**Problem**: Cannot fetch data from Google Sheets

**Solutions**:
1. Verify the Google Sheets API is enabled in your project
2. Check that the service account email has access to the sheet
3. Verify the `GOOGLE_SHEETS_ID` in `.env` is correct
4. Ensure the service account key file path is correct
5. Check that sheet names in `SHEETS_MAPPING` match exactly (case-sensitive)

### Compilation Errors

**Problem**: CSV files fail to compile

**Solutions**:
1. Ensure CSV files have headers in the first row
2. Check for special characters or encoding issues
3. Verify CSV format is correct (no missing commas)
4. Run `npm run compile-config` to see detailed error messages

### Type Inference Issues

**Problem**: Types are not inferred correctly

**Solutions**:
1. Ensure boolean values are exactly `true` or `false` (lowercase)
2. Remove any leading/trailing spaces from values
3. For numbers, ensure there are no extra characters
4. If needed, manually edit generated TypeScript files (not recommended for production)

### Package Not Updating

**Problem**: Consumers don't see latest configuration changes

**Solutions**:
1. Ensure you've run `npm run build` and published
2. Check version number was incremented
3. Have consumers run `npm update @king-studios-rbx/anime-reborn-configuration`
4. Clear npm cache if needed: `npm cache clean --force`

### Missing Helper Functions

**Problem**: `getXById` functions are not generated

**Solution**: Ensure your CSV has an `id` column with numeric values

## Advanced Topics

### Custom Type Overrides

If automatic type inference doesn't work for your use case, you can manually edit the generated TypeScript files. However, note that these changes will be overwritten the next time you run the compilation script.

For persistent type customization, consider:
1. Creating wrapper functions in a separate file
2. Using TypeScript's type assertion
3. Modifying the compilation script itself

### Multiple Sheets Per CSV

Currently, the system maps one sheet to one CSV file. If you need to combine multiple sheets, you can:
1. Manually combine CSV files after fetching
2. Create multiple configurations and combine them in your consuming code
3. Modify the fetch script to support multi-sheet aggregation

### Validation

Add validation to your workflow:
1. Create a validation script that checks for required fields
2. Add constraints for numeric ranges
3. Verify referential integrity (e.g., all hero IDs are unique)
4. Run validation before building and publishing

Example validation script structure:

```typescript
import { heroes, items } from './src/index';

// Check for duplicate IDs
const heroIds = new Set();
for (const hero of heroes) {
  if (heroIds.has(hero.id)) {
    throw new Error(`Duplicate hero ID: ${hero.id}`);
  }
  heroIds.add(hero.id);
}

// Validate ranges
for (const hero of heroes) {
  if (hero.baseDamage < 0) {
    throw new Error(`Invalid damage for ${hero.name}`);
  }
}

console.log('Validation passed!');
```
