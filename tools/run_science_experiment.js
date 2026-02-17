#!/usr/bin/env node
/**
 * 과학자 에이전트 + Gemini + DB 이벤트 기록 실험
 * - 월드 부트스트랩 → ask_science 1회 실행 → persistence 이벤트 개수 확인
 *
 * 사용: npm run experiment:science [질문]
 *     예: npm run experiment:science -- "What should we log next tick?"
 * .env에 GEMINI_API_KEY 필요.
 */

import 'dotenv/config';
import { AssembleManager } from '../dist/entities/assembly.js';
import { createWorldWithAssembly, seedWorlds } from '../dist/bootstrap/worldBootstrap.js';
import { CommandHandler } from '../dist/app/commandHandler.js';
import { universeRegistry } from '../dist/core/space/universeRegistry.js';

const query = process.argv[2] || 'What should we log next tick?';

async function main() {
  console.log('🌌 [실험] Aetherius 과학자 에이전트 + DB 이벤트 기록\n');

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

  const eventsBefore = await world.persistence.getWorldEventCount(world.id);
  console.log(`  DB driver: ${world.persistence.driver}, 이벤트 수(실험 전): ${eventsBefore}\n`);

  console.log(`  실행: ask_science "${query}"\n`);
  const result = await commandHandler.execute(`ask_science ${query}`);

  const eventsAfter = await world.persistence.getWorldEventCount(world.id);
  const added = eventsAfter - eventsBefore;

  if (!result.success) {
    console.error('❌ 실패:', result.message);
    process.exit(1);
  }

  console.log('\n--- 결과 ---');
  console.log('  성공:', result.success);
  console.log('  DB 이벤트 수(실험 후):', eventsAfter, '(추가:', added, ')');
  console.log('  기대: 가설 4 + 동료검토 12 + 합성 1 + 보고서 1 = 18건 이상');
  const ok = added >= 18;
  console.log(ok ? '\n✅ 실험 통과: 여러 에이전트 활동이 이벤트로 DB에 기록됨.' : '\n⚠️ 이벤트 수가 기대보다 적음. recordExperimentEvent 연동 확인.');
  if (result.message && result.message.length < 500) {
    console.log('\n  보고서 요약:', result.message.slice(0, 300) + '...');
  }
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
