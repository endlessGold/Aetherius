# LLM 에이전트 오케스트레이션 실험 로그 (gemini-3-flash-preview)

실험 일시: 2026-02-20  
모델: `gemini-3-flash-preview` (Google GenAI, `@google/genai` 기반)  
엔진: Aetherius Simulation Engine (server 모드)

---

## 1. 실험 목적

- LLM 기반 과학자 에이전트(ScienceOrchestrator)가 실제 월드 상태를 보고
  - 포식자-피식자 진화를 가속하기 위한 개입 방안을 제안하는지,
  - 추천 명령이 Aetherius의 실제 명령 체계(`advance_tick`, `change_environment` 등)와 호환되는지,
  를 확인한다.
- 이 과정에서
  - LLM 서비스(`GeminiLLMService`)와
  - HTTP 오케스트레이션 라우트(`/api/science`)
  의 동작을 검증하고, 발견된 버그를 수정한다.

---

## 2. 환경 설정

- 명령

```bash
npm run build
npm start -- --mode server
```

- 서버 로그 (요약)

```text
🌌 Initializing Aetherius Engine Core...
🧠 Simulation brain module initialized.
[EnvironmentGrid] Initialized virtual grid: 7000x7000
[EnvironmentGrid] Total potential parameters: 1,029,000,000 (Target: >1 Billion)
[NatureSystem] Initializing starting zone (1024x1024)...
Environment initialized with high-resolution parameters.
[WorldSession] Starting tick loop for world Alpha (1000ms)
🌍 Aetherius Server running on http://localhost:3000
   - POST /api/command { "cmd": "..." }
   - GET /api/science?q=질문  또는  POST /api/science { "query": "질문" }
   - GET /api/status
   - POST /api/snapshots
   - POST /api/events
```

---

## 3. 실험 시나리오

### 3.1 Tick 진행 (환경 워밍업)

PowerShell에서:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/tick" `
  -Method Post -ContentType "application/json" `
  -Body '{"count":50}'
```

응답:

```text
success message
------- -------
   True Advanced 50 ticks. (worldTick=56)
```

### 3.2 과학 질의: 포식자-피식자 진화 가속

요청:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/science" `
  -Method Post -ContentType "application/json" `
  -Body '{"query":"이 월드에서 포식자-피식자 진화를 빠르게 가속하려면 어떤 개입이 필요할까?","projectContext":"우리는 포식자-피식자 동역학과 질병 압력, 기후 스트레스가 결합된 진화를 관찰하고 싶다.","executeActions":false}'
```

### 3.3 최초 버그: 잘못된 커맨드 라우팅

처음 시도 시 `/api/science`가 내부적으로 잘못된 커맨드를 만들어 CLI에 전달했다.

