# DB 플랜 (NoSQL 기반)

## 1. 개요

- **목적**: 시뮬레이션 스냅샷·월드 이벤트·진화 통계·실험 메타데이터를 외부 저장소에 저장하여 재현·분석·장기 보관.
- **방식**: DB 서버를 직접 호스팅하지 않고, **무료 호스팅**(MongoDB Atlas M0 / Upstash Redis)의 연결 문자열을 `.env`에 넣어 연동. 상세는 [DB_HOSTING.md](DB_HOSTING.md).
- **구현**: [src/data/persistence.ts](../src/data/persistence.ts)에서 env 기반으로 드라이버 선택 후, 동일 `Persistence` 인터페이스로 저장.

## 2. 데이터 모델 (noSqlAdapter)

| 저장소 항목 | 타입 | 설명 |
|-------------|------|------|
| **TickSnapshot** | 스냅샷 | worldId, tick, timestamp, nodes, entities, seed, rngState, config. 월드별 최신 1건 유지 또는 히스토리 확장 가능. 동물·식물·미생물·시체 등 “엔티티 상태”와 환경 그리드(사실상 세포층) 상태가 모두 포함된다. |
| **WorldEventPayload** | 이벤트 | worldId, tick, type, location, details. 계절/질병/이동·다큐멘터리·AI 의사결정 등 텔레메트리 이벤트를 저장한다. `type`은 상위 분류(예: `species_named`, `life_science_observation`, 기타는 `OTHER`)이고, 세부 이벤트 종류는 `details`의 JSON 안 `kind` 필드로 구분한다. |
| **EvolutionStatsPayload** | 진화 통계 | worldId, generation, tick, avgFitness, weights, populationCount. |
| **ExperimentMetadataPayload** | 실험 메타 | id, config, startedAt, totalGenerations. |

### 2.1 동물·식물·세포·전염병·생태계 이벤트 매핑

- **동물·식물·세포(환경 그리드) “상태”**
  - [world.ts](../src/core/world.ts)에서 매 tick마다 `TickSnapshot`을 생성해 `persistence.saveTickSnapshot`으로 저장한다.
  - 스냅샷 구조:
    - `nodes`: 환경 그리드의 각 노드(온도, 토양수분, 광량 등 레이어 값) 상태. 세포 수준의 물리 환경.
    - `entities`: 시뮬레이션에 존재하는 모든 엔티티(동물, 식물, 미생물, 시체, 드론 등)의 컴포넌트 상태.
  - 따라서 “현재 시점의 동물/식물/세포 상태”는 모두 TickSnapshot 한 건으로 복원 가능하다.

- **생태·질병·사망·분해·이동·계절 이벤트**
  - [ecosystemCycleSystem.ts](../src/entities/ecosystemCycleSystem.ts)에서 다음을 `WorldEventPayload`로 persistence에 기록한다.
  - 대표 이벤트(kind 기준):
    - `season_changed`: 계절 인덱스·이름·길이·tick (`type='OTHER'`, `details.kind='season_changed'`).
    - `entity_moved`: 미로/Place 간 이동(`fromPlaceId`, `toPlaceId`) 이벤트.
    - `infection_contracted`: 질병 감염 개시(개체·균주·tick).
    - `death_of_disease`: 질병으로 사망한 경우.
    - `recovered`: 질병에서 회복.
    - `death`: HP 0으로 개체 사망 → 시체 엔티티 생성까지 함께 기록.
    - `decomposition_complete`: 시체 분해 완료 및 토양으로 환원된 양.
    - `hybrid_offspring`: 종간 교배 성공 시 하이브리드 후손 생성 이벤트.
  - 이들 이벤트는 모두 `persistence.saveWorldEvent`를 통해 DB로 들어가며, 옵션으로 `world.config.telemetry.writeJsonlToDisk`가 `true`일 때만 `ecosystem.jsonl` 같은 로컬 JSONL 파일에 복제 저장된다.

- **다큐멘터리 드론(환경·주변 생명체 클립)**
  - [behaviors.ts](../src/entities/behaviors.ts)의 `DroneBehavior.capture`에서 다음 구조의 클립을 만든다.
    - `kind: 'documentary_clip'`
    - `worldId`, `tick`, `droneId`, `owner`, `role`, `mission`
    - `position` 및 해당 위치의 `env`(온도/토양수분/광량)
    - `nearby`: 반경 내 식물/동물 수 등
  - 저장 경로:
    - 항상 `persistence.saveWorldEvent`로 DB에 먼저 저장 (`type='OTHER'`, `details`에 전체 클립 JSON).
    - 텔레메트리 옵션이 켜져 있을 때만 `data/reports/documentary.jsonl`에 동일 클립을 append.

- **과학자·AI·웜홀 등 메타 이벤트**
  - 과학자 실험 오케스트레이션: [ai/orchestrator.ts](../src/ai/orchestrator.ts)에서 가설·검토·반론·합성 단계가 `ExperimentEventPayload`로 `WorldEventPayload.details`에 JSON으로 들어간다.
  - CLI 명령 `ask_science`, `life_science_discover`, `life_science_observe`:
    - `science_report`: 과학자 리포트 전체를 `details`에 저장.
    - `species_named`: LifeScienceAgent가 제안한 `suggestedName`과 taxonomy 스냅샷·reason을 함께 저장.
    - `life_science_observation`: 현재 생명 다양성 관찰 요약 문자열 및 개체 수를 저장.
  - AI 이벤트 오케스트레이터: [aiEventOrchestratorSystem.ts](../src/core/systems/aiEventOrchestratorSystem.ts)에서
    - `kind: 'ai_event_handling'` 구조를 `WorldEventPayload.details`로 저장.
  - 웜홀 시스템: [wormholeSystem.ts](../src/core/systems/wormholeSystem.ts)에서
    - 두 월드 간 엔티티 이동/복제 이벤트를 공통 엔트리(JSON)로 만들고, 각 월드의 `persistence.saveWorldEvent`로 기록.

- **요약**
  - **동물·식물·세포 “현재 상태”** → 매 tick `TickSnapshot` (`nodes` + `entities`).
  - **전염병·사망·분해·계절·이동·하이브리드·다큐멘터리·과학자·AI·웜홀 등 “이벤트”** → 모두 `WorldEventPayload`로 DB에 저장.
  - 로컬 JSONL(`ecosystem.jsonl`, `documentary.jsonl`, `ai_event_decisions.jsonl`, `science_reports.jsonl`, `wormholes.jsonl` 등)은 **동일 데이터를 파일로 복제하는 보조 텔레메트리**이며, DB 저장 경로를 대체하지 않는다.
  - `AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START=1`(기본값)이면 엔진 시작 시 `data/reports/*.jsonl`은 자동 삭제되고, 새 세션 텔레메트리만 다시 기록된다.

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
