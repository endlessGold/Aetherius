import { EnvLayer } from './environmentGrid.js';

export type EnvironmentRecipeId = 'forest' | 'desert' | 'alpine' | 'wetlands';

export type EnvironmentRecipe = {
  id: EnvironmentRecipeId;
  label: string;
  base: Partial<Record<EnvLayer, number>>;
};

const recipes: EnvironmentRecipe[] = [
  {
    id: 'forest',
    label: 'TemperateForest',
    base: {
      [EnvLayer.Temperature]: 20,
      [EnvLayer.Humidity]: 0.7,
      [EnvLayer.SoilMoisture]: 0.5,
      [EnvLayer.SoilNitrogen]: 0.8,
      [EnvLayer.OrganicMatter]: 0.4,
      [EnvLayer.GroundWaterLevel]: 5,
      [EnvLayer.SoilSalinity]: 0.01,
      [EnvLayer.LightIntensity]: 600
    }
  },
  {
    id: 'desert',
    label: 'HotDesert',
    base: {
      [EnvLayer.Temperature]: 35,
      [EnvLayer.Humidity]: 0.2,
      [EnvLayer.SoilMoisture]: 0.1,
      [EnvLayer.SoilNitrogen]: 0.2,
      [EnvLayer.OrganicMatter]: 0.05,
      [EnvLayer.GroundWaterLevel]: 20,
      [EnvLayer.SoilSalinity]: 0.2,
      [EnvLayer.LightIntensity]: 900
    }
  },
  {
    id: 'alpine',
    label: 'Alpine',
    base: {
      [EnvLayer.Temperature]: 5,
      [EnvLayer.Humidity]: 0.6,
      [EnvLayer.SoilMoisture]: 0.6,
      [EnvLayer.SoilNitrogen]: 0.5,
      [EnvLayer.OrganicMatter]: 0.3,
      [EnvLayer.GroundWaterLevel]: 2,
      [EnvLayer.SoilSalinity]: 0.01,
      [EnvLayer.LightIntensity]: 700
    }
  },
  {
    id: 'wetlands',
    label: 'Wetlands',
    base: {
      [EnvLayer.Temperature]: 18,
      [EnvLayer.Humidity]: 0.9,
      [EnvLayer.SoilMoisture]: 0.9,
      [EnvLayer.SoilNitrogen]: 0.9,
      [EnvLayer.OrganicMatter]: 0.6,
      [EnvLayer.GroundWaterLevel]: 1,
      [EnvLayer.SoilSalinity]: 0.05,
      [EnvLayer.LightIntensity]: 500
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
