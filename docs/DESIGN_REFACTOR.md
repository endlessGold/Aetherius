# Aetherius 재설계 및 코드 개선 (Design Refactor)

문서·코드 전수 검토 후 정리한 아키텍처 이슈와 개선 방향입니다.

---

## 1. 현재 아키텍처 요약

| 영역 | 구현 | 비고 |
|------|------|------|
| **진입점** | `main.ts` | CLI/Server 분기, 월드·엔티티 생성·어셈블 로직이 모두 포함 |
| **월드** | `World` | 환경·시스템 12개를 생성자에서 직접 생성, Tick 순서 하드코딩 |
| **이벤트** | `EventBus` + `EventLoop` | 두 체계 공존, EventLoop는 "Legacy" 표시이나 서버 API 비동기 요청에 사용 |
| **명령** | `CommandHandler` | 단일 클래스 ~850줄, switch 기반 명령 라우팅 |
| **엔티티** | `catalog.ts` + `assembly.ts` | 카탈로그는 manager별 캐시, 조립은 ECR/ECE 패턴 |
| **저장** | `persistence.ts` + `noSqlAdapter` | env 기반 드라이버 선택, MongoDB/Redis/InMemory |

---

## 2. 식별된 문제점

### 2.1 구조/결합

- **main.ts 비대**: 월드 생성, 어셈블(evolution/ecosystem 훅), 시드 엔티티, 모드 분기가 한 파일에 있음. 재사용·테스트·문서화가 어렵다.
- **World 강결합**: 시스템 12개를 생성자에서 직접 인스턴스화. 순서 변경·교체·테스트용 목 시스템 주입이 어렵다.
- **Tick 확장이 main에만 존재**: `assemble()`에서 `world.tick`을 덮어쓰며 evolution/ecosystem을 붙임. 엔진 코어와 게임플레이 레이어가 혼재한다.

### 2.2 명령 계층

- **CommandHandler 단일 거대 클래스**: 명령 수만큼 switch + private 메서드 증가. 명령 추가 시 한 파일만 수정하지만, 파일이 매우 길어 유지보수 비용이 큼.
- **Server가 CommandHandler 내부 접근**: `(handler as any).world`로 World를 참조. 공개 API가 아님.

### 2.3 이벤트 이원화

- **EventLoop vs EventBus**:  
  - EventLoop: `emit` → 큐 적재, `tick()`에서 타입별 핸들러 실행. 서버의 `AsyncRequest`만 사용.  
  - EventBus: 구독/발행, Tick·시스템 이벤트 등 대부분 로직.  
  마이그레이션 경로가 문서에 없고, 둘 다 사용되며 역할이 중복될 수 있음.

### 2.4 문서/일치

- **디렉터리 구조**: README의 `server/` 설명이 "REST 라우터/세션"인데, 실제로 `interface/`에 Server가 있고 `server/`에 라우터·세션·WorldSession이 있음. 용어·위치 정리가 필요함.
- **ECS 용어**: CODE_RULES에 ECR/ECE 설명이 있으나, 일부 주석/파일에는 여전히 "ECS"만 등장. 신규 기여자용 한 줄 요약이 있으면 좋음.

### 2.5 기타

- **catalog.ts**: `buildCatalog`가 길고, Plant/Creature/Weather/Drone/Corpse 블록이 반복됨. 데이터(프리셋)와 조립 로직을 나누면 확장·가독성에 유리함.
- **타입**: `weatherEntity: any`, `(world as any).ecosystemSystem` 등 any 사용. 공식 타입(예: WorldWithAssembly)을 두면 리팩터 시 안전해짐.

---

## 3. 재설계 방향

### 3.1 부트스트랩 분리

- **목표**: `main.ts`는 인자 파싱, 모드 선택, 부트스트랩 호출만 담당.
- **조치**:
  - `src/bootstrap/` (또는 `src/setup/`)에 다음을 둠:
    - `createWorldWithAssembly(worldId, weatherType, manager)`: World + 날씨 엔티티 생성 및 어셈블 훅 부착.
    - `seedWorlds(worlds)`: 월드별 시드 엔티티 생성 (기존 main의 forEach 로직).
  - `main.ts`는 이 함수들을 호출해 월드 배열·기본 월드·CommandHandler를 얻고, CLI/Server만 띄움.

