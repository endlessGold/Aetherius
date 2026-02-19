import 'dotenv/config';
import { AssembleManager } from './entities/assembly.js';
import { CommandHandler } from './app/commandHandler.js';
import { CLI } from './app/cli.js';
import { Server } from './app/server/server.js';
import { universeRegistry } from './core/space/universeRegistry.js';
import { createWorldWithAssembly, seedWorlds, type WorldWithAssembly } from './bootstrap/worldBootstrap.js';

function parseArgs(): { worldIds: string[]; mode: string } {
  const args = process.argv.slice(2);
  const worldsArg = args.find((arg) => arg.startsWith('--worlds='))?.split('=')[1];
  const worldIds = worldsArg
    ? worldsArg.split(',').map((id) => id.trim()).filter(Boolean)
    : ['Alpha', 'Beta', 'Gamma'];
  const modeArg = args.find((arg) => arg.startsWith('--mode='));
  const modeFromEq = modeArg?.split('=')[1];
  const modeIdx = args.indexOf('--mode');
  const modeFromNext = modeIdx >= 0 && args[modeIdx + 1] && !args[modeIdx + 1].startsWith('--') ? args[modeIdx + 1] : undefined;
  const mode = modeFromEq ?? modeFromNext ?? 'cli';
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

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error('Fatal Error:', msg);
  if (stack) console.error(stack);
  if (err != null && typeof err === 'object' && !(err instanceof Error)) {
    try {
      console.error('Thrown value:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch (_) {
      console.error('Thrown value: [non-serializable]');
    }
  }
  process.exit(1);
});
