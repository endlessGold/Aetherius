# Aetherius 폴더 구조 기획서

리팩터링 전 **현재 구조 진단**과 **목표 구조·이전 계획**을 정의한 문서입니다.  
실제 코드 이동은 이 기획서 확정 후 단계별로 진행합니다.

---

## 1. 현재 구조 진단

### 1.1 디렉터리 트리 (현재)

```
Aetherius/
├── api/                    # Vercel 서버리스 핸들러 (health, status, tick, command, login, _auth, _state)
├── docs/
├── tools/                  # smoke.js, run_headless.js
├── datasets/
├── src/
│   ├── main.ts             # 진입점 (인자 파싱, 월드 생성·시드, CLI/Server 분기)
│   ├── httpSmoke.ts        # HTTP 스모크 스크립트 → 위치 모호
│   ├── interface/          # "인터페이스" = 사용자 대면 진입
│   │   ├── cli.ts
│   │   ├── server.ts       # Express 서버 띄우기만, 실제 라우팅은 server/
│   │   └── commandHandler.ts  # 단일 파일 ~850줄, 모든 명령 처리
│   ├── server/             # HTTP API 구현 (라우터, 세션, 비동기 명령)
│   │   ├── router.ts
│   │   ├── worldSession.ts
│   │   ├── worldManager.ts
│   │   ├── asyncCommandHandler.ts
│   │   └── routes/         # postTick, postCommand, getStatus, getLatestSnapshot, postLinearModel, postDatasetBackup
│   ├── bootstrap/
│   │   └── worldBootstrap.ts
│   ├── core/               # 엔진 코어
│   │   ├── world.ts, node.ts, nodePool.ts, eventLoop.ts, interfaces.ts
│   │   ├── config/
│   │   ├── environment/
│   │   ├── events/
│   │   ├── maze/
│   │   ├── space/
│   │   └── systems/        # 12개 시스템
│   ├── entities/           # ECR/ECE 엔티티 + 생태/진화 + 레거시
│   │   ├── assembly.ts, catalog.ts, behaviors.ts, behaviorFunctions.ts
│   │   ├── evolutionSystem.ts, ecosystemCycleSystem.ts
│   │   ├── index.ts, plant.ts, creature.ts, weatherController.ts, blueprints.ts
│   ├── components/         # 컴포넌트 데이터·타입 (entityData, goalGa, weather, plant, basic, ...)
│   ├── ai/                 # LLM, 과학자, TensorFlow, PRNG, 이름 생성
│   │   ├── llmService.ts, orchestrator.ts, tensorFlowModel.ts, prng.ts, nameGenerator.ts
│   │   └── agents/
│   └── data/               # persistence, noSqlAdapter
```

### 1.2 식별된 문제

| 문제 | 설명 |
|------|------|
| **interface vs server 혼동** | "Server"는 `interface/server.ts`에 있고, REST 구현은 `server/`. 문서·신규 기여자가 헷갈림. |
| **명령 계층 비대** | `commandHandler.ts` 단일 파일에 30개 이상 명령. 추가·수정 시 한 파일만 건드리지만 가독성·테스트가 어려움. |
| **루트·src 산재** | `api/`(Vercel), `src/httpSmoke.ts` 등 진입점·도구가 여러 곳에 있음. |
| **entities 혼재** | ECR/ECE(assembly, catalog, behaviors), 생태·진화 시스템(evolutionSystem, ecosystemCycleSystem), 레거시(plant, creature, blueprints, weatherController)가 한 디렉터리. |
| **components 위치** | `components/`가 엔티티 데이터·타입 위주인데, entities와의 관계가 디렉터리만으로는 불명확. |
| **core 하위 깊이** | core/systems, core/environment, core/events, core/maze, core/space 등 일관되지만, 시스템 개수가 많아 그룹화 여지 있음. |

---

## 2. 목표 폴더 구조

### 2.1 원칙

- **레이어별로 한 디렉터리**: 진입 → 앱(CLI/API) → 도메인(월드·엔티티·시스템) → 인프라(저장·외부 연동).
- **이름 통일**: "서버" 관련은 모두 `app/server` 또는 `api` 한쪽으로 모아 문서와 일치시킴.
- **명령 분리**: 명령은 도메인별로 `commands/` 하위 파일로 나누고, CommandHandler는 라우팅만 담당.
- **도구·스크립트**: 실행형 스크립트는 `tools/` 또는 `scripts/`에만 두고, `src/`에는 라이브러리·앱 코드만.

### 2.2 제안 트리 (목표)

