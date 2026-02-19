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

---

## 5. 게임 플레이 명세 (CLI 전용)

Aetherius에서 설계되는 모든 게임/시뮬레이션은 **CLI만으로 100% 플레이 가능**해야 합니다.
이 절에서는 “게임을 한다”는 행위를 순수 CLI 상호작용으로 정의하고, 역할/플로우/명령 세트를 명세합니다.

### 5.1 공통 CLI UX 원칙

- 프롬프트 일관성: 기본 프롬프트는 `Divine Will>`을 사용합니다.
  - 추후 역할 기반 프롬프트 확장: `Explorer>`, `Scientist>`, `Operator>` 등.
- 역할 우선 설계: 플레이어는 GUI 버튼이 아니라, **역할과 명령 집합**으로 게임을 이해합니다.
-  - 최고권한시스템(System), 탐험가(Explorer), 과학자(Scientist), 운영자(Operator)가 기본 역할입니다.
- 짧은 명령 + 긴 설명:
  - 실제 입력은 짧게(`map`, `watch`, `oracle`)
  - 설명/헬프는 충분히 길게(`help map`) 제공하는 구조를 유지합니다.
- 탐색 가능한 도움말:
  - `help` → 모든 명령 목록 요약
  - `help <명령>` → 해당 명령에 대한 예제 중심 설명
- 텍스트 레이아웃:
  - 표(table), 리스트, 간단한 ASCII 맵 정도만 사용
  - 화면 클리어는 선택 사항이며, 기본은 로그 누적 방식

### 5.2 역할 기반 게임 모드

각 게임은 아래 4가지 기본 역할 중 하나 이상의 관점으로 수행됩니다.
한 플레이어가 CLI에서 역할을 수시로 전환할 수 있습니다.

#### 5.2.1 최고권한시스템 모드 (System Mode)

- 목적: 환경/재해/축복을 통해 세계 전반의 상태를 조형합니다.
- 주요 상호작용:
  - 시간 제어: `advance_tick`, `warp_evolution`
  - 환경 개입: `change_environment`, `flood`, `ice_age`
  - 재해/축복: `smite`, `meteor`, `bless`
  - 고급 개입: `auto_god`, `ai_events`, `oracle`
- 전형적인 루프:
  1. `map`으로 현재 세계 상태를 전체적으로 확인
  2. `migration_stats`, `disease_stats`로 문제 영역 탐지
  3. 특정 좌표를 `inspect_pos`로 세부 조사
  4. `smite`/`bless`/`flood`/`ice_age` 등으로 개입
  5. `advance_tick` 또는 `warp_evolution`으로 결과 관찰

#### 5.2.2 탐험가 모드 (Explorer Mode)

- 목적: 장소(Place) 네트워크와 개체들을 탐험하고, 흥미로운 지점을 발견합니다.
- 주요 상호작용:
  - 지도/탐색: `map`, `explore_loc`, `space`
  - 관찰: `status`, `watch`, `inspect_pos`
  - 드론 지원: `deploy_drone`, `drones`, `drone_mission`
- 전형적인 루프:
  1. `map life`로 생명 밀도가 높은 구역 파악
  2. `explore_loc list`로 발견된 장소 목록 확인
  3. 관심 장소 주변 좌표를 `inspect_pos x y`로 조사
  4. `deploy_drone documentary`로 탐사 드론 투입
  5. `drones`, `drone_mission`으로 드론 경로·임무 조절
  6. `watch <entityId>`로 특정 개체를 장기 추적

#### 5.2.3 과학자 모드 (Scientist Mode)

- 목적: 실험 설계, 데이터 수집, 가설 검증을 CLI에서 수행합니다.
- 주요 상호작용:
  - 실험 설계: 환경·개입 명령(`change_environment`, `smite`, `flood`, `ice_age` 등)을 조합한 시나리오 작성
  - 데이터 수집: `latest_snapshot`, `dataset:cli`, `disease_stats`, `corpses`
  - 분석 보조: `ask_science`, `oracle`
