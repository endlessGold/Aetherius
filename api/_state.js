import { World } from '../dist/core/world.js';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createEntityByAssemblyWithManager } from '../dist/entities/catalog.js';
import { CommandHandler } from '../dist/interface/commandHandler.js';
import { universeRegistry } from '../dist/core/space/universeRegistry.js';
import { WorldSession } from '../dist/server/worldSession.js';

let state = null;

function buildTickPayloadFromWeather(weatherEntity) {
  return () => {
    const weatherBehavior = weatherEntity.children?.[0];
    const weather = weatherBehavior?.components?.weather;
    if (!weather) return {};
    return {
      environment: {
        soilMoisture:
          weather.condition === 'Rainy' || weather.condition === 'Stormy'
            ? 80
            : weather.condition === 'Drought'
              ? 10
              : 40,
        light: weather.sunlightIntensity || 100,
        temperature: weather.temperature,
        soilNutrients: 50,
        co2Level: weather.co2Level || 400,
        windSpeed: weather.windSpeed || 0,
        humidity: weather.humidity || 50
      }
    };
  };
}

export async function getState() {
  if (state) return state;

  const manager = new AssembleManager();
  const weatherEntity = createEntityByAssemblyWithManager(manager, 'Weather_Sunny_001', `Alpha_weather`);
  const world = new World('Alpha', { assembleManager: manager, tickPayloadProvider: buildTickPayloadFromWeather(weatherEntity) });

  universeRegistry.registerWorld({ worldId: world.id, world, manager });

  createEntityByAssemblyWithManager(manager, 'Plant_Species_001', `Alpha_Plant_A`);
  createEntityByAssemblyWithManager(manager, 'Creature_Type_001', `Alpha_Creature_A`);

  const handler = new CommandHandler(world, weatherEntity);
  const session = new WorldSession(world);

  state = { world, manager, weatherEntity, handler, session };
  return state;
}