- 기존 구현 ([getScience.ts](file:///f:/Projects/Aetherius/src/app/server/routes/getScience.ts#L20-L35)):

```ts
const q = (req.query.q as string) || (req.body?.query as string);
...
const cmdStr = [q.trim(), executeActions ? '--execute' : '', translateToKo ? '--ko' : '']
  .filter(Boolean)
  .join(' ');

const result = await session.enqueueRequest('command', { cmdStr });
```

- 결과적으로 첫 토큰이 실제 명령어가 아니라 **질문 문장**이 되어,
  `Unknown command: ?` 에러가 발생했다.

PowerShell 출력:

```text
success message
------- -------
  False Unknown command: ?. The heavens are silent.
```

#### 수정

커맨드 문자열을 `ask_science` 기반으로 생성하도록 수정했다.

- 수정 후 구현 ([getScience.ts](file:///f:/Projects/Aetherius/src/app/server/routes/getScience.ts#L32-L35)):

```ts
const executeActions = Boolean(req.body?.executeActions);
const translateToKo = (req.query.lang as string)?.toLowerCase() === 'ko'
  || (req.body?.lang as string)?.toLowerCase() === 'ko'
  || process.env.AETHERIUS_OUTPUT_LANG === 'ko';

const cmdStr = [
  'ask_science',
  q.trim(),
  executeActions ? '--execute' : '',
  translateToKo ? '--ko' : ''
].filter(Boolean).join(' ');
```

이제 `/api/science` → `ask_science <query> [--execute] [--ko]` 형태로 정상 위임된다.

---

## 4. LLM 서비스 동작 검증

### 4.1 퀵 테스트 스크립트

LLM 연결 확인용 스크립트: [llm_quick_test.mjs](file:///f:/Projects/Aetherius/tools/llm_quick_test.mjs)

명령:

```bash
npm run llm:test
```

핵심 코드:

```js
const model = (process.env.GEMINI_MODEL?.trim() || 'gemini-3-flash-preview');
...
const response = await ai.models.generateContent({ model, contents: 'Say hello from Aetherius in one short sentence.' });
console.log('--- LLM quick test response ---');
const txt = typeof response.text === 'function'
  ? response.text()
  : (response.response ? response.response.text() : JSON.stringify(response));
console.log(txt);
```

실행 로그 (요약):

```text
Using model: gemini-3-flash-preview
Attempt 1...
--- LLM quick test response ---
{"candidates":[{"content":{"parts":[{"text":"Hello from Aetherius.","...}]}],"modelVersion":"gemini-3-flash-preview", ...}
```

→ `gemini-3-flash-preview` 모델이 정상적으로 응답을 반환하는 것을 확인.

### 4.2 LLM 서비스 리팩터링

`GeminiLLMService.generate`에서 최신 SDK 구조에 맞게 응답 파싱을 리팩터링 했다.  
([llmService.ts](file:///f:/Projects/Aetherius/src/ai/llmService.ts#L66-L110))

```ts
const result = await this.client.models.generateContent({ ... });

const anyResult = result as any;
if (typeof anyResult.text === 'string') {
  return anyResult.text.trim();
}
if (anyResult.response && typeof anyResult.response.text === 'function') {
  const t = anyResult.response.text();
  return typeof t === 'string' ? t.trim() : '';
}
return '';
```

이로써
- `result.text`가 getter 문자열인 경우,
- `result.response.text()` 함수로 제공되는 경우,
둘 다 안전하게 처리할 수 있다.

---

## 5. EvolutionSystem 런타임 이슈 관찰

Tick 진행 중, 진화 시스템에서 다음과 같은 런타임 오류가 발생했다.

서버 로그 (발췌):

```text
[WorldSession] Tick error in world Alpha: TypeError: Cannot read properties of undefined (reading 'size')
    at EvolutionSystem.crossoverGenome (.../dist/entities/evolutionSystem.js:294:31)
    at EvolutionSystem.evolve (.../dist/entities/evolutionSystem.js:260:36)
    at EvolutionSystem.tick (.../dist/entities/evolutionSystem.js:32:18)
    at world.tick (.../dist/bootstrap/worldBootstrap.js:24:25)
    at WorldSession.processTick (.../dist/app/server/worldSession.js:62:13)
```

이는 GA 기반 방향/유전자 시스템에서 **비어 있는 또는 초기화되지 않은 개체 집합**에 대해 `size`를 읽으려 할 때 발생한 것으로 추정된다.

이번 실험에서는:
- 환경/기후/생태 Tick과 LLM 오케스트레이션 동작을 중심으로 검증했으며,
- EvolutionSystem의 세부 로직은 별도의 리팩터링 항목으로 남겨두었다.

향후 작업 아이디어:
- `crossoverGenome` 진입 시 입력 개체/집합에 대한 방어적 체크 추가
- 개체 수가 일정 기준 이하일 때는 진화 스텝을 스킵하거나, 최소 개체 수를 보장하는 리스폰 규칙 추가

---

## 6. 실험 결과 요약

1. **LLM 연결**
   - `gemini-3-flash-preview` 모델을 기반으로 LLM 호출이 정상 작동함을 퀵 테스트로 확인했다.
   - `GeminiLLMService`를 최신 SDK 응답 구조에 맞게 리팩터링하여, 서비스 레벨에서도 안정적으로 텍스트를 추출하도록 했다.

2. **/api/science 오케스트레이션 버그 수정**
   - 기존에는 `/api/science`가 질문 문자열 자체를 커맨드로 전달하여 `Unknown command: ?` 오류가 발생했다.
   - 이를 `ask_science <query> [--execute] [--ko]` 형태로 위임하도록 수정했다.

3. **Tick 및 서버 동작**
   - `/api/tick` 호출로 worldTick을 50틱 진행하는 데 성공했다.
   - EnvironmentGrid 및 NatureSystem 초기화가 정상적으로 수행되며, 서버는 `WorldSession` Tick 루프를 유지한다.

4. **진화 시스템 이슈**
   - EvolutionSystem에서 `size`를 읽는 과정에서 런타임 오류가 발생하는 것을 확인했다.
   - 이는 현재 진화 알고리즘의 로버스트니스 문제이며, LLM/오케스트레이션 레벨과는 독립된 개선 과제로 남겨두었다.

---

## 7. 다음 단계 제안

1. **EvolutionSystem 하드닝**
   - crossover/selection 단계에 대한 입력 검증을 추가하고, 개체 수가 충분하지 않을 때 graceful degrade하도록 설계.

2. **자동 실험 시나리오 스크립트화**
   - `npm run scenario:evolution` 같은 스크립트를 추가하여:
     1) Tick 진행 → 2) `/api/science` 질의 → 3) 추천 명령 일부 실행 → 4) `/api/dataset/export`로 결과 캡처 → 5) 요약 리포트를 자동 생성하는 파이프라인 구현.

3. **데이터 피드백 루프 실험**
   - 드론 다큐멘터리 로그 및 life_science_* 관측 데이터(JSONL)를 기반으로,
     과거 실험 데이터를 `projectContext`에 주입해 LLM이 “자기 실험 결과”를 활용하는지 평가.

이번 문서는 위 실험 과정에서의 **실제 터미널 로그와 시스템 동작**을 기반으로 작성되었으며, LLM 에이전트 및 오케스트레이션 계층이 gemini-3-flash-preview 모델과 함께 어떻게 동작하는지의 기준선으로 사용할 수 있다.

