/**
 * Example usage of the Anime Reborn Configuration package
 * 
 * This file demonstrates how to use the configuration in your TypeScript/Roblox-TS project
 */

import {
	heroes,
	getHeroesById,
	items,
	getItemsById,
	gameSettingsConfig,
	type Heroes,
	type Items,
	type GameSettingsConfig,
} from "../src/index";

// Example 1: Access all heroes
console.log("=== All Heroes ===");
for (const hero of heroes) {
	console.log(`${hero.name} (${hero.rarity}): ${hero.baseDamage} damage`);
}

// Example 2: Get a specific hero by ID
console.log("\n=== Get Hero by ID ===");
const starterHero = getHeroesById(1);
if (starterHero) {
	console.log(`Found: ${starterHero.name}`);
	console.log(`Damage: ${starterHero.baseDamage}`);
	console.log(`Max Level: ${starterHero.maxLevel}`);
}

// Example 3: Access game settings
console.log("\n=== Game Settings ===");
console.log(`Max Player Level: ${gameSettingsConfig.maxPlayerLevel}`);
console.log(`Starting Gold: ${gameSettingsConfig.startingGold}`);
console.log(`PVP Enabled: ${gameSettingsConfig.pvpEnabled}`);

// Example 4: Type-safe function using hero data
function calculateDamageAtLevel(hero: Heroes, level: number): number {
	const baseDamage = hero.baseDamage;
	const multiplier = gameSettingsConfig.experienceMultiplier;
	const levelBonus = level * 0.1; // 10% bonus per level
	return Math.floor(baseDamage * multiplier * (1 + levelBonus));
}

console.log("\n=== Damage Calculation ===");
const fireWarrior = getHeroesById(2);
if (fireWarrior) {
	console.log(`${fireWarrior.name} at level 1: ${calculateDamageAtLevel(fireWarrior, 1)} damage`);
	console.log(`${fireWarrior.name} at level 10: ${calculateDamageAtLevel(fireWarrior, 10)} damage`);
	console.log(`${fireWarrior.name} at level 50: ${calculateDamageAtLevel(fireWarrior, 50)} damage`);
}

// Example 5: Filter items by type
console.log("\n=== Consumable Items ===");
const consumables = items.filter((item) => item.type === "Consumable");
for (const item of consumables) {
	console.log(`${item.name}: ${item.cost} gold`);
}

// Example 6: Roblox-TS usage example (commented out as this is not a Roblox environment)
/*
import { Players, ReplicatedStorage } from "@rbxts/services";

// Create hero models from configuration
for (const heroData of heroes) {
	const heroModel = new Instance("Model");
	heroModel.Name = heroData.name;
	
	const config = new Instance("Configuration", heroModel);
	
	const damage = new Instance("IntValue", config);
	damage.Name = "BaseDamage";
	damage.Value = heroData.baseDamage;
	
	const speed = new Instance("NumberValue", config);
	speed.Name = "BaseSpeed";
	speed.Value = heroData.baseSpeed;
	
	const maxLevel = new Instance("IntValue", config);
	maxLevel.Name = "MaxLevel";
	maxLevel.Value = heroData.maxLevel;
	
	heroModel.Parent = ReplicatedStorage.WaitForChild("Heroes");
}

// Use game settings
Players.PlayerAdded.Connect((player) => {
	const leaderstats = new Instance("Folder", player);
	leaderstats.Name = "leaderstats";
	
	const gold = new Instance("IntValue", leaderstats);
	gold.Name = "Gold";
	gold.Value = gameSettingsConfig.startingGold;
	
	const level = new Instance("IntValue", leaderstats);
	level.Name = "Level";
	level.Value = 1;
});
*/
