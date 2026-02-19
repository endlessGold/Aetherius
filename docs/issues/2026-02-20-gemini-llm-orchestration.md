# Gemini LLM / Science Orchestration 이슈 정리 (2026-02-20)

## 1. 배경

- Aetherius 프로젝트에서 과학 오케스트레이션(ScienceOrchestrator)은 LLM 호출에 강하게 의존한다.
- 기존 구현은 오래된 SDK(`@google/generative-ai`)와 v1beta 엔드포인트에 묶여 있어, 최신 Gemini 3 계열 모델과 공식 가이드와의 괴리가 있었다.
- 또한 science 스모크 테스트는 다수의 에이전트와 동료 검토/반론 단계를 한 번에 수행하여, LLM 호출 수와 응답 시간이 과도하게 컸다.

## 2. 증상

### 2.1 404 Not Found

- Gemini 호출에서 404가 발생했다.
- API 키는 유효했지만, 요청 URL 또는 모델 ID 조합이 실제 서버 리소스와 맞지 않을 때 나타나는 패턴이었다.

### 2.2 429 RESOURCE_EXHAUSTED (쿼터 문제)

- SDK/엔드포인트/모델 구성을 공식 가이드에 맞춘 뒤에는 더 이상 404는 발생하지 않았다.
- 대신 다음과 같은 429 응답을 받았다.

  - `generativelanguage.googleapis.com/generate_content_free_tier_input_token_count` 초과
  - `generativelanguage.googleapis.com/generate_content_free_tier_requests` 초과
  - 특정 프로젝트/모델(`gemini-3-pro`)에 대해 Free Tier 한도가 0 또는 소진 상태

- 즉, 코드/SDK 레벨 문제는 해소되었고, 계정/프로젝트의 요금제·쿼터 설정 문제가 남아 있었다.

## 3. 원인 정리

### 3.1 SDK 및 엔드포인트 불일치

- 이전 코드:
  - `@google/generative-ai` 사용
  - 개발자 콘솔의 최신 예시(`@google/genai`, `GoogleGenAI`)와 불일치
  - 수동으로 URL·모델명을 조합하는 경우 404 위험이 높았다.

### 3.2 모델 가용성 및 이름

- 공식 문서에 존재하는 모델 ID라도, 실제 프로젝트/키에서 해당 모델이 활성화되지 않았으면 404 또는 429가 발생할 수 있다.
- 특히 Gemini 1.5 계열의 단계적 중단(deprecation)과 3.x 프리뷰 도입이 겹치면서, 문서와 실 사용 환경 간의 타이밍 차이 문제가 있었다.

### 3.3 과도한 orchestration 호출 수

- ScienceOrchestrator는 기본적으로:
  - 6명의 ScientistAgent
  - 각자 개별 가설 생성
  - 모든 조합에 대한 동료 검토(peer review)
  - 각 에이전트의 반론(rebuttal)
  - 최종 합성(synthesis)
- 이 구조는 한 번의 과학 쿼리에 대해 수십 번의 LLM 호출을 발생시켜, 무료 쿼터를 빠르게 소진시키고 테스트/실험 속도를 저하시켰다.

## 4. 조치 사항

### 4.1 LLM 서비스 리팩터링 (`@google/genai`)

파일: `src/ai/llmService.ts`

- `@google/generative-ai` → `@google/genai`로 마이그레이션.
- 공식 예시 패턴을 그대로 따른다.

  - `import { GoogleGenAI } from '@google/genai';`
  - `const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });`
  - `client.models.generateContent({ model, contents, ... })`

- 환경변수 사용:

  - `GEMINI_API_KEY`: 필수, `.env`에서 주입.
  - `GEMINI_MODEL`: 선택, 없으면 기본값 사용.

- 기본 모델 전략:

  - 기본값은 최신 가이드와 호환되는 모델 중 하나를 사용한다.
  - 필요에 따라 `.env` 또는 세션 환경변수에서 `GEMINI_MODEL`을 덮어쓴다.

### 4.2 초간단 LLM 헬스 체크 스크립트 도입

파일: `tools/llm_quick_test.mjs`

- 역할: 복잡한 월드/오케스트레이션 없이 LLM만 호출해보는 최소 실험 루트.
- 구현:

  - `.env`에서 `GEMINI_API_KEY`, `GEMINI_MODEL`을 읽어옴.
  - `GoogleGenAI` 클라이언트 생성.
  - `contents: 'Say hello from Aetherius in one short sentence.'` 로 단일 호출.
  - 성공 시 응답 텍스트 출력, 실패 시 에러 전체 출력 후 종료 코드 1.

