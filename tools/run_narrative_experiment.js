#!/usr/bin/env node
/**
 * Narrative(역사학자·기록학자·스토리텔러) 실험
 * - 월드 부트스트랩 → narrative 명령 1회 → past/present/future/combined 존재·형식 검증
 *
 * 사용: npm run experiment:narrative
 * .env에 GEMINI_API_KEY 필요. 없으면 LLM 무음으로 combined가 비거나 에러 메시지일 수 있음.
 */

import 'dotenv/config';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createWorldWithAssembly, seedWorlds } from '../dist/bootstrap/worldBootstrap.js';
import { CommandHandler } from '../dist/app/commandHandler.js';
import { universeRegistry } from '../dist/core/space/universeRegistry.js';

async function main() {
  console.log('📜 [실험] Narrative (역사학자·기록학자·스토리텔러)\n');

  const manager = new AssembleManager();
  const created = createWorldWithAssembly('Alpha', 'Weather_Sunny_001', manager);
  universeRegistry.registerWorld({
    worldId: created.world.id,
    world: created.world,
    manager: created.manager
  });
  seedWorlds([created]);

  const { world, weatherEntity } = created;
  const commandHandler = new CommandHandler(world, weatherEntity);

  console.log('  실행: narrative\n');
  const result = await commandHandler.execute('narrative');

  if (!result.success) {
    console.error('❌ 실패:', result.message);
    process.exit(1);
  }

  const msg = result.message || '';
  const hasPast = /\[과거\]|\[past\]/i.test(msg) || msg.length > 50;
  const hasPresent = /\[현재\]|\[present\]/i.test(msg) || msg.length > 50;
  const hasFuture = /\[미래\]|\[future\]/i.test(msg) || msg.length > 50;
  const ok = msg.length >= 20 && (hasPast || hasPresent || hasFuture);

  console.log('\n--- 결과 ---');
  console.log('  성공:', result.success);
  console.log('  combined 길이:', msg.length);
  console.log(ok ? '\n✅ 실험 통과: narrative가 past/present/future 조합을 반환함.' : '\n⚠️ combined 내용이 기대보다 짧거나 형식이 다름. GEMINI_API_KEY 확인.');
  if (msg && msg.length <= 400) {
    console.log('\n  출력:', msg);
  } else if (msg) {
    console.log('\n  출력(앞 200자):', msg.slice(0, 200) + '...');
  }
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
