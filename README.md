# Aetherius Simulation Engine (에테리우스 시뮬레이션 엔진)

**Aetherius**는 몰입감 있는 “가상세계”를 만들기 위한 TypeScript 기반 시뮬레이션 엔진입니다.
과학적 고증은 중요한 도구이지만 필수 제약은 아니며, 필요하면 타키온처럼 “가상의 모델/가설”을 심어서 실험적인 규칙과 세계관을 굴릴 수도 있습니다.
현재 구현에는 환경 그리드(확산/이류), 생명/생태, 장소 네트워크, 멀티월드/웜홀, (선택) 로컬 LLM 기반 자동화가 포함됩니다.
다만 고증이든 가설이든, 규칙은 관측/로그 가능한 상태 변수로 떨어지고 `World.tick()` 경계에서 재현 가능하게 동작하도록 설계합니다.
핵심 컨셉은 한두 가지 규칙이 아니라, 각 도메인(물리/기후/생태/행동 등)마다 **정밀한 상태와 로직을 깊게 만들고**, 그것들이 Tick 위에서 서로 얽히도록 만드는 것입니다.

---

## Quickstart
```bash
npm install
npm start -- --mode cli
```
(첫 실행 시 빌드가 자동 실행됩니다. 이미 빌드된 상태에서 빠르게 다시 실행하려면 `npm run start:dist:cli`)

서버로 띄우려면:
```bash
npm start -- --mode server
```

## 이 프로젝트로 할 수 있는 것
- **환경/물리(현재)**: 대규모 EnvironmentGrid(레이어) + 확산/이류 기반 업데이트
- **기후/수문(현재/확장)**: 날씨/계절 엔티티 기반 강제력(forcing) → 환경 레이어에 반영(확장 가능)
- **생명/생태(현재)**: 식물 성장, 크리처 행동/이동(Goal GA), 질병/사체/분해 사이클
- **기하학적 생존 역학(선택)**: 점·선·면(Vertic/Edges/Poly) 기반 생명 조건, 식물=광합성·가공·영양분 경쟁, 동물=거래, 유전 학습·군집·환경 배율 ([docs/ECONOMY_BIO_SPEC.md](docs/ECONOMY_BIO_SPEC.md))
- **공간/네트워크(현재)**: 장소(Place) 네트워크로 이동 흔적을 그래프(노드/엣지)로 축적
- **멀티월드/웜홀(현재)**: World 간 연결/이동 이벤트로 세계를 분할·연결
- **개입/자동화(선택)**: 드론/액추에이터 + 로컬 LLM 기반 AutoGod/과학자 리포트/이벤트 오케스트레이션

## 0. 한눈에 보는 설계 (Quick Design Overview)

- **목표**: 외부 입력이 같으면 결과도 같은 결정론적 시뮬레이션을 유지하면서, 물리/기후/생태/행동 등 도메인 로직을 확장 가능하게 쌓습니다.
- **핵심 루프**: `World.tick()`이 시간의 단위이며, 환경 업데이트 → 개체(노드/컴포넌트) 업데이트 → 스냅샷 저장 흐름으로 진행됩니다.
- **이벤트 중심**: 시스템들은 `EventBus`를 구독하고, Tick 경계에서 이벤트 큐가 처리됩니다.
- **구성 방식**: 월드는 환경(그리드) + 시스템(EventBus 구독) + 엔티티(AssembleManager/ECR/ECE)로 구성됩니다.
- **멀티월드**: `UniverseRegistry`가 월드/매니저를 등록하고, 웜홀로 엔티티를 이동시킬 수 있습니다.
- **실행 모드**: 로컬 CLI/서버(Express) + Vercel(Serverless API + 브라우저 로그인) 둘 다 지원합니다.

---

## 1. 프로젝트 비전 (Vision)

