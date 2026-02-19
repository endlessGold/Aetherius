#!/usr/bin/env node
/**
 * Aetherius 통합 스모크 러너 (빌드 후 dist/ 사용)
 *
 * 사용법:
 *   npm run build && node tools/smoke.js [suite]
 *   npm run smoke
 *   npm run smoke -- wormhole
 *
 * suite: core | wormhole | ecosystem | drone | science | all (기본: all)
 *   core     - World tick + 스냅샷 저장 확인
 *   wormhole - 멀티월드 + 웜홀 이동
 *   ecosystem - 계절/질병/사체/분해
 *   drone    - 드론 엔티티 동작
 *   science  - ScienceOrchestrator (LLM 쿼리, World 없음)
 *   all      - 위 5개 순차 실행
 */

import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

function distImport(relPath) {
  return import(pathToFileURL(path.join(distDir, relPath)).href);
}

const suiteArg = process.argv[2] || 'all';
const suites = suiteArg === 'all' ? ['core', 'wormhole', 'ecosystem', 'drone', 'science'] : [suiteArg];

function log(name, msg) {
  console.log(`[${name}] ${msg}`);
}

async function runCore() {
  const { World } = await distImport('core/world.js');
  const world = new World('Smoke');
  await world.tick();
  await world.tick();
  const snap = await world.persistence.getLatestSnapshot(world.id);
  const ok = snap && snap.tick === 2 && Number.isFinite(snap.timestamp);
  log('core', ok ? `ok tick=${snap.tick} driver=${world.persistence.driver}` : 'fail');
  return ok;
}

async function runWormhole() {
  const { universeRegistry } = await distImport('core/space/universeRegistry.js');
  const { World } = await distImport('core/world.js');
  const { AssembleManager } = await distImport('entities/assembly.js');
  const { createEntityByAssemblyWithManager } = await distImport('entities/catalog.js');

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

  for (let i = 0; i < 30; i++) await worldA.tick();

  const moved =
    managerA.getEntity('Alpha_Creature_01') == null ||
    managerB.getEntity('Beta_Creature_01') == null ||
    managerB.getEntity('Alpha_Creature_01') != null ||
    managerA.getEntity('Beta_Creature_01') != null;
  log('wormhole', moved ? 'ok entities moved' : 'fail');
  return moved;
}

async function runEcosystem() {
  const { World } = await distImport('core/world.js');
  const { AssembleManager } = await distImport('entities/assembly.js');
  const { createEntityByAssemblyWithManager } = await distImport('entities/catalog.js');
  const { EcosystemCycleSystem } = await distImport('entities/ecosystemCycleSystem.js');
  const { Environment } = await distImport('core/environment/environmentGrid.js');

  process.env.AETHERIUS_SEASON_TICKS = '12';

  const world = new World('Alpha');
  const manager = new AssembleManager();
  const eco = new EcosystemCycleSystem();
  const a = createEntityByAssemblyWithManager(manager, 'Creature_Type_001', 'Alpha_Creature_A');
  const b = createEntityByAssemblyWithManager(manager, 'Creature_Type_001', 'Alpha_Creature_B');
  const p = createEntityByAssemblyWithManager(manager, 'Plant_Species_001', 'Alpha_Plant_A');
  const ac = a.children[0].components;
  const bc = b.children[0].components;
  ac.position.x = 50;
  ac.position.y = 50;
  bc.position.x = 51;
  bc.position.y = 50;
  p.children[0].components.position.x = 49;
  p.children[0].components.position.y = 50;
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
  const corpses = manager.entities.filter((e) => e.children?.[0]?.components?.classification?.subtype === 'Corpse');
  const firstCorpse = corpses[0];
  const soilN = firstCorpse
    ? world.environment.get(
        firstCorpse.children[0].components.position.x,
        firstCorpse.children[0].components.position.y,
        Environment.Layer.SoilNitrogen
      )
    : 0;

  const ok =
    season.seasonIndex > 0 &&
    (disease.counts.E + disease.counts.I + disease.counts.R) > 0 &&
    corpseStats.count > 0 &&
    soilN > 0;
  log('ecosystem', ok ? `ok season=${season.seasonIndex} corpses=${corpseStats.count}` : 'fail');
  return ok;
}

async function runDrone() {
  const { universeRegistry } = await distImport('core/space/universeRegistry.js');
  const { World } = await distImport('core/world.js');
  const { AssembleManager } = await distImport('entities/assembly.js');
  const { createEntityByAssemblyWithManager } = await distImport('entities/catalog.js');
  const { Environment } = await distImport('core/environment/environmentGrid.js');

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

  const moisture = world.environment.get(c.position.x, c.position.y, Environment.Layer.SoilMoisture);
  const ok = Number.isFinite(c.energy.energy);
  log('drone', ok ? `ok energy=${c.energy.energy} moisture=${moisture}` : 'fail');
  return ok;
}

async function runScience() {
  const { ScienceOrchestrator } = await distImport('ai/orchestrator.js');
  const query =
    process.argv[3] ||
    '지구 온난화가 해수면 상승에 미치는 영향을 물리학, 생물학, 지질학 관점에서 설명해줘';
  const orchestrator = new ScienceOrchestrator();
  const projectContext = [
    'Project: Aetherius',
    'Smoke test from tools/smoke.js science suite (no live World).'
  ].join('\n');
  const report = await orchestrator.processQuery(query, projectContext);
  const ok = report && report.synthesis && report.synthesis.length > 0;
  log('science', ok ? 'ok synthesis received' : 'fail');
  if (report?.synthesis) console.log(report.synthesis);
  return ok;
}

const runners = { core: runCore, wormhole: runWormhole, ecosystem: runEcosystem, drone: runDrone, science: runScience };

async function main() {
  let failed = 0;
  for (const name of suites) {
    const fn = runners[name];
    if (!fn) {
      console.error(`Unknown suite: ${name}. Use: core, wormhole, ecosystem, drone, science, all`);
      process.exit(1);
    }
    try {
      const ok = await fn();
      if (!ok) failed++;
    } catch (e) {
      console.error(`[${name}]`, e);
      failed++;
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
