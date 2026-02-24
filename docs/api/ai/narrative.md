# 역사학자·기록학자·스토리텔러 신 협업 (Narrative)

## 1. 개요

이 세계를 **설명하고 말하는** 세 신(역사학자·기록학자·스토리텔러)이 협업하여, 과거·현재·미래에 대한 자연어 서사를 만든다. 이 결과물은 **모든 과학자 페르소나**가 참고하며, API와 CLI에서도 세계 설명을 자연어로 제공한다.

- **구현**: [src/ai/agents/narrativeAgents.ts](../src/ai/agents/narrativeAgents.ts), [src/ai/narrativeOrchestrator.ts](../src/ai/narrativeOrchestrator.ts)
- **진입점**: CLI `narrative`, API `GET /api/narrative`, 과학자 컨텍스트(ask_science 시 자동 포함)

## 2. 신 페르소나

| 역할 | 이름(예) | 입력 | 출력 |
|------|----------|------|------|
| **역사학자** | Historian | 과거 데이터(최근 이벤트·스냅샷 요약, persistence 조회) | 과거에 대한 짧은 서술(자연어) |
| **기록학자** | Chronicler (Live Caster / World Streamer) | 현재 상태(tick, 엔티티 수, 환경, 종 등) | 현재에 대한 "생중계" 톤의 기록(자연어) |
| **스토리텔러** | Storyteller (Futurist / 미래학자) | 현재·과거 요약(기록학자·역사학자 출력) | 균형 잡힌 미래 전망(자연어) |

- **기록학자(Chronicler)** 는 Aetherius 세계의 **라이브캐스터**이자 기자·유튜브 스트리머 같은 성격이다. 떠들기를 좋아하고 호기심이 많으며, 생중계 중 가끔 과거에 있었던 일을 토픽으로 꺼내기도 한다.
- **스토리텔러(Storyteller)** 는 **미래학자(Futurist)** 로서 진중한 성격을 지닌다. 긍정적 미래나 부정적 미래 어느 쪽에도 편향되지 않으며, Aetherius 세계의 정확한 수요를 찾고 밸런스 있는 공급을 목표로 한다. 미래 설계에 있어서는 밸런스를 가장 중요시한다.

세 명은 **협업 관계**다. 기록학자의 “현재”와 역사학자의 “과거”는 스토리텔러가 참고하고, 한 번의 오케스트레이션에서 **과거 → 현재 → 미래** 순으로 호출된다(Historain·Chronicler 병렬 후 Storyteller가 이 둘을 입력으로 사용).

## 3. 오케스트레이션 흐름

- **NarrativeOrchestrator.getNarrative(world)**:
  1. persistence에서 `getWorldEvents(worldId, { toTick: tick - 1, limit: 100 })`로 최근 과거 이벤트 수집 → `pastSummary` 텍스트 생성
  2. world에서 tick·엔티티·환경·미로 등으로 `currentSummary` 생성
  3. **Historian**.describePast(pastSummary) → `past`
  4. **Chronicler**.recordPresent(currentSummary) → `present`
  5. **Storyteller**.planFuture(present, past) → `future`
  6. 반환: `{ past, present, future, combined }`. `combined`는 `"[과거] ... [현재] ... [미래] ..."` 형태의 하나의 자연어 문자열.

## 4. 과학자와의 참조 관계

- **buildScienceContext**([commandHandler](../src/command/commandHandler.ts))에서, ask_science 호출 시 narrativeOrchestrator.getNarrative()를 호출해 `combined`를 가져와 **projectContext 맨 앞**에 다음 블록으로 붙인다:
  - `World Narrative (reference for all scientists): ...`
- 따라서 Network, Ecology, Evolution, Climate, Life Science 등 **모든 과학자 페르소나**가 동일한 “세계 서사”를 참고해 가설·검토·합성을 수행한다.
- narrative 호출은 LLM 3회(Historian·Chronicler·Storyteller)이므로, ask_science 시마다 실행된다. 필요 시 “최근 N tick 내 캐시된 narrative”를 쓰는 확장이 가능하다.

## 5. API

- **GET /api/narrative**
  - 동작: 현재 세션의 world로 `getNarrative(session.world)` 호출 후, `{ past, present, future, combined }`를 JSON으로 반환.
  - **언어**: 프롬프트는 영어로 전송되며, 기본 출력도 영어. `?lang=ko` 또는 환경변수 `AETHERIUS_OUTPUT_LANG=ko` 시 응답 전체를 한국어로 번역해 반환.

## 6. CLI

- **narrative**: `getNarrative()` 결과의 `combined`를 메시지로 반환. `narrative --ko` 또는 `--lang=ko`(또는 `AETHERIUS_OUTPUT_LANG=ko`) 시 한국어로 번역된 메시지를 출력.
- **oracle**: 기존 규칙 기반 짧은 조언(tick·엔티티 수 → 조언)을 그대로 유지. narrative와 별도 명령이다.

## 7. 데이터 소스 (과거)

- **역사학자 입력**: persistence.getWorldEvents(worldId, { toTick: tick - 1, limit: 100 })로 최근 이벤트를 가져와, 타입·tick·details 요약만 텍스트로 만든 뒤 `pastSummary`로 전달한다. getLatestSnapshot이 있으면 “마지막 스냅샷 tick·엔티티 수” 수준의 요약만 넘겨도 된다. 현재 구현은 최근 이벤트 요약을 사용한다.

## 8. 선택: DB 저장

- narrative 결과를 매번 또는 주기적으로 persistence에 저장하려면: `saveWorldEvent({ type: 'narrative_chronicle', details: JSON.stringify({ tick, past, present, future }) })` 형태로 기록할 수 있다. 나중에 역사학자가 “더 먼 과거”를 참고할 때 활용 가능하다.