- **몰입감 (Immersion First)**: 플레이/관찰 관점에서 “그럴듯하게 느껴지는” 세계를 최우선 목표로 둡니다.
- **고증/가설 혼용 (Grounded + Speculative)**: 검증된 과학 모델도 쓰지만, 세계관을 위해 가상의 법칙/가설을 주입해 실험할 수 있습니다.
- **대규모 스케일 (Massive Scale)**: 20개 이상의 환경 변수와 10억+ 파라미터(Environment Grid)를 다룰 수 있는 구조.
- **확장성 (Scalability)**: CLI(로컬 테스트)와 웹 서버/Serverless(원격 API) 모드를 동시에 지원.
- **결정론/재현성 (Determinism)**: 외부 입력이 같으면 결과도 같도록, 상태 변화가 Tick 경계에서 정의되도록 설계.

---

## 2. 핵심 아키텍처 (Core Architecture)

### 2.1 이중 실행 모드 (Dual Execution Mode)
단일 코드베이스(`main.ts`)에서 실행 인자에 따라 두 가지 모드로 작동합니다.
- **CLI 모드 (`--mode cli`)**: 개발자 및 디버깅용 대화형 터미널.
- **서버 모드 (`--mode server`)**: Express 기반 REST API 서버. 명령(`/api/command`)은 Tick 경계에서 처리되며, tick(`/api/tick`)은 즉시 진행될 수 있습니다.

### 2.2 이벤트 기반 시스템 (Event-Driven System)
모든 상호작용은 `EventBus`를 통해 발행(Publish) 및 구독(Subscribe) 됩니다.
- **네임스페이스(Namespace) 구조**: 명확한 계층 구조를 위해 줄임말을 사용하지 않고 전체 단어를 사용합니다.
  - `Simulation.Event`: 최상위 이벤트 인터페이스.
  - `Environment.Event`: 날씨, 물리 현상 등.
  - `Biological.Event`: 생명체 생성, 성장, 사멸 등.
  - `System.Event`: 틱(Tick), 데이터 저장 등.
  - `Command.Event`: 사용자 및 API 명령.

**Tick 데이터 흐름(요약)**
- 입력(CLI/HTTP) → Command 파싱 → 이벤트 발행/큐 적재 → `World.tick()` 경계에서 처리
- `World.tick()` 내에서 대략적으로: 환경 그리드 업데이트 → 시스템 업데이트(센서/상호작용/생태계/웜홀 등) → 엔티티 업데이트(AssembleManager) → 이벤트 큐 처리 → 필요 시 스냅샷/로그 저장
- 서버 모드에서:
  - `/api/command`는 요청을 큐에 넣고 Tick에서 처리되는 경로를 사용
  - `/api/tick`은 지정한 tick만큼 즉시 진행(재진입 방지 가드 포함)

### 2.3 환경 그리드 (Environment Grid)
- **대규모 스케일 (Massive Scale)**: **10억 개(1 Billion)** 이상의 환경 파라미터를 실시간으로 시뮬레이션하는 것을 목표로 설계됨.
- **TypedArray 최적화**: `Float32Array`와 `SharedArrayBuffer`를 사용하여 메모리 효율성과 연산 속도를 극대화.
- **물리 엔진**: 확산(Diffusion) 및 이류(Advection) 알고리즘을 통해 열, 수분, 영양분의 자연스러운 이동을 시뮬레이션.

### 2.4 도메인 모델 (Domain Model)
- 이 엔진은 특정 한 분야(예: 생물학)만 목표로 하지 않고, “가상세계”를 구성하는 여러 분야를 Tick 단위로 확장할 수 있게 구성합니다.
- **환경/물리**: EnvironmentGrid 레이어(열/수분/영양 등)를 확산/이류로 갱신
- **기후/계절**: Weather/Season 강제력이 레이어에 반영되도록 연결(현 구조는 확장 전제)
- **생명/행동/생태**: 식물 성장, 크리처 행동/이동(Goal GA), 질병/사체/분해 사이클
- **기하학적 생존 역학(선택)**: Vertic/Edges/Poly 기반 생명 조건·행동 은유(광합성·가공·거래), 유전 학습·환경 배율. Tick/EventBus 연동 확장 가능 ([CODE_RULES.md](CODE_RULES.md) §8 Bio-Logic)
- **공간/네트워크**: Place/Maze 그래프 축적, 멀티월드/웜홀 이벤트로 세계 연결
- **개입/자동화(선택)**: 드론/액추에이터 + 로컬 LLM 기반 오케스트레이션

