#!/usr/bin/env node
/**
 * Aetherius Dataset CLI (학습데이터 수집·정규화·선형 학습·백업)
 * - 서버 API(tick, snapshot/latest, dataset/backup, model/linear) 사용
 * - steps > 0: 수집만 또는 수집 후 --train-after --apply --backup
 * - steps = 0 (기본): 자동 모드(duration 분 동안 cycle 반복, 주기적 백업/적용)
 *
 * 사용법:
 *   node tools/run_headless.js [옵션...]
 *   npm run dataset:cli -- steps=200
 *   npm run dataset:cli -- steps=500 --train-after --backup
 *   npm run dataset:cli -- apiBase=http://localhost:3000/api duration=60 cycle=200
 *
 * 옵션 (key=value):
 *   apiBase     API 베이스 URL (기본: http://localhost:3000/api)
 *   steps       수집할 tick 수. 0이면 자동 모드 (기본: 0)
 *   interval    tick 간 대기 ms (기본: 0)
 *   duration    자동 모드 실행 시간(분) (기본: 240)
 *   cycle       자동 모드 한 사이클당 tick 수 (기본: 200)
 *   maxrows     유지할 최대 행 수 (기본: 50000)
 *   backup      자동 모드에서 백업 간격(분) (기본: 60)
 *   epochs      학습 에폭 (기본: 3)
 *   batch       배치 크기 (기본: 128)
 *   lr          학습률 (기본: 0.01)
 *
 * 플래그 (steps > 0 일 때 수집 후 실행):
 *   --train-after   수집 후 선형 모델 학습 1회
 *   --apply         학습된 모델을 서버에 적용 (POST /model/linear)
 *   --backup        데이터셋을 서버 백업 (POST /dataset/backup)
 *   --help          이 도움말 출력
 */

import * as tf from '@tensorflow/tfjs';

const args = process.argv.slice(2);
const flags = { help: false, trainAfter: false, apply: false, backup: false };
const params = {
  apiBase: 'http://localhost:3000/api',
  duration: 240,
  cycle: 200,
  maxrows: 50000,
  backup: 60,
  epochs: 3,
  batch: 128,
  lr: 0.01,
  steps: 0,
  interval: 0
};

for (const arg of args) {
  if (arg === '--help' || arg === '-h') {
    flags.help = true;
    continue;
  }
  if (arg === '--train-after') {
    flags.trainAfter = true;
    continue;
  }
  if (arg === '--apply') {
    flags.apply = true;
    continue;
  }
  if (arg === '--backup') {
    flags.backup = true;
    continue;
  }
  const [key, val] = arg.split('=');
  if (!key || val == null || !(key in params)) continue;
  if (key === 'apiBase') {
    params.apiBase = val;
  } else {
    params[key] = Number(val);
  }
}

if (flags.help) {
  console.log(`
Aetherius Dataset CLI — 서버 API로 tick 수집·정규화·선형 학습·백업

  npm run dataset:cli -- [옵션...] [--train-after] [--apply] [--backup]

  steps > 0  수집 모드: 지정 tick만 수집. --train-after/--apply/--backup 시 수집 후 실행.
  steps = 0 자동 모드: duration(분) 동안 cycle마다 수집·학습, backup(분)마다 백업/적용.

  옵션 예: apiBase=... steps=200 duration=60 cycle=200 maxrows=50000
`);
  process.exit(0);
}

const FEATURE_ORDER = [
  'energy',
  'hydration',
  'biomass',
  'w_survive',
  'w_grow',
  'w_explore',
  'purpose_kind'
];

const rows = [];
const rawFeatureRows = [];
const prevByNode = new Map();
let norm = null;
let trained = null;
let linearModel = null;
let stopRequested = false;

