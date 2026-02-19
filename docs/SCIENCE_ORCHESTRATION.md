# 과학자 페르소나 협업 오케스트레이션

## 1. 개요

Aetherius Science는 **도메인별 과학자 에이전트**(Network Science, Ecology, Evolution, Climate & Hydrology, Life Science)가 질의에 대해 가설을 내고, 동료검토·반론·합성까지 **한 번에 오케스트레이션**되는 구조다.

- **구현**: [src/ai/orchestrator.ts](../src/ai/orchestrator.ts), [src/ai/agents/scientistAgents.ts](../src/ai/agents/scientistAgents.ts)
- **진입점**: CLI `ask_science <질문>`, API `GET/POST /api/science`

## 2. 페르소나

| 에이전트 | 이름 | 도메인 | 역할 |
|----------|------|--------|------|
| NetworkScienceAgent | Dr. Watts | Network Science | 이동 궤적을 그래프로, O(N²) 회피, 창발 구조 |
| EcologyAgent | Dr. Odum | Ecology | 영양 흐름, 자원 한계, 수용력, 안정 균형 |
| EvolutionAgent | Dr. Fisher | Evolution | 선택압, 적합도 지형, 유전·변이·선택 |
| ClimateHydrologyAgent | Dr. Lorenz | Climate & Hydrology | 온도·수분·화재/홍수·계절 강제 |
| LifeScienceAgent | Dr. Linnaeus | Life Science | 생명·종 다양성 연구, 뚜렷한 종 네이밍, 지속 관찰, 새 진화종 개입 |

각 에이전트는 `analyze`(가설), `review`(동료검토), `rebuttal`(검토에 대한 반론) 메서드를 갖는다. LifeScienceAgent는 추가로 `suggestSpeciesNames`, `observeDiversity`를 갖는다.

## 3. 오케스트레이션 흐름

```
Phase 1: Individual Analysis
  → 각 에이전트가 질의에 대해 독립적으로 가설 생성 (2명씩 배치 호출로 429 완화)

Phase 2: Peer Review
  → 각 에이전트가 다른 에이전트의 가설을 검토 (비평)

Phase 2.5: Rebuttal (협업 상호작용)
  → 각 에이전트가 자신의 가설에 대한 검토들을 보고 짧은 반론/수정 의견 제출

Phase 3: Final Synthesis
  → Chief Scientist가 가설·검토·반론을 종합해 구현 지향 보고서 생성 (Summary, Recommended Actions, Decisions, Telemetry, Next Experiments)
```

- **Phase 1**: 상호작용 없음(병렬 가설).
- **Phase 2**: 1차 상호작용(검토자가 피검토자에게 피드백).
- **Phase 2.5**: 2차 상호작용(피검토자가 검토에 반응 → 대화 완결).
- **Phase 3**: 모든 출력을 한 번에 반영한 합성.

## 4. 데이터 흐름

- **입력**: `query`, `projectContext`(tick·엔티티 수·환경 등). `projectContext` 맨 앞에는 **World Narrative**(역사학자·기록학자·스토리텔러 협업 결과, 자연어 서사)가 "World Narrative (reference for all scientists): ..." 블록으로 포함된다. 자세한 내용은 [NARRATIVE_ORCHESTRATION.md](NARRATIVE_ORCHESTRATION.md) 참고.
- **중간 산출물**: `hypotheses`, `reviews`, `rebuttals` (각각 DB/이벤트 기록 가능).
- **최종 산출물**: `synthesis`, `recommendedActions`(합성에서 파싱한 권장 명령 목록). 선택 실행 시 `executedActions`(실행 결과).

실험 이벤트(`recordExperimentEvent`)로 `science_hypothesis`, `science_review`, `science_rebuttal`, `science_synthesis`(및 `recommendedActions`)를 기록하면 재현·분석에 활용할 수 있다.

**DB 자동 저장**: 오케스트레이터 생성 시 `persistence`와 `getWorldContext`만 넘기면, 호출자가 별도 콜백을 주지 않아도 과학자 단계(가설·검토·반론·합성)가 판단·실행될 때마다 위 이벤트가 DB(world_events)에 자동 저장된다. CLI/서버의 CommandHandler는 이 방식으로 persistence를 넘겨 과학자 스스로 DB에 기록하게 한다.

### 생명 과학자 전용 이벤트·명령