### 2.5 멀티월드/공간 (Space)
- `UniverseRegistry`에 여러 `World` + `AssembleManager`를 등록하고, 웜홀 시스템이 월드 간 이동을 발생시킵니다.
- 핵심 개념: **월드마다 AssembleManager가 분리**되어, 엔티티가 섞이지 않습니다.
- 웜홀은 “생성(열림) → TTL 만료(닫힘) → 이동(확률)” 같은 규칙으로 이벤트를 발생시키며, 시뮬레이션이 멀티월드로 확장될 수 있게 합니다.

---

## 2.6 ECR/ECE 패턴 (AssembleManager)

이 프로젝트의 ECR/ECE는 전통적 ECS의 일괄 처리와 달리, 이벤트 중심으로 반응을 구성하는 하이브리드 구조입니다.

- **Entity**: 상태를 묶는 단위이며 하위 노드를 보유합니다.
- **Component**: 순수 데이터 모델이며 상태만 보유합니다.
- **Reaction/Event**: 이벤트(SystemEvent)에 반응하는 함수로, BehaviorNode가 등록/실행합니다.

### 예제

```ts
import { AssembleManager, BehaviorNode, Entity, SystemEvent, UpdateContext } from './src/entities/assembly.js';
import { World } from './src/core/world.js';

type DroneData = {
  position: { x: number; y: number };
  energy: { value: number };
};

class DroneBehavior extends BehaviorNode<DroneData> {
  constructor(components: DroneData) {
    super(components);
    this.on(SystemEvent.ListenUpdate, (c, context: UpdateContext) => {
      c.energy.value = Math.max(0, c.energy.value - 0.1 * context.deltaTime);
      c.position.x += 0.5 * context.deltaTime;
    });
  }
}

const manager = new AssembleManager();
const world = new World('Example');

manager.createEntity(Entity, 'Drone_001', [], [
  {
    NodeClass: DroneBehavior,
    components: { position: { x: 0, y: 0 }, energy: { value: 100 } }
  }
]);

manager.listenUpdate({ world, deltaTime: 1.0 });
manager.update();
```

## 2.7 Behavior Function Pattern (동작 함수 패턴)

복잡한 행동 로직을 재사용 가능한 **전역 함수(Behavior Function)** 단위로 분리하여 조립하는 패턴입니다.
`BehaviorNode`는 상태(Component)만 관리하고, 실제 로직은 `function`으로 위임하여 조합성(Composability)을 극대화합니다.

### 특징
- **전역 함수**: 클래스 메서드가 아닌 순수 함수(`function`)로 로직 구현.
- **명시적 매개변수**: `(node, context)`를 인자로 받아 상태에 접근.
- **조합 가능**: `this.use(func)` 메서드로 여러 함수를 레고처럼 조립.

### 예제 코드(식물/크리처 공통 개념)

**1. 전역 함수 정의**
```typescript
import { BehaviorNode, UpdateContext } from './src/entities/assembly.js';

type PlantData = {
  energy: { energy: number };
  vitality: { hp: number };
};

type CreatureData = {
  energy?: { energy: number };
};

// 예시 1) 식물: 광합성(빛 → 에너지)
export function photosynthesis(node: BehaviorNode<PlantData>, context: UpdateContext): void {
    const components = node.components;
    const light = 80;
    if (light > 50) components.energy.energy += 0.1 * context.deltaTime;
}

// 예시 2) 크리처: 에너지 소모(이동/행동 → 에너지 감소)
export function spendEnergy(node: BehaviorNode<CreatureData>, context: UpdateContext): void {
    const c = node.components;
    const cost = 0.05 * context.deltaTime;
    if (c.energy) c.energy.energy = Math.max(0, c.energy.energy - cost);
}

// 예시 3) 공통: 수분 흡수(토양 수분 → 체력/상태 변화)
export function absorbWater(node: BehaviorNode<PlantData>, context: UpdateContext): void {
    const components = node.components;
    const moisture = 30;
    if (moisture > 20) components.vitality.hp += 0.05 * context.deltaTime;
}
```

