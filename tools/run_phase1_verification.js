#!/usr/bin/env node
/**
 * Phase 1 검증: 결정론 및 그리드 성능
 * - 결정론: 동일 시드 + 동일 tick 수 → 동일 스냅샷(해시) 검증
 * - 성능: N tick 소요 시간 및 메모리 사용량 측정
 *
 * 사용: npm run build && node tools/run_phase1_verification.js [ticks]
 * 기본 ticks: 5 (결정론), 20 (성능)
 */

import 'dotenv/config';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

function distImport(relPath) {
  return import(pathToFileURL(path.join(distDir, relPath)).href);
}

function simpleHash(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return h >>> 0;
}

/** 스냅샷에서 worldId 제외한 비교용 객체 */
function snapshotFingerprint(snap) {
  if (!snap) return null;
  return {
    tick: snap.tick,
    seed: snap.seed,
    rngState: snap.rngState,
    timestamp: snap.timestamp,
    nodesCount: (snap.nodes || []).length,
    entitiesCount: (snap.entities || []).length,
    nodesHash: simpleHash(snap.nodes || []),
    entitiesHash: simpleHash(snap.entities || [])
  };
}

async function runDeterminismCheck(numTicks = 5) {
  process.env.AETHERIUS_DETERMINISTIC = '1';
  process.env.AETHERIUS_WORLD_SEED = '42';

  const { World } = await distImport('core/world.js');
  const world1 = new World('DetA');
  const world2 = new World('DetB');

  for (let i = 0; i < numTicks; i++) {
    await world1.tick();
    await world2.tick();
  }

  const snap1 = await world1.persistence.getLatestSnapshot(world1.id);
  const snap2 = await world2.persistence.getLatestSnapshot(world2.id);
  const fp1 = snapshotFingerprint(snap1);
  const fp2 = snapshotFingerprint(snap2);

  const ok =
    fp1 &&
    fp2 &&
    fp1.tick === numTicks &&
    fp2.tick === numTicks &&
    fp1.seed === fp2.seed &&
    fp1.rngState === fp2.rngState &&
    fp1.nodesHash === fp2.nodesHash &&
    fp1.entitiesHash === fp2.entitiesHash;

  console.log('[Phase1] 결정론 검증:', ok ? 'PASS' : 'FAIL');
  if (!ok) {
    console.log('  Run1 fingerprint:', JSON.stringify(fp1, null, 2));
    console.log('  Run2 fingerprint:', JSON.stringify(fp2, null, 2));
  } else {
    console.log('  동일 시드·동일 tick → 동일 스냅샷 해시');
  }
  return ok;
}

async function runPerformanceMeasurement(numTicks = 20) {
  process.env.AETHERIUS_DETERMINISTIC = '1';
  process.env.AETHERIUS_WORLD_SEED = '43';

  const { World } = await distImport('core/world.js');
  const world = new World('Perf');

  const memBefore = process.memoryUsage?.();
  const start = performance.now();
  for (let i = 0; i < numTicks; i++) {
    await world.tick();
  }
  const elapsed = performance.now() - start;
  const memAfter = process.memoryUsage?.();

  const msPerTick = elapsed / numTicks;
  const heapUsedMB = memAfter?.heapUsed ? (memAfter.heapUsed / 1024 / 1024).toFixed(2) : 'N/A';
  const rssMB = memAfter?.rss ? (memAfter.rss / 1024 / 1024).toFixed(2) : 'N/A';

  console.log('[Phase1] 그리드 성능 측정:');
  console.log(`  ticks=${numTicks}  elapsed=${elapsed.toFixed(0)}ms  ms/tick=${msPerTick.toFixed(2)}`);
  console.log(`  heapUsed=${heapUsedMB}MB  rss=${rssMB}MB`);
  return true;
}

async function main() {
  const ticksArg = parseInt(process.argv[2], 10);
  const numTicks = Number.isFinite(ticksArg) && ticksArg > 0 ? ticksArg : 5;

  console.log('Phase 1 검증 (결정론 + 성능)\n');

  const detOk = await runDeterminismCheck(numTicks);
  console.log('');
  await runPerformanceMeasurement(Math.max(20, numTicks * 2));

  process.exit(detOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
