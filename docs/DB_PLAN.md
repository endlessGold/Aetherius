# DB 플랜 (NoSQL 기반)

## 1. 개요

- **목적**: 시뮬레이션 스냅샷·월드 이벤트·진화 통계·실험 메타데이터를 외부 저장소에 저장하여 재현·분석·장기 보관.
- **방식**: DB 서버를 직접 호스팅하지 않고, **무료 호스팅**(MongoDB Atlas M0 / Upstash Redis)의 연결 문자열을 `.env`에 넣어 연동. 상세는 [DB_HOSTING.md](DB_HOSTING.md).
- **구현**: [src/data/persistence.ts](../src/data/persistence.ts)에서 env 기반으로 드라이버 선택 후, 동일 `Persistence` 인터페이스로 저장.

## 2. 데이터 모델 (noSqlAdapter)

| 저장소 항목 | 타입 | 설명 |
|-------------|------|------|
| **TickSnapshot** | 스냅샷 | worldId, tick, timestamp, nodes, entities, seed, rngState, config. 월드별 최신 1건 유지 또는 히스토리 확장 가능. |
| **WorldEventPayload** | 이벤트 | worldId, tick, type, location, details. 계절/질병/이동 등 텔레메트리. |
| **EvolutionStatsPayload** | 진화 통계 | worldId, generation, tick, avgFitness, weights, populationCount. |
| **ExperimentMetadataPayload** | 실험 메타 | id, config, startedAt, totalGenerations. |

## 3. 드라이버별 구조

### 3.1 inmemory (기본)

- 설정: `AETHERIUS_NOSQL_DRIVER` 미설정 또는 `inmemory`.
- 저장: 프로세스 메모리. 재시작 시 소실. 개발·스모크용.

### 3.2 mongodb (Atlas 등)

- 설정: `AETHERIUS_NOSQL_DRIVER=mongodb`, `AETHERIUS_MONGODB_URI`, `AETHERIUS_MONGODB_DB`(기본 `aetherius`).
- 컬렉션:
  - `snapshots`: worldId 기준 upsert(월드별 최신 1건).
  - `world_events`: insert only.
  - `evolution_stats`: insert only.
  - `experiment_metadata`: id 기준 upsert.

### 3.3 redis (Upstash 등)

- 설정: `AETHERIUS_NOSQL_DRIVER=redis`, `AETHERIUS_REDIS_URL`.
- 키 패턴:
  - `aetherius:snapshot:{worldId}`: 최신 스냅샷 JSON.
  - `aetherius:events:{worldId}`: list, 이벤트 JSON push.
  - `aetherius:evolution:{worldId}`: list, 진화 통계 push.
  - `aetherius:exp:{id}`: 실험 메타 JSON.

## 4. 웹 API를 통한 DB 호스팅 업로드

- **POST /api/snapshots**: 요청 body에 `TickSnapshot` JSON을 담아 보내면, 현재 세션의 persistence(설정된 DB 호스팅)에 저장.
- **POST /api/events**: 요청 body에 `WorldEventPayload` JSON을 담아 보내면 동일하게 저장.
- 서버 모드(`npm run start:server`) 또는 Vercel 배포 시 `.env`에 MongoDB/Redis 연결 정보가 있으면, 해당 호스팅에 업로드됨.

## 5. 참고

- [DB_HOSTING.md](DB_HOSTING.md) — 무료 호스팅 설정 절차
- [ARCHITECTURE.md](ARCHITECTURE.md) — 저장 레이어 위치
- [SECRETS_REF.md](SECRETS_REF.md) — env 변수 목록
