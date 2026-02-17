import { universeRegistry } from '../dist/core/space/universeRegistry.js';
import { World } from '../dist/core/world.js';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createEntityByAssemblyWithManager } from '../dist/entities/catalog.js';

process.env.AETHERIUS_WORMHOLE_OPEN_CHANCE = '1';
process.env.AETHERIUS_WORMHOLE_TRAVEL_CHANCE = '1';
process.env.AETHERIUS_WORMHOLE_TTL_TICKS = '5';

const managerA = new AssembleManager();
const managerB = new AssembleManager();

const worldA = new World('Alpha');
const worldB = new World('Beta');

universeRegistry.registerWorld({ worldId: worldA.id, world: worldA, manager: managerA });
universeRegistry.registerWorld({ worldId: worldB.id, world: worldB, manager: managerB });

createEntityByAssemblyWithManager(managerA, 'Creature_Type_001', 'Alpha_Creature_01');
createEntityByAssemblyWithManager(managerB, 'Creature_Type_001', 'Beta_Creature_01');

for (let i = 0; i < 30; i++) {
  await worldA.tick();
}

console.log('wormholes', universeRegistry.listWormholes());
console.log('Alpha entities', managerA.entities.map(e => e.id));
console.log('Beta entities', managerB.entities.map(e => e.id));

const moved =
  managerA.getEntity('Alpha_Creature_01') == null ||
  managerB.getEntity('Beta_Creature_01') == null ||
  managerB.getEntity('Alpha_Creature_01') != null ||
  managerA.getEntity('Beta_Creature_01') != null;

console.log('moved', moved);

process.exit(moved ? 0 : 1);
