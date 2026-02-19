import { EnvironmentLayer } from './environmentGrid.js';

export type EnvironmentRecipeId = 'forest' | 'desert' | 'alpine' | 'wetlands';

export type EnvironmentRecipe = {
  id: EnvironmentRecipeId;
  label: string;
  base: Partial<Record<EnvironmentLayer, number>>;
};

const recipes: EnvironmentRecipe[] = [
  {
    id: 'forest',
    label: 'TemperateForest',
    base: {
      [EnvironmentLayer.Temperature]: 20,
      [EnvironmentLayer.Humidity]: 0.7,
      [EnvironmentLayer.SoilMoisture]: 0.5,
      [EnvironmentLayer.SoilNitrogen]: 0.8,
      [EnvironmentLayer.OrganicMatter]: 0.4,
      [EnvironmentLayer.GroundWaterLevel]: 5,
      [EnvironmentLayer.SoilSalinity]: 0.01,
      [EnvironmentLayer.LightIntensity]: 600
    }
  },
  {
    id: 'desert',
    label: 'HotDesert',
    base: {
      [EnvironmentLayer.Temperature]: 35,
      [EnvironmentLayer.Humidity]: 0.2,
      [EnvironmentLayer.SoilMoisture]: 0.1,
      [EnvironmentLayer.SoilNitrogen]: 0.2,
      [EnvironmentLayer.OrganicMatter]: 0.05,
      [EnvironmentLayer.GroundWaterLevel]: 20,
      [EnvironmentLayer.SoilSalinity]: 0.2,
      [EnvironmentLayer.LightIntensity]: 900
    }
  },
  {
    id: 'alpine',
    label: 'Alpine',
    base: {
      [EnvironmentLayer.Temperature]: 5,
      [EnvironmentLayer.Humidity]: 0.6,
      [EnvironmentLayer.SoilMoisture]: 0.6,
      [EnvironmentLayer.SoilNitrogen]: 0.5,
      [EnvironmentLayer.OrganicMatter]: 0.3,
      [EnvironmentLayer.GroundWaterLevel]: 2,
      [EnvironmentLayer.SoilSalinity]: 0.01,
      [EnvironmentLayer.LightIntensity]: 700
    }
  },
  {
    id: 'wetlands',
    label: 'Wetlands',
    base: {
      [EnvironmentLayer.Temperature]: 18,
      [EnvironmentLayer.Humidity]: 0.9,
      [EnvironmentLayer.SoilMoisture]: 0.9,
      [EnvironmentLayer.SoilNitrogen]: 0.9,
      [EnvironmentLayer.OrganicMatter]: 0.6,
      [EnvironmentLayer.GroundWaterLevel]: 1,
      [EnvironmentLayer.SoilSalinity]: 0.05,
      [EnvironmentLayer.LightIntensity]: 500
    }
  }
];

const recipeById = new Map<EnvironmentRecipeId, EnvironmentRecipe>();

for (const r of recipes) {
  recipeById.set(r.id, r);
}

export function getEnvironmentRecipe(id: EnvironmentRecipeId): EnvironmentRecipe {
  return recipeById.get(id) ?? recipes[0];
}

export function listEnvironmentRecipes(): EnvironmentRecipe[] {
  return recipes.slice();
}