### 3.2 World·시스템 주입

- **단기**: 생성자에서 시스템 인스턴스를 받는 옵션 추가.  
  `options?.systems?: { natureSystem?, goalGASystem?, ... }` 형태로, 미제공 시 기존처럼 내부 생성.  
  테스트/대체 구현 주입 가능.
- **중기**: Tick 파이프라인을 "시스템 배열"로 정의하고, World가 그 순서대로 호출하도록 변경.  
  예: `[natureSystem, goalGASystem, autoGodSystem, mazeSystem, ...]`.  
  evolution/ecosystem는 이 파이프라인 뒤에 오는 "어셈블 확장"으로 두고, 부트스트랩에서만 훅으로 연결.

### 3.3 명령 계층

- **단기**: `CommandHandler`에 `getWorld(): World` 추가. Server는 `handler.getWorld()`만 사용 (any 제거).
- **중기**: 명령을 "이름 → 핸들러 함수" 맵(레지스트리)으로 분리.  
  한 파일에 한 그룹(예: `commands/envCommands.ts`, `commands/entityCommands.ts`)씩 두고, CommandHandler는 파싱 후 레지스트리에서 핸들러만 호출.  
  기존 private 메서드는 그대로 두되, 등록만 레지스트리로 옮겨 점진 이전.

### 3.4 이벤트 통합

- **정책**: EventBus를 "단일 진실 원천"으로 유지. AsyncRequest는 EventBus로 발행하고, 서버 전용 구독자가 처리하도록 변경 검토.
- **문서**: CODE_RULES 또는 DESIGN_REFACTOR에 "EventLoop는 서버 AsyncRequest용 레거시, 신규 기능은 EventBus 사용" 명시 및 마이그레이션 단계 적기.

### 3.5 문서·디렉터리

- **README** "디렉터리 구조": `interface/`(CLI, Server 진입), `server/`(라우터, 세션, API 핸들러) 구분을 한 줄씩 명시.
- **ARCHITECTURE.md** (선택): 현재 구조 1페이지 요약, DESIGN_REFACTOR 링크, ECR/ECE 한 줄 정의.

### 3.6 카탈로그·타입

- **catalog**: 프리셋(식물/크리처/날씨/드론/시체)을 JSON 또는 `catalogPresets.ts`로 분리하고, `buildCatalog`는 그 데이터를 읽어 엔티티만 생성. 반복 코드 축소.
- **타입**: `WorldWithAssembly`(evolutionSystem, ecosystemSystem 포함), `CommandHandler` 생성자에서 weatherEntity 타입을 구체 타입으로 한정해 any 축소.

---

## 4. 적용 우선순위

| 순위 | 항목 | 영향 | 난이도 |
|------|------|------|--------|
| 1 | CommandHandler.getWorld() + Server 수정 | any 제거, API 명확화 | 낮음 |
| 2 | 부트스트랩 분리 (createWorld + seed) | main 단순화, 테스트·재사용 | 중간 |
| 3 | 이벤트 정책 문서화 (EventLoop vs EventBus) | 혼선 방지 | 낮음 |
| 4 | 명령 레지스트리 도입 | CommandHandler 분할 기반 | 중간 |
| 5 | World 시스템 주입 옵션 | 테스트·유연성 | 중간 |
| 6 | 카탈로그 데이터 분리 | 가독성·확장 | 중간 |

---

## 5. 참고 (현재 Tick 흐름)

```
World.tick()
  → eventLoop.tick()                    // Legacy: 큐에 쌓인 이벤트(예: AsyncRequest) 처리
  → eventBus.publish(System.Tick)
  → eventBus.processQueue()
  → natureSystem.simulate()
  → goalGASystem.tick()
  → autoGodSystem.tick()
  → mazeSystem.tick()
  → eventBus.processQueue()
  → (스냅샷 빌드 및 persistence 저장)
```

main에서 덮어쓴 tick 확장:

```
  → (위 World.tick 완료 후)
  → manager.listenUpdate() / manager.update()
  → evolutionSystem.tick()
  → ecosystemSystem.tick()
  → (60 tick마다 디버그 로그)
```

이 확장을 "어셈블 레이어"로 명시하고, 부트스트랩에서만 주입하는 구조로 정리하는 것이 재설계 목표에 부합합니다.
