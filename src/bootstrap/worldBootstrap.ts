/**
 * 월드 생성·어셈블·시드 로직 (main.ts에서 분리).
 * - createWorldWithAssembly: World + 날씨 엔티티 + evolution/ecosystem 훅
 * - seedWorlds: 월드별 시드 엔티티
 */

import { World } from '../core/world.js';
import { createEntityByAssemblyWithManager } from '../entities/catalog.js';
import { AssembleManager } from '../entities/assembly.js';
import { EvolutionSystem } from '../entities/evolutionSystem.js';
import { EcosystemCycleSystem } from '../entities/ecosystemCycleSystem.js';
import type { WeatherData } from '../components/entityData.js';

export interface WorldWithAssembly {
  world: World;
  weatherEntity: ReturnType<typeof createEntityByAssemblyWithManager>;
  manager: AssembleManager;
}

/** World에 evolution/ecosystem 훅을 붙인 뒤, 확장된 tick을 사용하도록 함. */
function assemble(world: World, manager: AssembleManager): void {
  const evolutionSystem = new EvolutionSystem();
  const ecosystemSystem = new EcosystemCycleSystem();

  (world as World & { ecosystemSystem?: EcosystemCycleSystem }).ecosystemSystem = ecosystemSystem;

  const originalTick = world.tick.bind(world);
  world.tick = async () => {
    await originalTick();
    manager.listenUpdate({ world, deltaTime: 1.0 });
    manager.update();
    evolutionSystem.tick(manager, world);
    await ecosystemSystem.tick(manager, world);

    if (world.tickCount % 60 === 0) {
      console.log(`\n--- Tick ${world.tickCount} Entity Status ---`);
      const summaries = manager.getDebugSummary();
      summaries.forEach((s) => console.log(s));
    }
  };
}

/**
 * 단일 월드 생성: 날씨 엔티티 + World(assembleManager, tickPayload) + assemble 훅.
 */
export function createWorldWithAssembly(
  worldId: string,
  weatherType: string,
  manager: AssembleManager
): WorldWithAssembly {
  const weatherEntity = createEntityByAssemblyWithManager(manager, weatherType, `${worldId}_weather`);
  const weatherBehavior = weatherEntity.children[0] as { components: WeatherData };
  const weather = weatherBehavior.components.weather;

  const world = new World(worldId, {
    assembleManager: manager,
    tickPayloadProvider: () => ({
      environment: {
        soilMoisture:
          weather.condition === 'Rainy' || weather.condition === 'Stormy'
            ? 80
            : weather.condition === 'Drought'
              ? 10
              : 40,
        light: weather.sunlightIntensity ?? 100,
        temperature: weather.temperature,
        soilNutrients: 50,
        co2Level: weather.co2Level ?? 400,
        windSpeed: weather.windSpeed ?? 0,
        humidity: weather.humidity ?? 50
      }
    })
  });

  assemble(world, manager);

  return { world, weatherEntity, manager };
}

/** 월드별 시드 엔티티 생성 (기존 main의 forEach 로직). */
export function seedWorlds(worlds: WorldWithAssembly[]): void {
  for (const { world, manager } of worlds) {
    createEntityByAssemblyWithManager(manager, 'Plant_Species_001', `${world.id}_Plant_A`);
    createEntityByAssemblyWithManager(manager, 'Creature_Type_001', `${world.id}_Creature_A`);

    if (world.id === 'Beta') {
      createEntityByAssemblyWithManager(manager, 'Plant_Species_005', `${world.id}_Plant_B`);
      createEntityByAssemblyWithManager(manager, 'Plant_Species_005', `${world.id}_Plant_C`);
      createEntityByAssemblyWithManager(manager, 'Creature_Type_010', `${world.id}_Creature_B`);
    }

    if (world.id === 'Gamma') {
      createEntityByAssemblyWithManager(manager, 'Creature_Type_020', `${world.id}_Survivor_A`);
    }
  }
}