**2. 노드에서 조립**
```typescript
import { BehaviorNode, SystemEvent } from './src/entities/assembly.js';

export class PlantBehavior extends BehaviorNode<PlantData> {
    constructor(components: PlantData) {
        super(components);

        // 함수 조립 (Composition)
        this.use(photosynthesis);
        this.use(absorbWater);

        // 필요 시 고유 로직 추가 가능
        this.on(SystemEvent.ListenUpdate, (c, ctx) => { /* ... */ });
    }
}
```

## 2.8 디렉터리 구조 (Compact Layout)
```text
src/
  app/          사용자 대면 진입: CLI(app/cli.ts), 서버(app/server/: Express, 라우터, WorldSession, API)
  command/      명령 파싱·실행(commandHandler), 명령 레지스트리·핸들러(commands/)
  core/         월드/이벤트/환경/시스템(physics, sensor, wormhole, maze 등)
  entities/     AssembleManager 기반 엔티티 조립(plant/creature/weather/ecosystem)
  economy/       기하학적 생존 역학(Vertic/Edges/Poly), 생태 엔진·유전 학습·군집·환경
  bootstrap/    월드 생성·어셈블·시드(createWorldWithAssembly, seedWorlds)
  ai/           로컬 LLM 어댑터 + Science/AI 오케스트레이터
api/            (Vercel) 서버리스 엔드포인트 + JWT 인증
public/         (Vercel) 브라우저 콘솔 UI
tools/          smoke.js, run_headless.js(dataset CLI), run_economy_evolution.js 등
docs/           아키텍처(ARCHITECTURE.md), CLI 사용법(CLI_USAGE.md), DB 호스팅(DB_HOSTING.md),
                이벤트 정책(EVENT_POLICY.md), 생태 명세(ECONOMY_BIO_SPEC.md), 시크릿(SECRETS_REF.md)
```

---

## 3. 기술 스택 (Tech Stack)

- **Language**: TypeScript (NodeNext Module System)
- **Runtime**: Node.js
- **Server Framework**: Express.js
- **Pattern**:
  - Entity-Component-System (ECS) Hybrid
  - Command Pattern (Virtual Command Handler)
  - Pub/Sub Event Bus
  - Single Responsibility Principle (SRP) 준수

---

## 4. 설치 및 실행 (Installation & Usage)

### 4.1 설치
```bash
npm install
```

### 4.2 로컬 실행
**CLI 모드**
```bash
npm start -- --mode cli
```

**서버 모드(Express)**
```bash
npm start -- --mode server
```

### API 예시 (서버 모드)
- Express 서버 모드에서는 기본적으로 `/api/*`로 노출됩니다.
- **상태 확인**: `GET /api/status` 또는 `GET /api/status/<id>`
- **Tick 진행**: `POST /api/tick`
  ```json
  { "count": 1 }
  ```
- **명령 전송**: `POST /api/command`
  ```json
  { "cmd": "spawn_entity plant Rose" }
  ```
  ```json
  { "cmd": "spawn_entity ga Wolf" }
  ```

