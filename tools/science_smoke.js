import { ScienceOrchestrator } from '../dist/ai/orchestrator.js';

const query =
  process.argv.slice(2).join(' ') ||
  '지구 온난화가 해수면 상승에 미치는 영향을 물리학, 생물학, 지질학 관점에서 설명해줘';

const orchestrator = new ScienceOrchestrator();
const projectContext = [
  'Project: Aetherius',
  'This is a smoke test run from tools/science_smoke.js (no live World instance).',
  'Use generic guidance and focus on what telemetry to add in the codebase.'
].join('\n');
const report = await orchestrator.processQuery(query, projectContext);
console.log(report.synthesis);
