#!/usr/bin/env node
/**
 * DB 호스팅 연동 실험
 * - .env의 AETHERIUS_NOSQL_DRIVER / MONGODB_URI / REDIS_URL 기준으로
 *   persistence 생성 → 테스트 이벤트 저장 → 읽기 검증
 *
 * 사용: npm run experiment:db
 * .env에 드라이버별 연결 정보 설정 후 실행 (docs/DB_HOSTING.md 참고)
 */

import 'dotenv/config';
import { createPersistenceFromEnv } from '../dist/data/persistence.js';

const TEST_WORLD_ID = 'db-hosting-test-' + Date.now();

async function main() {
  console.log('🔌 [실험] DB 호스팅 연동 검증\n');

  const driver = (process.env.AETHERIUS_NOSQL_DRIVER || 'inmemory').toLowerCase();
  console.log('  드라이버:', driver);
  if (driver === 'mongodb') {
    const u = process.env.AETHERIUS_MONGODB_URI || '';
    console.log('  URI:', u ? u.replace(/:[^:@]+@/, ':***@') : '(미설정 → 기본값)');
  }
  if (driver === 'redis') {
    const u = process.env.AETHERIUS_REDIS_URL || '';
    console.log('  URL:', u ? u.replace(/:[^:@]+@/, ':***@') : '(미설정 → 기본값)');
  }
  console.log('');

  let persistence;
  try {
    persistence = createPersistenceFromEnv();
  } catch (e) {
    console.error('❌ Persistence 생성 실패:', e.message);
    process.exit(1);
  }

  try {
    // 1) 테스트 이벤트 저장
    await persistence.saveWorldEvent({
      worldId: TEST_WORLD_ID,
      tick: 0,
      type: 'OTHER',
      location: { x: 0, y: 0 },
      details: JSON.stringify({
        kind: 'hosting_test',
        at: new Date().toISOString(),
        driver: persistence.driver
      })
    });

    // 2) 이벤트 개수로 읽기 검증
    const count = await persistence.getWorldEventCount(TEST_WORLD_ID);

    // 3) 스냅샷 저장·조회 (선택 검증)
    await persistence.saveTickSnapshot({
      worldId: TEST_WORLD_ID,
      tick: 0,
      timestamp: Date.now(),
      nodes: [],
      entities: []
    });
    const snap = await persistence.getLatestSnapshot(TEST_WORLD_ID);

    const eventOk = count >= 1;
    const snapshotOk = snap != null && snap.worldId === TEST_WORLD_ID;

    if (eventOk && snapshotOk) {
      console.log('  이벤트 저장·조회: OK (count=' + count + ')');
      console.log('  스냅샷 저장·조회: OK');
      console.log('\n✅ DB 호스팅 연동 정상. (driver=' + persistence.driver + ')');
      process.exit(0);
    } else {
      console.log('  이벤트 저장·조회:', eventOk ? 'OK' : 'FAIL', '(count=' + count + ')');
      console.log('  스냅샷 저장·조회:', snapshotOk ? 'OK' : 'FAIL');
      console.log('\n⚠️ 일부 검증 실패.');
      process.exit(1);
    }
  } catch (e) {
    console.error('\n❌ 호스팅 연동 실패:', e.message);
    if (e.message && (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND') || e.message.includes('authentication'))) {
      console.error('   → URI/URL·네트워크·IP 화이트리스트(Atlas) 확인. docs/DB_HOSTING.md 참고.');
    }
    process.exit(1);
  }
}

main();
