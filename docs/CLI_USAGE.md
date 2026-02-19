# Aetherius CLI 사용법

Aetherius 엔진의 CLI(명령줄 인터페이스) 및 관련 도구 사용법입니다.

---

## 목차

1. [실행 방법](#실행-방법)
2. [CLI 명령 목록](#cli-명령-목록)
3. [명령 상세 설명](#명령-상세-설명)
4. [npm 스크립트 및 도구](#npm-스크립트-및-도구)

---

## 실행 방법

### CLI 모드로 실행

```bash
# 빌드 후 CLI 실행 (기본)
npm run start

# 또는 빌드 후 CLI 모드 명시
npm run start:cli

# dist가 이미 있으면
npm run start:dist:cli
```

### 인자

| 인자 | 설명 | 기본값 |
|------|------|--------|
| `--mode=cli` | CLI 모드 (대화형) | `cli` |
| `--mode=server` | HTTP 서버 모드 | - |
| `--worlds=Alpha,Beta,Gamma` | 사용할 월드 ID 목록 (쉼표 구분) | `Alpha,Beta,Gamma` |

예:

```bash
node dist/main.js --mode=cli --worlds=Alpha,Beta
```

### CLI 시작 시

- **자동 실행**: 시작 시 `warp_evolution 200`이 한 번 실행되어 진화 데이터가 시드됩니다.
- **프롬프트**: `Divine Will> ` 에서 명령을 입력합니다.
- **종료**: `exit` 또는 `quit` 입력 시 종료합니다.

---

## CLI 명령 목록

| 명령 | 요약 |
|------|------|
| `help` | 모든 명령 도움말 |
| `advance_tick [count]` | 틱 진행 |
| `warp_evolution [count]` | 시간 빠르게 진행(진화 시뮬레이션) |
| `spawn_entity <plant\|ga> [name]` | 엔티티 생성 |
| `change_environment <param> <value>` | 환경 변수 변경 |
| `status [id]` | 월드/엔티티 상태 |
| `latest_snapshot` | 최신 스냅샷 조회 |
| `db_status` | DB/퍼시스턴스 상태 |
| `inspect_pos <x> <y>` | 좌표 환경 조회 |
| `smite <x> <y> [radius]` | 낙뢰(피해) |
| `bless <all\|plants\|creatures>` | 치유 |
| `flood [level]` | 홍수 |
| `ice_age` | 빙하기 |
| `meteor <x> <y>` | 운석 낙하 |
| `oracle` | 월드 조언 |
| `watch <id>` | 엔티티 관찰 |
| `map [life]` | 월드 맵 |
| `auto_god <on\|off>` | AI 신 자동 개입 |
| `explore_loc [list]` | 장소 탐색 |
| `ask_science <question>` | 과학자 위원회 질의(LLM) |
| `ai_events <on\|off>` | AI 이벤트 처리 |
| `space` | 월드·웜홀 목록 |
| `warp <entityId> <worldId>` | 엔티티 월드 간 이동 |
| `deploy_drone [role] [worldId] [mode]` | 드론 배치 |
| `drones [worldId]` | 드론 목록 |
| `drone_mission <droneId> <mode> [text]` | 드론 미션 변경 |
| `taxonomy <entityId>` | 분류/분류학/질병 조회 |
| `disease_stats [worldId]` | 질병 통계 |
| `corpses [worldId]` | 시체 통계 |
| `migration_stats [worldId]` | 장소 인구 통계 |

---

## 명령 상세 설명

### 시간·진행

- **`advance_tick [count]`**  
  - 틱을 `count`번 진행 (기본 1).  
  - 예: `advance_tick 10`

- **`warp_evolution [count]`**  
  - `count` 틱만큼 빠르게 진행(진화 시뮬레이션). 진행률 표시.  
  - 예: `warp_evolution 1000`

### 엔티티

- **`spawn_entity <plant|ga> [name]`**  
  - 식물(`plant`) 또는 생명체(`ga`) 생성. `name` 생략 시 자동 ID.  
  - 예: `spawn_entity plant Rose01`, `spawn_entity ga Creature01`

- **`status [id]`**  
  - `id` 없음: AssembleManager 엔티티 수·ID 목록.  
  - `id` 있음: 해당 엔티티 컴포넌트 상태.

- **`watch <id>`**  
  - 엔티티 ID의 HP, 에너지, 위치, 목적(goalGA), 유전자 등 상세 출력.

### 환경

- **`change_environment <parameter> <value>`**  
  - 지원 파라미터: `condition`, `temp`/`temperature`, `humidity`, `rain`, `wind`, `co2`.  
  - 예: `change_environment temp 25`, `change_environment humidity 0.8`

- **`inspect_pos <x> <y>`**  
  - 그리드 좌표 (x,y)의 온도, 습도, 토양 수분, 질소, 광량 출력.

### 신의 개입(재해·치유)

- **`smite <x> <y> [radius]`**  
  - (x,y) 주변 `radius`(기본 5) 내 낙뢰: 지면 손상 + 해당 범위 엔티티 사망.

- **`bless <all|plants|creatures>`**  
  - 전체/식물/생명체 HP·에너지 회복.

- **`flood [level]`**  
  - 토양 수분 상승(기본 80). 높은 수분 지역 생명체 일부 익사.

- **`ice_age`**  
  - 전역 온도 하강, 랜덤으로 생명체 사망.

- **`meteor <x> <y>`**  
  - (x,y)에 운석 낙하(반경 15), 해당 범위 엔티티 제거.

### 조언·맵·탐색

- **`oracle`**  
  - 현재 틱·엔티티 수 기반 짧은 조언 문구.

- **`map [life]`**  
  - 월드 맵 출력. `life`(기본): 엔티티 밀도로 문자 맵(공백/./:/o/O/@).

- **`explore_loc [list]`**  
  - `list`: 발견된 장소(Place) 목록 및 활동도·연결.  
  - 인자 없음: 장소 개수 안내.

### AI·과학

- **`auto_god <on|off>`**  
  - AI 신 주기적 개입 켜기/끄기.

- **`ask_science <question>`**  
  - 과학자 위원회(LLM)에 질의. 가설·동료 검토·합성 리포트 반환.  
  - LLM API 키는 환경 변수로 설정(.env 등).  
  - 예: `ask_science What is the population trend?`

  **런타임 중 호출 방법**
  - **CLI**: 서버/CLI 실행 후 프롬프트 `Divine Will>` 에서 `ask_science 질문` 입력.
  - **서버(HTTP)**  
    - `POST /api/command` body: `{ "cmd": "ask_science 질문" }`  
    - `GET /api/science?q=질문`  
    - `POST /api/science` body: `{ "query": "질문" }`

- **`ai_events <on|off>`**  
  - AI 이벤트 오케스트레이터 켜기/끄기.

### 멀티월드·웜홀·이동

- **`space`**  
  - 등록된 월드 ID 목록, 웜홀 목록(쌍, 만료 틱, 안정성).

- **`warp <entityId> <targetWorldId>`**  
  - 엔티티를 다른 월드로 이동. 웜홀 없이 직접 전송.

### 드론

- **`deploy_drone [role] [worldId] [mode]`**  
  - 역할(기본 `Observer`), 월드(기본 현재 월드), 모드(기본 `survey`).  
  - 모드: `documentary`, `survey`, `irrigate`, `cool`, `heat`, `seed_place` 등.

- **`drones [worldId]`**  
  - 해당 월드(기본 현재)의 드론 목록: ID, role, mode, energy.

- **`drone_mission <droneId> <mode> [text]`**  
  - 드론 미션 모드·텍스트 변경.

### 생태·분류·통계

- **`taxonomy <entityId>`**  
  - 엔티티의 classification, lifeStage, taxonomy, disease, position, vitality, energy, goalGA 등 JSON 출력.

- **`disease_stats [worldId]`**  
  - 해당 월드 질병 통계(에코시스템 시스템 필요).

- **`corpses [worldId]`**  
  - 해당 월드 시체 통계.

- **`migration_stats [worldId]`**  
  - 해당 월드 장소(Place) 인구/이동 통계.

### 저장·DB

- **`latest_snapshot`**  
  - 현재 월드 최신 스냅샷(tick, timestamp, nodes, entities).  
  - 드라이버는 `db_status` 참고.

- **`db_status`**  
  - 퍼시스턴스 드라이버, 설정 소스(환경 변수), 현재 월드 ID, 최신 스냅샷 요약.

### 기타

- **`help`**  
  - 위 명령 요약 출력.

---

## npm 스크립트 및 도구

### 메인 실행

| 스크립트 | 설명 |
|----------|------|
| `npm run build` | TypeScript 빌드 → `dist/` |
| `npm run start` | 빌드 후 CLI 실행 (시작 시 warp_evolution 200) |
| `npm run start:cli` | 빌드 후 CLI 모드 |
| `npm run start:server` | 빌드 후 서버 모드 (기본 포트 3000, `PORT` env 가능) |
| `npm run start:dist` | `dist/main.js` 실행 (CLI) |
| `npm run start:dist:cli` | `dist/main.js` CLI 모드 |
| `npm run start:dist:server` | `dist/main.js` 서버 모드 |
| `npm run dev` | ts-node로 `src/main.ts` 직접 실행 (빌드 없이) |

### 스모크 테스트 (tools/smoke.js)

빌드 후 `dist/` 기준으로 스위트 실행.

```bash
npm run smoke              # 전체 스위트 (core, wormhole, ecosystem, drone, science)
npm run smoke -- core      # 월드 틱 + 스냅샷
npm run smoke -- wormhole  # 멀티월드 + 웜홀
npm run smoke -- ecosystem # 계절/질병/사체/분해
npm run smoke -- drone     # 드론 엔티티
npm run smoke -- science   # ScienceOrchestrator (LLM, 월드 없음)
```

### 데이터셋 CLI (tools/run_headless.js)

서버 API로 틱 수집·정규화·선형 학습·백업. **서버가 떠 있어야 함.**

```bash
# 기본: 자동 모드 (duration 분 동안 cycle 틱 반복, 주기적 백업)
npm run dataset:cli

# 수집만
npm run dataset:cli -- steps=200

# 수집 후 학습·백업
npm run dataset:cli -- steps=500 --train-after --backup

# API 주소·자동 모드 옵션
npm run dataset:cli -- apiBase=http://localhost:3000/api duration=60 cycle=200
```

**옵션 (key=value)**  
- `apiBase`: API 베이스 URL (기본 `http://localhost:3000/api`)  
- `steps`: 수집 틱 수. 0이면 자동 모드 (기본 0)  
- `interval`: 틱 간 대기 ms (기본 0)  
- `duration`: 자동 모드 실행 시간(분) (기본 240)  
- `cycle`: 자동 모드 한 사이클 틱 수 (기본 200)  
- `maxrows`: 유지 최대 행 수 (기본 50000)  
- `backup`: 자동 모드 백업 간격(분) (기본 60)  
- `epochs`, `batch`, `lr`: 학습 파라미터  

**플래그 (steps > 0 일 때)**  
- `--train-after`: 수집 후 선형 모델 학습 1회  
- `--apply`: 학습된 모델 서버 적용 (POST /model/linear)  
- `--backup`: 데이터셋 서버 백업 (POST /dataset/backup)  
- `--help`: 도움말  

---

## 환경 변수·비밀

- API 키·DB 등 비밀은 **코드에 넣지 않고** `.env` 또는 [Aetherius-Secrets](https://github.com/endlessGold/Aetherius-Secrets)에서 관리합니다.
- 로컬: 프로젝트 루트 `.env` (git 제외). `.env.example`만 커밋합니다.
- 예: `GEMINI_API_KEY`, `AETHERIUS_LLM_*`, `AETHERIUS_AUTH_*`, `AETHERIUS_NOSQL_DRIVER`, `PORT` 등.

---

## 참고

- 아키텍처 개요: [ARCHITECTURE.md](ARCHITECTURE.md)  
- 로드맵·실험 계획: [ROADMAP.md](../ROADMAP.md), [EXPERIMENTS.md](EXPERIMENTS.md)  
- 서버 API로 명령을 보낼 때는 동일한 명령 문자열을 API 엔드포인트에 전달하면 됩니다 (서버 라우터 참고).
