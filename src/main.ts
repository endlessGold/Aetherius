import 'dotenv/config';
import './bootstrap/logShim.js';
import fs from 'node:fs';
import path from 'node:path';
import { AssembleManager } from './entities/assembly.js';
import { CommandHandler } from './app/commandHandler.js';
import { CLI } from './app/cli.js';
import { Server } from './app/server/server.js';
import { universeRegistry } from './core/space/universeRegistry.js';
import { createWorldWithAssembly, seedWorlds, type WorldWithAssembly } from './bootstrap/worldBootstrap.js';

async function cleanupRuntimeArtifacts() {
  const cleanOnStart = (process.env.AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START ?? '1') === '1';
  if (!cleanOnStart) return;

  const root = process.cwd();
  const reportsDir = path.join(root, 'data', 'reports');
  try {
    const entries = await fs.promises.readdir(reportsDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
        .map((e) =>
          fs.promises.unlink(path.join(reportsDir, e.name)).catch(() => { })
        )
    );
  } catch {
  }
}

 function parseArgs(): { worldIds: string[]; mode: string; execCommand: string | null } {
   const args = process.argv.slice(2);
   const worldsArg = args.find((arg) => arg.startsWith('--worlds='))?.split('=')[1];
   const worldIds = worldsArg
     ? worldsArg.split(',').map((id) => id.trim()).filter(Boolean)
     : ['Alpha', 'Beta', 'Gamma'];

   const nonWorldArgs = args.filter((arg) => !arg.startsWith('--worlds='));
   let mode = 'cli';
   let execCommand: string | null = null;

   let i = 0;
   while (i < nonWorldArgs.length) {
     const arg = nonWorldArgs[i];
     if (arg === '--mode') {
       const next = nonWorldArgs[i + 1];
       if (next && !next.startsWith('--')) {
         mode = next;
         i += 2;
       } else {
         i += 1;
       }
     } else if (arg.startsWith('--mode=')) {
       mode = arg.split('=')[1] || 'cli';
       i += 1;
     } else {
       break;
     }
   }

   if (mode === 'exec' && i < nonWorldArgs.length) {
     execCommand = nonWorldArgs.slice(i).join(' ');
   }

   return { worldIds, mode, execCommand };
 }

async function main() {
  await cleanupRuntimeArtifacts();
  const lang = (process.env.AETHERIUS_OUTPUT_LANG ?? '').toLowerCase();
  const isKorean = lang === 'ko';
  const initMsg = '🌌 Initializing Aetherius Engine Core...';
  console.log(
    isKorean
      ? `${initMsg} (Aetherius 엔진 코어를 초기화하는 중입니다...)`
      : initMsg
  );

  const { worldIds, mode, execCommand } = parseArgs();
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
  } else if (mode === 'exec') {
    if (!execCommand) {
      console.error('Error: No command provided for exec mode.');
      process.exit(1);
    }
    const result = await commandHandler.execute(execCommand);
    if (result.success) {
      console.log(result.message);
      if (result.data) {
        console.log(JSON.stringify(result.data, null, 2));
      }
      process.exit(0);
    } else {
      console.error(result.message);
      process.exit(1);
    }
  } else {
    const cli = new CLI(commandHandler);
    const warpMsg = '\n🧪 EXPERIMENTAL MODE: Auto-Warping 200 ticks to seed evolution data...';
    console.log(
      isKorean
        ? `${warpMsg} (진화 데이터를 시드하기 위해 200틱을 자동 진행합니다...)`
        : warpMsg
    );
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
