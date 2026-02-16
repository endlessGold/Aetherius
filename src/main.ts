import { World } from './core/world.js';
import { createEntityByAssemblyWithManager, assembleManager } from './entities/catalog.js';
import { AssembleManager } from './entities/assembly.js';
import { CommandHandler } from './interface/commandHandler.js';
import { CLI } from './interface/cli.js';
import { Server } from './interface/server.js';
import { WeatherData } from './components/entityData.js';

const assembleManagers = new WeakMap<World, AssembleManager>();

function registerAssembleManager(world: World, manager: AssembleManager) {
  assembleManagers.set(world, manager);
}

function assemble(world: World) {
  const manager = assembleManagers.get(world);
  if (!manager) {
    throw new Error(`AssembleManager not registered for world ${world.id}`);
  }
  const originalTick = world.tick.bind(world);
  world.tick = async () => {
    await originalTick();
    manager.listenUpdate({ world, deltaTime: 1.0 });
    manager.update();

    if (world.tickCount % 60 === 0) {
      console.log(`\n--- Tick ${world.tickCount} Entity Status ---`);
      const summaries = manager.getDebugSummary();
      summaries.forEach(s => console.log(s));
    }
  };
}

function createWorldWithAssembly(worldId: string, weatherType: string, manager: AssembleManager) {
  const weatherEntity = createEntityByAssemblyWithManager(manager, weatherType, `${worldId}_weather`);
  const weatherBehavior = weatherEntity.children[0] as any;
  const weatherComp = weatherBehavior.components as WeatherData;
  const weather = weatherComp.weather;

  const world = new World(worldId, {
    tickPayloadProvider: () => ({
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
    })
  });

  registerAssembleManager(world, manager);
  assemble(world);

  return { world, weatherEntity, manager };
}

async function main() {
  console.log("🌌 Initializing Aetherius Engine Core...");

  const args = process.argv.slice(2);
  const worldsArg = args.find(arg => arg.startsWith('--worlds='))?.split('=')[1];
  const worldIds = worldsArg
    ? worldsArg.split(',').map(id => id.trim()).filter(Boolean)
    : ['Alpha', 'Beta', 'Gamma'];
  const weatherTypes = [
    'Weather_Sunny_001',
    'Weather_Rainy_001',
    'Weather_Drought_001'
  ];
  const worlds = worldIds.map((id, index) => {
    const manager = new AssembleManager();
    const weatherType = weatherTypes[index % weatherTypes.length];
    return createWorldWithAssembly(id, weatherType, manager);
  });
  const { world, weatherEntity } = worlds[0];


  // Pre-seed some entities for testing
  worlds.forEach(({ world, manager }) => {
    // Basic Ecosystem
    createEntityByAssemblyWithManager(manager, 'Plant_Species_001', `${world.id}_Plant_A`);
    createEntityByAssemblyWithManager(manager, 'Creature_Type_001', `${world.id}_Creature_A`);

    // Add more entities to increase chaos
    if (world.id === 'Beta') { // Beta world is chaotic (Rainy)
      createEntityByAssemblyWithManager(manager, 'Plant_Species_005', `${world.id}_Plant_B`);
      createEntityByAssemblyWithManager(manager, 'Plant_Species_005', `${world.id}_Plant_C`);
      createEntityByAssemblyWithManager(manager, 'Creature_Type_010', `${world.id}_Creature_B`);
    }

    if (world.id === 'Gamma') { // Gamma world is harsh (Drought)
      createEntityByAssemblyWithManager(manager, 'Creature_Type_020', `${world.id}_Survivor_A`);
    }
  });

  // Create some event nodes for storytelling (Optional)
  // Currently handled by behaviors directly logging events like [WILDFIRE], [FLOOD]

  // 2. Setup Command Handler (Virtual Command Layer)
  const commandHandler = new CommandHandler(world, weatherEntity as any);

  // 3. Determine Mode
  const modeArg = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'cli';

  if (modeArg === 'server') {
    // Server Mode
    const port = parseInt(process.env.PORT || '3000', 10);
    const server = new Server(commandHandler, port);
    server.start();
  } else {
    // CLI Mode (Default)
    const cli = new CLI(commandHandler);
    cli.start();
  }
}

main().catch(err => {
  console.error("Fatal Error:", err);
});