```
Aetherius/
├── api/                          # [유지] Vercel 서버리스 (배포 방식이면 그대로)
│   └── (health, status, tick, command, login, _auth, _state)
├── tools/                        # [유지] Node 실행 스크립트
│   ├── smoke.js
│   ├── run_headless.js
│   └── httpSmoke.ts              # [이동] src/httpSmoke.ts → tools/
├── scripts/                      # [선택] 빌드·배포·원샷 스크립트 (필요 시)
├── docs/
├── datasets/
├── src/
│   ├── main.ts                   # [유지] 진입점: 인자 파싱 → bootstrap → app 선택
│   │
│   ├── app/                       # [신규] 사용자 대면 진입·모드 (기존 interface + server 통합 개념)
│   │   ├── cli/
│   │   │   └── cli.ts            # interface/cli.ts 이동
│   │   ├── server/               # Express 서버 + 라우팅 (기존 interface/server + server/ 통합)
│   │   │   ├── server.ts         # Express 생성·listen (기존 interface/server.ts)
│   │   │   ├── router.ts         # 기존 server/router.ts
│   │   │   ├── worldSession.ts
│   │   │   ├── worldManager.ts
│   │   │   ├── asyncCommandHandler.ts
│   │   │   └── routes/           # postTick, postCommand, getStatus, ...
│   │   └── index.ts              # app 진입 export (cli, startServer 등)
│   │
│   ├── bootstrap/                # [유지]
│   │   └── worldBootstrap.ts
│   │
│   ├── command/                  # [신규] 명령 파싱·라우팅 + 도메인별 핸들러
│   │   ├── commandHandler.ts     # 파싱, 레지스트리 호출만 (대폭 축소)
│   │   ├── types.ts              # CommandResult, CommandContext
│   │   └── commands/             # 명령별 또는 도메인별 모듈
│   │       ├── index.ts          # 레지스트리 등록
│   │       ├── time.ts           # advance_tick, warp_evolution
│   │       ├── entity.ts         # spawn_entity, status, watch, taxonomy, ...
│   │       ├── environment.ts   # change_environment, inspect_pos, map
│   │       ├── divine.ts         # smite, bless, flood, ice_age, meteor, oracle, auto_god
│   │       ├── science.ts        # ask_science, ai_events
│   │       ├── space.ts          # space, warp, deploy_drone, drones, drone_mission
│   │       ├── ecosystem.ts      # disease_stats, corpses, migration_stats
│   │       └── persistence.ts    # latest_snapshot, db_status
│   │
│   ├── core/                     # [유지] 엔진 코어
│   │   ├── world.ts, node.ts, nodePool.ts, eventLoop.ts, interfaces.ts
│   │   ├── config/
│   │   ├── environment/
│   │   ├── events/
│   │   ├── maze/
│   │   ├── space/
│   │   └── systems/
│   │
│   ├── domain/                   # [신규] 도메인 로직 묶음 (선택적 그룹화)
│   │   ├── entities/             # [이동] ECR/ECE + 카탈로그 (기존 entities/ 정리)
│   │   │   ├── assembly.ts
│   │   │   ├── catalog.ts
│   │   │   ├── catalogPresets.ts  # [신규] 데이터 분리 (DESIGN_REFACTOR 3.6)
│   │   │   ├── behaviors.ts
│   │   │   ├── behaviorFunctions.ts
│   │   │   └── index.ts
│   │   ├── evolution/            # [이동] 진화·생태 (entities에서 분리)
│   │   │   ├── evolutionSystem.ts
│   │   │   └── ecosystemCycleSystem.ts
│   │   └── legacy/               # [선택] 점진 제거용 (plant, creature, blueprints, weatherController)
│   │       └── ...
│   │
│   ├── components/               # [유지] 컴포넌트 타입·스키마 (엔티티 데이터 정의)
│   │   └── entityData.ts, goalGaComponent.ts, ...
│   │
│   ├── ai/                       # [유지]
│   │   ├── llmService.ts, orchestrator.ts, tensorFlowModel.ts, prng.ts, nameGenerator.ts
│   │   └── agents/
│   │
│   └── data/                     # [유지] 저장·어댑터
│       ├── persistence.ts
│       └── noSqlAdapter.ts
```

### 2.3 대안(최소 변경)

전체를 `app/`, `domain/`, `command/` 로 옮기지 않고 **이름·위치만 정리**하는 경우:

- `interface/` → **이름만** `app/` 로 변경 (CLI + Server 진입이라는 의미 명확화).
- `server/` → `app/server/` 로 이동해 "앱의 서버 부분"임을 드러냄.
- `commandHandler.ts` 는 그대로 두되, 내부를 나중에 `commands/` 모듈로 분리할 준비만 (레지스트리 인터페이스만 도입).

이 경우 목표 트리에서 `app/` 구조만 적용하고, `command/`, `domain/` 은 2단계로 미룰 수 있음.

---

## 3. 디렉터리별 역할 정의 (목표 구조 기준)

