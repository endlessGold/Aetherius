# 모든 실험·스모크·검증 플랜

이 문서는 Aetherius 프로젝트의 **스모크 테스트**, **검증(Phase 1)**, **실험** 스크립트를 정리하고, 실행 순서·전제 조건·CI 연동을 명시합니다.

## 1. 전체 실험·스모크·검증 목록

| 구분 | npm 스크립트 | 도구 파일 | 목적 | 전제 조건 |
|------|--------------|-----------|------|-----------|
| 스모크(전체) | `smoke` | [tools/smoke.js](../tools/smoke.js) | core + wormhole + ecosystem + drone + science 5개 스위트 순차 실행 | 빌드 완료 |
| 스모크(core) | `smoke:core` | 동일 | World tick + 스냅샷 저장 | - |
| 스모크(wormhole) | `smoke:wormhole` | 동일 | 멀티월드 + 웜홀 이동 | env 웜홀 확률 등 |
| 스모크(ecosystem) | `smoke:ecosystem` | 동일 | 계절/질병/사체/분해 | - |
| 스모크(drone) | `smoke:drone` | 동일 | 드론 엔티티 동작 | - |
| 스모크(science) | `smoke:science` | 동일 | ScienceOrchestrator만 (World 없음, LLM 1회) | GEMINI_API_KEY(없으면 무음 가능) |
| 검증(Phase 1) | `verify:phase1` | [tools/run_phase1_verification.js](../tools/run_phase1_verification.js) | 결정론(동일 시드·tick → 동일 해시), 그리드 성능 | 빌드 |
| 실험(DB) | `experiment:db` | [tools/run_db_hosting_experiment.js](../tools/run_db_hosting_experiment.js) | persistence 저장·조회 (MongoDB/Redis/인메모리) | .env DB 설정(선택) |
| 실험(과학자) | `experiment:science` | [tools/run_science_experiment.js](../tools/run_science_experiment.js) | 월드 부트스트랩 + ask_science 1회 + DB 이벤트 수 확인 | GEMINI_API_KEY, (선택) DB |
| 실험(경제) | `experiment:economy` | [tools/run_economy_evolution.js](../tools/run_economy_evolution.js) | EconomyEvolution N세대 적합도 로그 | 빌드만 |
| 실험(Narrative) | `experiment:narrative` | [tools/run_narrative_experiment.js](../tools/run_narrative_experiment.js) | getNarrative 1회, past/present/future/combined 검증 | GEMINI_API_KEY, (선택) DB |

## 2. 권장 실행 순서 (로컬에서 전체 확인 시)

1. `npm run build`
2. `npm run smoke` — 전체 스모크
3. `npm run verify:phase1` — 결정론·성능
4. `npm run experiment:db` — DB 연동 (env 설정 시)
5. `npm run experiment:science` — (선택) 과학자 + DB 이벤트, API 키 필요
6. `npm run experiment:economy` — (선택) 경제 유전 학습
7. `npm run experiment:narrative` — (선택) 역사학자·기록학자·스토리텔러, API 키 필요

**비밀(API 키) 없이 한 번에 실행**: `npm run experiment:all` → smoke + verify:phase1 + experiment:db + experiment:economy.
`experiment:science`, `experiment:narrative`는 GEMINI_API_KEY가 필요하므로 별도 실행.

## 3. CI에서 실행되는 항목

[.github/workflows/verify.yml](../.github/workflows/verify.yml)에서 다음 순서로 실행됩니다.

- `npm run smoke`
- `npm run verify:phase1`
- `npm run experiment:db`

`experiment:science`, `experiment:narrative`는 API 키가 필요하므로 CI에는 포함되지 않습니다. `experiment:economy`는 CI에 포함하지 않았으나, 필요 시 워크플로에 추가할 수 있습니다.

## 4. 선택 실험 (API 키 필요)

- **experiment:science**, **experiment:narrative**는 `.env`의 `GEMINI_API_KEY`가 필요합니다. CI에는 포함하지 않으며, 로컬에서 선택적으로 실행합니다.
- narrative 실험은 역사학자·기록학자·스토리텔러 협업이 정상 동작하는지 확인하는 용도입니다.

## 5. 참고 문서

- [DB_HOSTING.md](DB_HOSTING.md) — DB 설정, experiment:db 사용법
- [CLI_USAGE.md](CLI_USAGE.md) — 스모크 테스트 사용법
- [README.md](../README.md) §6 — Phase 1~3 로드맵
- [NARRATIVE_ORCHESTRATION.md](NARRATIVE_ORCHESTRATION.md) — narrative 명령·API

## 6. 사용자 명세

이 문서를 보고 실험·스모크·검증 스크립트를 실행하려는 사용자가
알아두면 좋은 주요 용어와 개념을 간단히 정리합니다.

### 6.1 스모크 테스트(smoke test)

- 가장 기본적인 기능들이 “대략이라도” 동작하는지 빠르게 확인하는 테스트입니다.
- 상세한 시나리오나 엣지 케이스보다, 시스템이 전체적으로 깨지지 않았는지 보는 용도입니다.

### 6.2 검증(Phase 1 검증)

- 동일한 시드(seed)와 동일한 tick 수를 주었을 때, 결과 해시가 항상 같은지 확인하는 결정론(determinism) 검증입니다.
- 또한 그리드(환경 격자)의 성능이 허용 가능한지(시간·메모리 관점에서) 함께 체크합니다.

### 6.3 실험(experiment)

- 기능이 “동작한다/안 한다”를 넘어서, **행동 양상·성능·품질**을 관찰하기 위한 시나리오입니다.
- 예: EconomyEvolution 여러 세대를 돌리면서 적합도 곡선을 보는 것, Narrative 품질을 사람이 읽으며 평가하는 것 등입니다.

### 6.4 GEMINI_API_KEY

- Google Gemini API를 호출하기 위한 비밀 키입니다.
- `.env` 파일에 설정되며, 없으면 LLM 관련 실험(`experiment:science`, `experiment:narrative`)은 자동으로 건너뛰거나 “조용히(no-op)” 동작하도록 설계하는 것이 권장됩니다.

### 6.5 결정론(determinism)

- 같은 입력(시드, tick 수, 초기 상태)을 주었을 때 **항상 같은 출력**이 나오는 성질입니다.
- 시뮬레이션 재현성(reproducibility)과 디버깅에 매우 중요하며, Phase 1 검증의 핵심 목표입니다.

### 6.6 스위트(suite)

- 서로 관련된 테스트/실험들을 묶어 둔 집합입니다.
- 예: `smoke:core`, `smoke:wormhole` 등은 각각 core, wormhole 영역에 대한 스모크 테스트 스위트입니다.