### 4.3 Gemini API(선택)
- AI 기능은 **Google Gemini API**를 사용합니다. `.env`에 `GEMINI_API_KEY`를 넣으면 연동됩니다. 없으면 AI 기능은 무음 처리(빈 응답)됩니다.
  - `.env.example` 참고. API 키는 [Aetherius-Secrets](https://github.com/endlessGold/Aetherius-Secrets) 또는 로컬 `.env`에만 보관합니다.
  - (선택) `GEMINI_MODEL=gemini-1.5-flash` — 기본값은 `gemini-1.5-flash`입니다.
- 사용하는 기능
  - `auto_god on` (AI God 개입)
  - `ai_events on` (AI 이벤트 오케스트레이터)
  - `ask_science <query>` (과학자 리포트)

### 4.4 Vercel 배포(헤드리스 API + 브라우저 로그인)
- 이 레포는 Vercel의 Serverless Function(`/api/*`)로 헤드리스 백엔드를 호스팅할 수 있습니다.
- 브라우저 로그인/인증은 `/api/login` → Bearer 토큰 발급 → 이후 `/api/*` 호출 시 `Authorization: Bearer <token>`을 사용합니다.
- 주의: Serverless는 인스턴스가 재시작되면 메모리 상의 월드가 초기화될 수 있습니다. **Vercel 환경변수에 DB 설정을 넣으면** 스냅샷·이벤트·진화 통계는 MongoDB Atlas에 저장되므로, 장기 상태는 Atlas에 남습니다. 상세는 [DB_HOSTING.md](docs/DB_HOSTING.md)의 "Vercel 배포 시 DB 연동" 절을 참고하세요.
- Vercel 환경변수(필수)
  - `AETHERIUS_AUTH_USERNAME` (기본 `admin`)
  - `AETHERIUS_AUTH_PASSWORD` (임의의 강한 비밀번호)
  - `AETHERIUS_AUTH_SECRET` (긴 랜덤 문자열, JWT 서명 키)
  - DB 연동 시 추가: `AETHERIUS_NOSQL_DRIVER=mongodb`, `AETHERIUS_MONGODB_URI`(Atlas 연결 문자열), `AETHERIUS_MONGODB_DB`(예: `aetherius`)
- 엔드포인트
  - `POST /api/login` `{ "username": "...", "password": "..." }`
  - `POST /api/tick` `{ "count": 1 }`
  - `POST /api/command` `{ "cmd": "status" }`
  - `GET /api/status?id=<entityId>`
- 기본 콘솔 UI
  - `/`(public/index.html)에서 로그인 후 tick/command를 바로 호출할 수 있습니다.

---

## 5. 개발 원칙 (Development Principles)

1.  **No Abbreviations**: `Sim` 대신 `Simulation`, `Env` 대신 `Environment` 사용. 명확성이 길이보다 우선함.
2.  **Source of Truth**: GitHub 리포지토리를 유일한 진실의 원천(Single Source of Truth)으로 관리.
3.  **Security**: 민감한 정보(SSH Key 등)는 프라이빗 서브모듈([Aetherius-Secrets](https://github.com/EndlessGames/Aetherius-Secrets))로 분리하여 관리.
4.  **Automation**: 작업 동기화는 Git 기반. 일회용 스크립트는 [CODE_RULES.md](CODE_RULES.md) §7에 따라 `_temp/` 등 별도 폴더에 두고 `.gitignore`로 제외할 수 있음.
5.  **Code Rules**: 구현/용어 기준은 [CODE_RULES.md](CODE_RULES.md)를 따른다. (이 프로젝트의 “ECS”는 전통적 일괄처리 ECS가 아니라 이벤트 기반 하이브리드 의미)

---

## 6. 핵심 개발 로드맵 (Core Development Roadmap)

README에는 현재 구현/사용법에 필요한 수준만 요약합니다. 자세한 로드맵은 [ROADMAP.md](ROADMAP.md)를 참조하세요.

- **Phase 1 (환경 물리/결정론)**: 이류-확산 기반 환경 업데이트, 결정론/성능(대규모 그리드) 검증
- **Phase 2 (생명/생태/진화)**: 크리처 행동/유전, 질병/사체/분해, 상호작용 확장 및 텔레메트리 강화
- **Phase 3 (창발성/분석/시각화)**: 장기 시뮬레이션 관측 지표, 데이터셋 추출/분석/가시화 파이프라인

*Copyright © 2026 EndlessGames. Licensed under the MIT License.*