| 경로 | 역할 | 의존 방향 |
|------|------|------------|
| `src/main.ts` | 인자 파싱, bootstrap 호출, app(cli/server) 선택 | → app, bootstrap |
| `src/app/` | CLI/Server 진입, 라우팅, 세션 | → command, bootstrap 결과(World 등) |
| `src/command/` | 명령 문자열 파싱, 레지스트리, 명령 핸들러 | → core, domain, ai, data |
| `src/bootstrap/` | 월드 생성·어셈블·시드 | → core, domain/entities |
| `src/core/` | World, EventBus, 환경, 시스템, 노드 풀 | → data, components, ai(일부) |
| `src/domain/entities/` | Assembly, Catalog, Behaviors | → core(node), components |
| `src/domain/evolution/` | EvolutionSystem, EcosystemCycleSystem | → domain/entities, core |
| `src/components/` | 타입·스키마만 (entityData 등) | 없음(순수 타입) |
| `src/ai/` | LLM, TensorFlow, PRNG, 에이전트 | → core(인터페이스만 가능) |
| `src/data/` | Persistence, NoSQL 어댑터 | 없음(외부/env) |
| `tools/` | 스모크, 헤드리스, httpSmoke | 프로젝트 루트 또는 dist 참조 |
| `api/` | Vercel 핸들러 | 배포 정책에 따름 |

**의존 방향**: 상위 레이어 → 하위 레이어만. core/data는 서로 최소 결합.

---

## 4. 이전 단계 (마이그레이션)

### Phase 0: 준비 (문서·의존성 정리)

- [ ] 이 기획서(FOLDER_STRUCTURE_PLAN.md) 확정
- [ ] DESIGN_REFACTOR.md의 "디렉터리·문서" 항목과 이 계획 일치시키기
- [ ] `src/interface` vs `src/server` 용어를 README·ARCHITECTURE에 명시

### Phase 1: 최소 이동 (폴더만 정리) ✅ 완료

- [x] `src/httpSmoke.ts` → `tools/httpSmoke.js` (JS로 변환하여 이동)
- [x] `src/interface/` → `src/app/` 로 통합 (cli.ts, commandHandler 재내보내기)
- [x] `src/server/` 전체 → `src/app/server/` 로 이동 (router, routes, worldSession 등)
- [x] `main.ts` 및 모든 import 경로 수정, 빌드 통과

### Phase 2: 명령 계층 분리 ✅ 완료

- [x] `src/command/` 생성, `types.ts`(CommandResult, CommandContext, CommandHandlerFn) 정의
- [x] CommandHandler 구현을 `command/commandHandler.ts`로 이동 (app/commandHandler.ts는 재내보내기)
- [x] `command/commands/index.ts`에 레지스트리 헬퍼(createCommandRegistry) 추가 (추후 도메인별 모듈 분리용)
- [x] 기존 동작 유지 (help, CLI, API 명령 모두 동일)

### Phase 3: entities 정리 (선택)

- [ ] `src/domain/` 생성
- [ ] `src/entities/` → `src/domain/entities/` (assembly, catalog, behaviors, behaviorFunctions, index)
- [ ] evolutionSystem, ecosystemCycleSystem → `src/domain/evolution/`
- [ ] 레거시(plant, creature, blueprints, weatherController)는 `domain/legacy/` 또는 그대로 두고 점진 제거
- [ ] catalog 데이터 분리: `catalogPresets.ts` 또는 JSON (DESIGN_REFACTOR 3.6)

### Phase 4: 문서·아키텍처 반영 ✅ 완료

- [x] ARCHITECTURE.md "디렉터리" 섹션을 목표 구조로 갱신
- [x] README "2.8 디렉터리 구조" 갱신
- [x] CLI_USAGE.md는 경로 무관한 명령 설명 위주라 수정 생략

---

## 5. 결정 필요 사항

| 항목 | 선택지 | 비고 |
|------|--------|------|
| **interface 이름** | A) `app/` 로 통일 / B) `interface/` 유지 | 문서와 일치시키려면 A 권장 |
| **server 위치** | A) `app/server/` (interface와 같은 레이어) / B) `server/` 유지 | A면 "앱의 서버"가 명확 |
| **command 분리 시점** | Phase 1과 동시 / Phase 2로 분리 | 리스크 줄이려면 Phase 2 |
| **domain 도입** | entities만 이동 vs evolution/legacy까지 그룹화 | 코드량 적으면 entities만 이동도 가능 |
| **api/ (Vercel)** | 유지 / 제거 또는 Express로 통합 | 배포 방식에 따름 |
| **httpSmoke** | tools/ 이동 / tests/ 또는 scripts/ | 실행 스크립트는 tools 권장 |

---

## 6. 요약

- **현재**: `interface/`(진입) + `server/`(API) 분리, commandHandler 비대, entities·루트 스크립트 산재.
- **목표**: `app/`(CLI+Server 진입), `command/`(명령 레지스트리+도메인별 핸들러), `domain/`(entities·evolution 정리), 도구는 `tools/`.
- **이전**: Phase 0(문서) → Phase 1(폴더 이동·이름) → Phase 2(명령 분리) → Phase 3(entities/domain, 선택) → Phase 4(문서 갱신).

이 기획서를 확정한 뒤 Phase 1부터 순서대로 적용하면, 폴더 구조와 코드가 정리되면서 기존 DESIGN_REFACTOR 방향과도 맞출 수 있습니다.