- 전형적인 루프:
  1. 실험 조건 정의: 예) “평균 온도 25도, 습도 0.8 환경에서 특정 식물 생존률”
  2. CLI로 조건 주입: `change_environment temp 25`, `change_environment humidity 0.8`
  3. 초기 개체 생성: `spawn_entity plant TestPlant`
  4. `warp_evolution 1000`으로 시간 진행
  5. `latest_snapshot`, `taxonomy`, `disease_stats` 등으로 결과 관찰
  6. `ask_science "Why did TestPlant population decline?"`로 자동 분석 요청

#### 5.2.4 운영자 모드 (Operator Mode)

- 목적: 멀티월드, 웜홀, 데이터 저장, 시스템 상태를 관리합니다.
- 주요 상호작용:
  - 월드·공간 관리: `space`, `warp`
  - 데이터·퍼시스턴스: `db_status`, `latest_snapshot`, `dataset:cli`
  - 생태 통계: `migration_stats`, `disease_stats`, `corpses`
- 전형적인 루프:
  1. `space`로 현재 등록된 월드·웜홀 상태 점검
  2. `db_status`로 퍼시스턴스·스냅샷 정상 여부 확인
  3. `migration_stats`로 각 장소 인구 분포 모니터링
  4. 필요 시 `warp <entityId> <worldId>`로 엔티티 재배치

### 5.3 게임 루프 명세 (역할 공통)

CLI 기반 게임 세션은 아래 공통 루프를 따릅니다.

1. 세션 진입
   - `npm run start` 또는 `npm run start:cli`
   - 프롬프트: `Divine Will>`에서 명령 대기
2. 현재 상태 파악
   - 최소 한 번 `map`, `status`, `space` 등을 호출해 세계·엔티티·월드 구조 인지
3. 목표 설정
-   - 최고권한시스템 모드: “10만 틱 동안 문명을 유지시키기”
   - 탐험가 모드: “가장 극단적인 환경을 가진 Place 3곳 찾기”
   - 과학자 모드: “특정 개입이 종다양성에 미치는 영향 측정”
4. 행동 실행
   - 정의된 역할에 맞는 명령들을 사용해 개입·탐험·실험·운영
5. 관찰과 기록
   - `watch`, `latest_snapshot`, `migration_stats`, `disease_stats` 등으로 결과를 기록
6. 피드백과 반복
   - 관찰 결과에 따라 명령을 조정하고, 루프를 반복

### 5.4 CLI 화면 패턴 예시

CLI는 다음과 같은 패턴으로 정보를 보여주는 것을 기본으로 합니다.

- 상단 요약 영역
  - 현재 월드 ID, tick, 엔티티 수, 활성 Place 수 등
  - 예: `World=Alpha Tick=12345 Entities=320 Places=12`
- 본문 영역
  - 명령별 주요 결과(표, 리스트, 맵)
- 하단 힌트 영역
  - `help`, `help <cmd>`로 이어질 수 있는 짧은 힌트
  - 예: `Hint: 'help map' for legend, 'watch <id>' to follow a creature`

예시 출력 레이아웃(개념):

```text
World=Alpha Tick=12345 Entities=320 Places=12

map life
................................
....::ooooOOO@@@OOOooo::........
... (중략)

Hint: 'explore_loc list' to inspect discovered Places.
Divine Will>
```

### 5.5 새로운 게임 기능 추가 시 CLI 요구사항

어떤 게임 기능이 추가되더라도 다음을 만족해야 합니다.

- GUI 없이도 처음부터 끝까지 CLI만으로 플레이 가능해야 합니다.
- 최소 1개 이상의 역할 모드에 자연스럽게 편입되어야 합니다.
  - 예: “문명 건설 게임 모드”는 신·탐험가·운영자 모드와 연계
- 다음 요소를 함께 설계합니다.
  - 명령 이름 및 인자 형식
  - 대표적인 플레이 루프 예시(3~5단계)
  - `help <cmd>`에 들어갈 설명 스니펫

이를 통해 Aetherius 위에서 설계되는 모든 게임·시나리오는, CLI 설계가 1급 시민으로 취급되며, 별도의 GUI 없이도 충분히 몰입 가능한 텍스트 기반 플레이를 제공하는 것을 보장합니다.
