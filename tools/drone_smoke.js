import { universeRegistry } from '../dist/core/space/universeRegistry.js';
import { World } from '../dist/core/world.js';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createEntityByAssemblyWithManager } from '../dist/entities/catalog.js';
import { EnvLayer } from '../dist/core/environment/environmentGrid.js';

const manager = new AssembleManager();
const world = new World('Alpha');
universeRegistry.registerWorld({ worldId: world.id, world, manager });

createEntityByAssemblyWithManager(manager, 'Plant_Species_001', 'Alpha_Plant_01');
createEntityByAssemblyWithManager(manager, 'Creature_Type_001', 'Alpha_Creature_01');
createEntityByAssemblyWithManager(manager, 'Drone_Observer_001', 'Alpha_Drone_01');

const drone = manager.getEntity('Alpha_Drone_01');
const c = drone.children[0].components;
c.identity.owner = 'ScientistCouncil';
c.identity.role = 'Ecology';
c.mission.mode = 'irrigate';
c.camera.intervalTicks = 1;
c.intervention.intervalTicks = 1;
c.intervention.enabled = true;

for (let i = 0; i < 5; i++) {
  await world.tick();
  manager.listenUpdate({ world, deltaTime: 1.0 });
  manager.update();
}

console.log('ok', { droneEnergy: c.energy.energy, moisture: world.environment.get(c.position.x, c.position.y, EnvLayer.SoilMoisture) });