function log(line) {
  console.log(line);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function nowIsoSafe() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function initTf() {
  await tf.setBackend('cpu');
  await tf.ready();
  log(`tf backend: ${tf.getBackend()}`);
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function getJson(url) {
  const res = await fetch(url);
  return res.json();
}

function extractGaRows(snapshot) {
  const out = [];
  if (!snapshot || !snapshot.nodes) return out;
  for (const node of snapshot.nodes) {
    const ga = node.components && node.components.GoalGA;
    if (!ga || !ga.genome || !ga.physiology || !ga.growth) continue;
    out.push({
      nodeId: node.id,
      genome: ga.genome,
      purpose: ga.purpose,
      physiology: ga.physiology,
      growth: ga.growth,
      position: ga.position,
      metrics: ga.metrics
    });
  }
  return out;
}

function featurize(ga) {
  const w = ga.genome.weights;
  return [
    ga.physiology.energy / 100,
    ga.physiology.hydration / 100,
    ga.growth.biomass / 100,
    w.survive,
    w.grow,
    w.explore,
    ga.purpose && ga.purpose.kind ? hashPurpose(ga.purpose.kind) : 0
  ];
}

function hashPurpose(kind) {
  if (kind === 'Survive') return 0.0;
  if (kind === 'Grow') return 0.5;
  return 1.0;
}

function computeNormalization(features) {
  return tf.tidy(() => {
    const x = tf.tensor2d(features, [features.length, features[0].length]);
    const meanT = x.mean(0);
    const centered = x.sub(meanT);
    const stdT = centered.square().mean(0).add(1e-6).sqrt();
    const mean = meanT.arraySync();
    const std = stdT.arraySync();
    return { mean, std };
  });
}

function normalizeBatch(features, mean, std) {
  return tf.tidy(() => {
    const x = tf.tensor2d(features, [features.length, features[0].length]);
    const meanT = tf.tensor1d(mean);
    const stdT = tf.tensor1d(std);
    const z = x.sub(meanT).div(stdT);
    return z.arraySync();
  });
}

function enforceMaxRows(maxRows) {
  if (rows.length <= maxRows) return;
  const drop = rows.length - maxRows;
  rows.splice(0, drop);
  rawFeatureRows.splice(0, drop);
}

function recomputeNormalizationAndX() {
  if (!rawFeatureRows.length) return;
  norm = computeNormalization(rawFeatureRows);
  const xNorm = normalizeBatch(rawFeatureRows, norm.mean, norm.std);
  for (let i = 0; i < rows.length; i++) rows[i].x = xNorm[i];
}

async function collectSteps(steps, intervalMs, maxRows, apiBase) {
  let worldId = null;
  for (let i = 0; i < steps; i++) {
    if (stopRequested) return;
    log(`collect tick ${i + 1}/${steps} (rows=${rows.length})`);
    await postJson(`${apiBase}/tick`, { count: 1 });
    const snapRes = await getJson(`${apiBase}/snapshot/latest`);
    const snapshot = snapRes && snapRes.data;
    if (!snapshot) {
      log('snapshot 없음');
      return;
    }
    worldId = snapshot.worldId;

    const gaRows = extractGaRows(snapshot);
    const feats = gaRows.map(featurize);

    for (let idx = 0; idx < gaRows.length; idx++) {
      const ga = gaRows[idx];
      const prev = prevByNode.get(ga.nodeId);
      const label = prev ? (ga.growth.biomass - prev.biomass) : null;
      prevByNode.set(ga.nodeId, { biomass: ga.growth.biomass });

      if (label === null) continue;

      const pred = snapshot.predictions && snapshot.predictions[ga.nodeId] ? snapshot.predictions[ga.nodeId] : null;

      rows.push({
        worldId,
        tick: snapshot.tick,
        timestamp: snapshot.timestamp,
        nodeId: ga.nodeId,
        x: null,
        y: label,
        purpose: ga.purpose,
        genome: ga.genome,
        prediction: pred
      });
      rawFeatureRows.push(feats[idx]);
    }

    enforceMaxRows(maxRows);

    if (i % 20 === 0) log(`tick=${snapshot.tick}, rows=${rows.length}`);
    if (intervalMs > 0) await sleep(intervalMs);
  }

  if (rows.length > 0) {
    recomputeNormalizationAndX();
    log(`norm updated. rows=${rows.length}`);
  }
}

async function trainLinear() {
  if (!rows.length) return;
  await initTf();

  const epochs = Math.max(1, Number(params.epochs || 1));
  const batchSize = Math.max(8, Number(params.batch || 32));
  const lr = Math.max(0.0001, Number(params.lr || 0.01));

  const xArr = rows.map((r) => r.x).filter(Boolean);
  const yArr = rows.slice(0, xArr.length).map((r) => [r.y]);

  if (!linearModel) {
    linearModel = tf.sequential();
    linearModel.add(tf.layers.dense({ units: 1, inputShape: [FEATURE_ORDER.length], useBias: true }));
    linearModel.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });
  } else {
    linearModel.compile({ optimizer: tf.train.adam(lr), loss: 'meanSquaredError' });
  }

  log(`train start. epochs=${epochs}, batch=${batchSize}, lr=${lr}`);
  await linearModel.fit(tf.tensor2d(xArr), tf.tensor2d(yArr), {
    epochs,
    batchSize,
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        log(`epoch ${epoch + 1}/${epochs} loss=${logs.loss?.toFixed(6)} val=${(logs.val_loss ?? 0).toFixed(6)}`);
        await sleep(0);
      }
    }
  });

  const w = linearModel.getWeights()[0].arraySync().map((row) => row[0]);
  const b = linearModel.getWeights()[1].arraySync()[0];

  trained = { weights: w, bias: b };
  log(`trained. bias=${b}`);
}