- **species_named**: 특징이 뚜렷한 종을 생명 과학자가 발견·네이밍했을 때 저장. `type: 'species_named'`, `details`: `{ entityId, suggestedName, taxonomySnapshot, reason, tick }`.
- **life_science_observation**: 생명 과학자가 현재 생명 다양성을 관찰한 요약. `type: 'life_science_observation'`, `details`: `{ tick, summary, entityCount }`.
- **life_science_discover**: CLI 명령. taxonomy가 있는 엔티티를 수집해 LifeScienceAgent가 네이밍 제안을 하고, 각 발견을 `species_named` 이벤트로 DB에 저장.
- **life_science_observe**: CLI 명령. 엔티티/종 요약을 수집해 LifeScienceAgent가 관찰 요약을 생성하고, `life_science_observation` 이벤트로 DB에 저장.

## 5. 과학자 = 신 (God 권한)

과학자 페르소나는 가상세계에 대한 **조언**뿐 아니라 **권장 액션(명령)** 을 제안할 수 있다. 클라이언트(CLI 또는 API 호출자)가 **명시적으로 요청**할 때만 해당 명령이 화이트리스트 범위 내에서 실행된다. 즉, 합성 보고서의 "Recommended Actions"는 기본적으로 제안만 하며, `--execute`(CLI) 또는 `executeActions: true`(API)가 있을 때만 실행된다.

### 사용 가능한 신의 능력 (권장·실행 허용 목록)

| 명령 | 용도 | 인자 예시 |
|------|------|-----------|
| advance_tick | 시간 진행 | advance_tick 10 |
| spawn_entity | 개체 생성 | spawn_entity plant P1, spawn_entity ga C1 |
| change_environment | 환경 변경 | change_environment temp 25, change_environment humidity 0.8 |
| bless | 치유 | bless all, bless plants, bless creatures |
| flood | 수위 | flood 0.5 |
| ice_age | 한파 | ice_age |
| inspect_pos | 좌표 환경 조회 | inspect_pos 50 50 |
| status | 엔티티 상태 | status, status &lt;id&gt; |
| map | 지도 | map, map life |
| deploy_drone | 드론 배치 | deploy_drone survey &lt;worldId&gt; irrigate |
| drones, drone_mission | 드론 목록·미션 변경 | drones &lt;worldId&gt;, drone_mission &lt;id&gt; survey |
| disease_stats, corpses, migration_stats | 통계 | disease_stats, corpses &lt;worldId&gt; |
| taxonomy, oracle, watch, explore_loc | 조회·관측 | taxonomy &lt;id&gt;, oracle, watch &lt;id&gt;, explore_loc list |

실행 **화이트리스트**에 없는 명령(smite, meteor, warp, auto_god, ai_events, space, warp_evolution, db_status, latest_snapshot, help 등)은 과학자 권장으로 실행되지 않는다. 최대 실행 개수는 10개로 제한된다.

### 실행 정책

- **화이트리스트**: 위 표의 명령만 과학자 권장 실행 대상이다. 구현: [commandHandler.ts](../src/command/commandHandler.ts)의 `SCIENCE_ACTION_WHITELIST`, `MAX_SCIENCE_ACTIONS`.
- **옵트인**: `ask_science <질문> --execute`(CLI), `POST /api/science` body `{ "query": "...", "executeActions": true }`(API)일 때만 권장 액션을 실행한다.
- 실행 결과는 CLI 출력의 "Executed Actions" 섹션, API 응답의 `data.executedActions`에 포함된다.

## 6. 확장 방향

- **토론 라운드**: 반론 이후 "한 턴 더 질문/동의·이의"를 넣어 합성 전 대화를 늘리기.
- **역할 교대**: 특정 질의에 대해 Chief Scientist를 도메인별로 바꾸기.
- **우선순위/가중치**: 도메인별 신뢰도나 질의 유형에 따라 가설·검토 가중치 부여.

## 7. 참고

- [README.md](README.md) — 프로젝트 개요
- [NARRATIVE_ORCHESTRATION.md](NARRATIVE_ORCHESTRATION.md) — 역사학자·기록학자·스토리텔러 신 협업, API/CLI
- [src/ai/llmService.ts](../src/ai/llmService.ts) — LLM 호출·재시도
- [src/command/commandHandler.ts](../src/command/commandHandler.ts) — 신의 능력(명령) 구현·화이트리스트
