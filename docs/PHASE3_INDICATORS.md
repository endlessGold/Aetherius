# Phase 3 지표 정의 (창발성/분석/시각화)

Phase 3 목표: 장기 시뮬레이션 관측 지표, 데이터셋 추출·분석·가시화 파이프라인.

## 1. 지표 목록

스냅샷·이벤트·진화 통계에서 추출할 수 있는 지표. tick/월드별로 집계해 시계열 또는 요약 테이블로 저장할 수 있다.

| 지표 | 데이터 소스 | 설명 |
|------|-------------|------|
| **바이오매스** | 스냅샷 `entities` | 엔티티별 biomass(또는 energy) 합계. 노드/그리드별 분포는 `nodes`에서 추출 가능. |
| **엔티티 수** | 스냅샷 `entities`, `nodes` | 월드/타입별 엔티티 개수. |
| **계절** | 이벤트 `SeasonChanged` | 계절 인덱스·이름·길이. 시계열로 저장 시 tick–season 매핑. |
| **질병** | 이벤트 `death_of_disease`, `recovered`, `decomposition_complete` 등 | 감염·회복·사망·분해 완료 건수. 텔레메트리에서 이미 persistence에 기록됨. |
| **진화** | `evolution_stats` (persistence) | generation, tick, avgFitness, weights, populationCount. |

## 2. 데이터 소스

- **스냅샷**: [noSqlAdapter TickSnapshot](src/data/noSqlAdapter.ts) — `worldId`, `tick`, `timestamp`, `nodes`, `entities`, `seed`, `rngState`, `config`.
- **이벤트**: [WorldEventPayload](src/data/noSqlAdapter.ts) — `worldId`, `tick`, `type`, `location`, `details`.  
  텔레메트리 타입 예: `death_of_disease`, `recovered`, `decomposition_complete`, `SeasonChanged` 등 ([ecosystemCycleSystem](src/entities/ecosystemCycleSystem.ts), [eventTypes](src/core/events/eventTypes.ts)).
- **진화 통계**: [EvolutionStatsPayload](src/data/noSqlAdapter.ts) — persistence에 별도 저장.

집계·저장 경로는 Phase 3 파이프라인에서 확정 (전용 컬렉션/키 또는 기존 persistence 재사용).

## 3. 데이터셋 내보내기

- **API**: `GET /api/dataset/export?worldId=...&fromTick=...&toTick=...&limit=...`  
  현재 세션 persistence에서 해당 월드의 최신 스냅샷 + tick 구간 이벤트를 JSONL 형식으로 반환. 각 줄은 `rowType: 'snapshot'` 또는 `rowType: 'event'`로 구분.
- **CLI**: `node tools/export_dataset.js [worldId] [fromTick] [toTick] [limit] [output.jsonl]`  
  `.env`의 persistence(또는 `--api-base`로 API 호출)를 사용해 스냅샷·이벤트를 JSONL 파일로 저장.  
  사용: `npm run build && node tools/export_dataset.js` (기본: 현재 persistence, 옵션으로 worldId/구간 지정).

내보낸 JSONL은 차트(시계열 그래프 등) 또는 정적 페이지/대시보드(Chart.js, Observable 등)에서 가시화할 수 있다.

## 4. 실행 우선순위 (계획서 기준)

1. 지표 정의 (본 문서)
2. 집계·저장 경로 확정 (persistence 또는 전용 저장)
3. 내보내기 API/CLI (위 §3)
4. 가시화 (정적 페이지 또는 간단한 대시보드)

## 5. 참고

- [README.md](README.md) §6 — Phase 1~3 요약
- [DB_PLAN.md](DB_PLAN.md) — 스냅샷·이벤트·진화 통계 저장 구조
- [ARCHITECTURE.md](ARCHITECTURE.md) — 레이어·저장
