#!/usr/bin/env node
/**
 * 데이터셋 내보내기: persistence에서 스냅샷 + 이벤트를 JSONL로 저장.
 * 사용: npm run build && node tools/export_dataset.js [worldId] [fromTick] [toTick] [limit] [output.jsonl]
 *   worldId 기본: export-default
 *   fromTick, toTick, limit 생략 시 전체(또는 limit 10000)
 *   output 기본: datasets/export-<worldId>-<timestamp>.jsonl
 *
 * .env의 AETHERIUS_NOSQL_DRIVER 등에 따라 DB 연동 (docs/DB_HOSTING.md).
 * API로 내보내려면: GET /api/dataset/export?worldId=...&fromTick=...&toTick=...&limit=...
 */

import 'dotenv/config';
import { createPersistenceFromEnv } from '../dist/data/persistence.js';
import fs from 'node:fs';
import path from 'node:path';

const worldId = process.argv[2] || 'export-default';
const fromTick = process.argv[3] !== undefined ? Number(process.argv[3]) : undefined;
const toTick = process.argv[4] !== undefined ? Number(process.argv[4]) : undefined;
const limit = process.argv[5] !== undefined ? Math.min(50000, Math.max(1, Number(process.argv[5]))) : 10000;
const outArg = process.argv[6];

async function main() {
  const persistence = createPersistenceFromEnv();
  console.log('Export dataset from persistence (driver=%s), worldId=%s', persistence.driver, worldId);

  const [snapshot, events] = await Promise.all([
    persistence.getLatestSnapshot(worldId),
    persistence.getWorldEvents(worldId, { fromTick, toTick, limit })
  ]);

  const lines = [];
  if (snapshot) {
    lines.push(JSON.stringify({ rowType: 'snapshot', ...snapshot }));
  }
  for (const ev of events) {
    lines.push(JSON.stringify({ rowType: 'event', ...ev }));
  }

  const outDir = path.join(process.cwd(), 'datasets');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = outArg
    ? path.resolve(outArg)
    : path.join(outDir, `export-${worldId}-${Date.now()}.jsonl`);
  fs.writeFileSync(outFile, lines.join('\n'), 'utf-8');

  console.log('Wrote %d lines to %s', lines.length, path.relative(process.cwd(), outFile));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