function buildModelJson() {
  if (!trained || !norm) return null;
  return {
    modelType: 'linear',
    featureOrder: FEATURE_ORDER,
    mean: norm.mean,
    std: norm.std,
    weights: trained.weights,
    bias: trained.bias
  };
}

async function applyToServer(apiBase) {
  const payload = buildModelJson();
  if (!payload) return;
  const res = await postJson(`${apiBase}/model/linear`, payload);
  log(`apply result: ${JSON.stringify(res)}`);
}

async function backupDatasetToGit(apiBase) {
  const ts = nowIsoSafe();
  const jsonl = rows.map((r) => JSON.stringify(r)).join('\n') + '\n';
  const res = await postJson(`${apiBase}/dataset/backup`, { jsonl, name: `aetherius-dataset-${ts}.jsonl` });
  log(`backup result: ${JSON.stringify(res)}`);
}

async function runOnce() {
  await initTf();
  const apiBase = params.apiBase.replace(/\/$/, '');
  await collectSteps(Math.max(1, params.steps), Math.max(0, params.interval), Math.max(1000, params.maxrows), apiBase);
  log(`완료: rows=${rows.length}`);

  if (rows.length > 0 && flags.trainAfter) {
    await trainLinear();
  }
  if (flags.apply && trained) {
    await applyToServer(apiBase);
  }
  if (flags.backup && rows.length > 0) {
    await backupDatasetToGit(apiBase);
  }
}

async function autoRun() {
  await initTf();
  const durationMin = Math.max(1, Number(params.duration || 1));
  const cycleSteps = Math.max(1, Number(params.cycle || 1));
  const interval = Math.max(0, Number(params.interval || 0));
  const maxRows = Math.max(1000, Number(params.maxrows || 1000));
  const backupEveryMin = Math.max(1, Number(params.backup || 60));

  const endAt = Date.now() + durationMin * 60 * 1000;
  let nextBackupAt = Date.now() + backupEveryMin * 60 * 1000;

  log(`auto start. durationMin=${durationMin}, cycleSteps=${cycleSteps}, maxRows=${maxRows}, backupEveryMin=${backupEveryMin}`);

  while (!stopRequested && Date.now() < endAt) {
    await collectSteps(cycleSteps, interval, maxRows, params.apiBase.replace(/\/$/, ''));
    if (stopRequested) break;
    if (rows.length > 0) {
      await trainLinear();
    }
    if (Date.now() >= nextBackupAt) {
      if (rows.length > 0) await backupDatasetToGit(params.apiBase.replace(/\/$/, ''));
      if (trained) await applyToServer(params.apiBase.replace(/\/$/, ''));
      nextBackupAt = Date.now() + backupEveryMin * 60 * 1000;
    }
    await sleep(0);
  }

  if (rows.length > 0) await backupDatasetToGit(params.apiBase.replace(/\/$/, ''));
  if (trained) await applyToServer(params.apiBase.replace(/\/$/, ''));

  log(stopRequested ? `중지됨: rows=${rows.length}` : `완료: rows=${rows.length}`);
}

process.on('SIGINT', () => {
  stopRequested = true;
});

(async () => {
  log('🚀 CLI dataset tool starting');
  log(`apiBase=${params.apiBase}`);

  if (params.steps && params.steps > 0) {
    await runOnce();
  } else {
    await autoRun();
  }
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