- npm 스크립트:

  - `"llm:test": "node tools/llm_quick_test.mjs"`
  - 사용 예:

    - `npm run llm:test` (기본 모델)
    - `GEMINI_MODEL=gemini-2.5-flash npm run llm:test`
    - `GEMINI_MODEL=gemini-3-flash-preview npm run llm:test`

### 4.3 ScienceOrchestrator orchestration 경량/구성화

파일: `src/ai/orchestrator.ts`

- 옵션 인터페이스 확장:

  - `mode: 'full' | 'lite'`
  - `maxAgents?: number`
  - `enablePeerReview?: boolean`
  - `enableRebuttal?: boolean`

- 환경변수:

  - `AETHERIUS_SCIENCE_MODE=lite` 로 전체 기본 모드를 경량화할 수 있다.

- 동작:

  - `mode: 'full'` (기본값)
    - 기존 구현과 동일: 가설 + 동료 검토 + 반론 + 합성.
  - `mode: 'lite'`
    - 기본적으로 peer review / rebuttal 비활성화.
    - `maxAgents`로 참여 에이전트 수 제한.

- Phase 2/2.5 조건부 실행:

  - `enablePeerReview`가 false면 동료 검토 전체를 스킵.
  - `enableRebuttal`이 false 또는 review가 비어 있으면 반론 단계 스킵.

### 4.4 스모크 테스트용 science 스위트 경량화

파일: `tools/smoke.js`

- science 스위트에서 orchestrator 생성 부분을 다음과 같이 변경:

  ```js
  const orchestrator = new ScienceOrchestrator({
    mode: 'lite',
    enablePeerReview: false,
    enableRebuttal: false,
    maxAgents: 2
  });
  ```

- 결과:

  - Phase 1: 2명의 에이전트만 가설 생성 → LLM 호출 2회.
  - Phase 2 / 2.5: 완전히 스킵 → 추가 호출 없음.
  - Phase 3: 최종 합성 1회.
  - 총 3회 호출로 science 스모크 테스트가 완료되며, `report.synthesis` 유효성을 검사한다.

## 5. 현재 상태 및 검증

### 5.1 모델별 테스트 결과

- `gemini-3-pro-preview`

  - 구조적으로는 호출 성공 (SDK / 엔드포인트 / 키 / 모델명 정합성 OK).
  - 하지만 해당 프로젝트/키에서 Free Tier 쿼터가 0이어서 429 RESOURCE_EXHAUSTED가 떨어진다.

- `gemini-2.5-flash`

  - `GEMINI_MODEL=gemini-2.5-flash npm run llm:test` → 정상 응답 확인.

- `gemini-3-flash-preview`

  - `GEMINI_MODEL=gemini-3-flash-preview npm run llm:test` → 정상 응답 확인.

### 5.2 스모크 테스트

- `npm run smoke:science`:

  - 빌드(`tsc`) 성공.
  - science 스위트에서 Phase 1/3만 수행, 합성 텍스트 수신.
  - 종료 코드 0, `[science] ok synthesis received` 출력.

## 6. 운영 가이드

### 6.1 LLM 연결 헬스 체크

1. `.env`에 `GEMINI_API_KEY`, `GEMINI_MODEL` 설정.
2. `npm run llm:test` 실행.
3. 기대 결과:
   - 성공 → `--- LLM quick test response ---` + 한 줄 메시지.
   - 실패 → `LLM quick test failed:` + 구체적인 에러 JSON.

### 6.2 science 스모크 테스트

1. `npm run build`
2. `npm run smoke:science`
3. 기대 결과:
   - `[science] ok synthesis received`
   - `ScienceOrchestrator` 합성 결과 본문 출력.

### 6.3 모드 선택 전략

- 개발/실험 중:

  - `AETHERIUS_SCIENCE_MODE=lite`
  - 또는 orchestrator 생성 시 `mode: 'lite', maxAgents: 1~2` 등으로 호출 수 감소.

- 정식 분석/보고서 생성:

  - `mode: 'full'` 유지.
  - 충분한 쿼터/요금제를 확보한 상태에서 사용.

## 7. 후속 과제

- Gemini API 쿼터 및 요금제 상태를 정기적으로 점검하고, 프로젝트/모델별 Free Tier와 유료 한도를 문서화한다.
- science 로직에서 Recommended Actions 포맷 검증을 강화하여, 잘못된 명령이 실행 단계까지 도달하지 않도록 방어 로직을 추가한다.
- orchestration 모드를 더 세분화(예: panel 모드, single-agent 모드)하여, 실험 목적에 따라 호출 패턴을 선택할 수 있게 한다.

