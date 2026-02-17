import 'dotenv/config';
import { AssembleManager } from './entities/assembly.js';
import { CommandHandler } from './interface/commandHandler.js';
import { CLI } from './interface/cli.js';
import { Server } from './interface/server.js';
import { universeRegistry } from './core/space/universeRegistry.js';
import { createWorldWithAssembly, seedWorlds, type WorldWithAssembly } from './bootstrap/worldBootstrap.js';

function parseArgs(): { worldIds: string[]; mode: string } {
  const args = process.argv.slice(2);
  const worldsArg = args.find((arg) => arg.startsWith('--worlds='))?.split('=')[1];
  const worldIds = worldsArg
    ? worldsArg.split(',').map((id) => id.trim()).filter(Boolean)
    : ['Alpha', 'Beta', 'Gamma'];
  const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1] ?? 'cli';
  return { worldIds, mode };
}

async function main() {
  console.log('🌌 Initializing Aetherius Engine Core...');

  const { worldIds, mode } = parseArgs();
  const weatherTypes = ['Weather_Sunny_001', 'Weather_Rainy_001', 'Weather_Drought_001'];

  const worlds: WorldWithAssembly[] = worldIds.map((id, index) => {
    const manager = new AssembleManager();
    const weatherType = weatherTypes[index % weatherTypes.length];
    const created = createWorldWithAssembly(id, weatherType, manager);
    universeRegistry.registerWorld({
      worldId: created.world.id,
      world: created.world,
      manager: created.manager
    });
    return created;
  });

  seedWorlds(worlds);

  const { world, weatherEntity } = worlds[0];
  const commandHandler = new CommandHandler(world, weatherEntity);

  if (mode === 'server') {
    const port = parseInt(process.env.PORT ?? '3000', 10);
    const server = new Server(commandHandler, port);
    server.start();
  } else {
    const cli = new CLI(commandHandler);
    console.log('\n🧪 EXPERIMENTAL MODE: Auto-Warping 200 ticks to seed evolution data...');
    await commandHandler.execute('warp_evolution 200');
    cli.start();
  }
}

main().catch((err) => {
  console.error('Fatal Error:', err);
});
