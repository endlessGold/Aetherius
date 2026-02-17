import { World } from '../dist/core/world.js';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createEntityByAssemblyWithManager } from '../dist/entities/catalog.js';
import { EcosystemCycleSystem } from '../dist/entities/ecosystemCycleSystem.js';
import { EnvLayer } from '../dist/core/environment/environmentGrid.js';

process.env.AETHERIUS_SEASON_TICKS = '12';

const world = new World('Alpha');
const manager = new AssembleManager();
const eco = new EcosystemCycleSystem();

const a = createEntityByAssemblyWithManager(manager, 'Creature_Type_001', 'Alpha_Creature_A');
const b = createEntityByAssemblyWithManager(manager, 'Creature_Type_001', 'Alpha_Creature_B');
const p = createEntityByAssemblyWithManager(manager, 'Plant_Species_001', 'Alpha_Plant_A');

const ac = a.children[0].components;
const bc = b.children[0].components;
const pc = p.children[0].components;

ac.position.x = 50;
ac.position.y = 50;
bc.position.x = 51;
bc.position.y = 50;
pc.position.x = 49;
pc.position.y = 50;

ac.disease.status = 'I';
ac.disease.strainId = 'Strain_Alpha';
ac.disease.load = 1;
bc.disease.status = 'I';
bc.disease.strainId = 'Strain_Alpha';
bc.disease.load = 1;
bc.vitality.hp = 0;

for (let i = 0; i < 80; i++) {
  await world.tick();
  manager.listenUpdate({ world, deltaTime: 1.0 });
  manager.update();
  await eco.tick(manager, world);
}

const season = eco.getSeasonSnapshot();
const disease = eco.getDiseaseStats(manager);
const corpseStats = eco.getCorpseStats(manager);
const corpses = manager.entities.filter(e => e.children?.[0]?.components?.classification?.subtype === 'Corpse');
const firstCorpse = corpses[0];
const soilN =
  firstCorpse
    ? world.environment.get(firstCorpse.children[0].components.position.x, firstCorpse.children[0].components.position.y, EnvLayer.SoilNitrogen)
    : 0;

const ok = season.seasonIndex > 0 && (disease.counts.E + disease.counts.I + disease.counts.R) > 0 && corpseStats.count > 0 && soilN > 0;
console.log(
  JSON.stringify(
    { ok, season, diseaseCounts: disease.counts, corpses: corpseStats, soilNitrogenAtCorpse: soilN },
    null,
    2
  )
);

process.exit(ok ? 0 : 1);
