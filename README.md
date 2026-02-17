# Aetherius Simulation Engine (에테리우스 시뮬레이션 엔진)

**Aetherius**는 고해상도 자연 현상과 생물학적 상호작용을 정밀하게 모사하기 위한 TypeScript 기반의 시뮬레이션 엔진입니다.
단순한 게임 로직을 넘어, 물리적 확산(Diffusion), 이류(Advection), 그리고 리비히의 최소량의 법칙(Liebig's Law)에 기반한 식물 성장 모델을 포함합니다.

---

## 0. 한눈에 보는 설계 (Quick Design Overview)

- **목표**: 외부 입력이 같으면 결과도 같은 결정론적 시뮬레이션을 유지하면서, 물리/생물 로직을 확장 가능하게 쌓습니다.
- **핵심 루프**: `World.tick()`이 시간의 단위이며, 환경 업데이트 → 개체(노드/컴포넌트) 업데이트 → 스냅샷 저장 흐름으로 진행됩니다.
- **이벤트 중심**: CLI/REST 요청은 즉시 상태를 바꾸지 않고, 이벤트/요청 큐에 적재된 뒤 Tick 경계에서 처리됩니다.
- **구성 방식**: 노드(Node)에 컴포넌트(Component)를 붙여 상태/반응을 분리하고, 시스템은 이벤트를 구독하는 리액터 형태로 동작합니다.
- **실행 모드**: 같은 코드베이스로 CLI 모드와 웹 서버(Express REST API) 모드를 함께 지원합니다.

---

## 1. 프로젝트 비전 (Vision)

- **과학적 정밀함 (Scientific Accuracy)**: 20개 이상의 환경 변수와 10억 개 이상의 파라미터(Environment Grid)를 처리할 수 있는 구조.
- **확장성 (Scalability)**: CLI(로컬 테스트)와 웹 서버(원격 API) 모드를 동시에 지원하는 이중 아키텍처.
- **결정론적 시뮬레이션 (Deterministic Simulation)**: 모든 상태 변경은 중앙 이벤트 루프(Event Loop)와 Tick 시스템을 통해서만 이루어짐.

---

## 2. 핵심 아키텍처 (Core Architecture)

### 2.1 이중 실행 모드 (Dual Execution Mode)
단일 코드베이스(`main.ts`)에서 실행 인자에 따라 두 가지 모드로 작동합니다.
- **CLI 모드 (`--mode cli`)**: 개발자 및 디버깅용 대화형 터미널.
- **서버 모드 (`--mode server`)**: Express 기반 REST API 서버. 외부 요청을 비동기 이벤트 큐(Event Queue)에 등록하여 처리.

### 2.2 이벤트 기반 시스템 (Event-Driven System)
모든 상호작용은 `EventBus`를 통해 발행(Publish) 및 구독(Subscribe) 됩니다.
- **네임스페이스(Namespace) 구조**: 명확한 계층 구조를 위해 줄임말을 사용하지 않고 전체 단어를 사용합니다.
  - `Simulation.Event`: 최상위 이벤트 인터페이스.
  - `Environment.Event`: 날씨, 물리 현상 등.
  - `Biological.Event`: 생명체 생성, 성장, 사멸 등.
  - `System.Event`: 틱(Tick), 데이터 저장 등.
  - `Command.Event`: 사용자 및 API 명령.

### 2.3 환경 그리드 (Environment Grid)
- **대규모 스케일 (Massive Scale)**: **10억 개(1 Billion)** 이상의 환경 파라미터를 실시간으로 시뮬레이션하는 것을 목표로 설계됨.
- **TypedArray 최적화**: `Float32Array`와 `SharedArrayBuffer`를 사용하여 메모리 효율성과 연산 속도를 극대화.
- **물리 엔진**: 확산(Diffusion) 및 이류(Advection) 알고리즘을 통해 열, 수분, 영양분의 자연스러운 이동을 시뮬레이션.

### 2.4 생물학적 모델 (Biological Model)
- **고급 식물 컴포넌트 (`PlantComponent`)**:
  - 광합성 효율, 수분 스트레스, 영양분 흡수율 등 20+ 파라미터.
  - 환경 요인(빛, 물, CO2)의 상호작용을 곱셈 방식(Multiplicative)으로 계산하여 리얼한 성장 곡선 구현.

---

## 2.5 ECR/ECE 패턴

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

## 2.6 Behavior Function Pattern (동작 함수 패턴)

복잡한 행동 로직을 재사용 가능한 **전역 함수(Behavior Function)** 단위로 분리하여 조립하는 패턴입니다.
`BehaviorNode`는 상태(Component)만 관리하고, 실제 로직은 `function`으로 위임하여 조합성(Composability)을 극대화합니다.

### 특징
- **전역 함수**: 클래스 메서드가 아닌 순수 함수(`function`)로 로직 구현.
- **명시적 매개변수**: `(node, context)`를 인자로 받아 상태에 접근.
- **조합 가능**: `this.use(func)` 메서드로 여러 함수를 레고처럼 조립.

### 예제 코드

**1. 전역 함수 정의**
```typescript
import { BehaviorNode, UpdateContext } from './src/entities/assembly.js';

// 광합성: 빛을 에너지로 변환
export function photosynthesis(node: BehaviorNode<PlantData>, context: UpdateContext): void {
    const components = node.components;
    // ... 로직 구현 ...
    if (light > 50) components.energy.energy += 0.1;
}

// 수분 흡수: 토양 수분을 체력으로 변환
export function absorbWater(node: BehaviorNode<PlantData>, context: UpdateContext): void {
    const components = node.components;
    // ... 로직 구현 ...
    if (moisture > 20) components.vitality.hp += 0.1;
}
```

**2. 노드에서 조립**
```typescript
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

### 4.1 로컬 LLM(선택)
- 기본값은 **LLM 비활성(조용히 무시)** 입니다. AI 기능을 쓰려면 OpenAI 호환 로컬 서버를 띄우고 아래 환경변수를 설정하세요.
  - `.env` / `.env.example`에 기본 템플릿이 포함되어 있습니다.
  - 활성화하려면 `AETHERIUS_LLM_ENABLED=1` 로 바꾸세요.
  - `AETHERIUS_LLM_BASE_URL` (예: `http://localhost:1234/v1`)
  - 혼용 추천(멀티 에이전트/코드 이해 최적화)
    - `AETHERIUS_LLM_MODEL_CHAT` (예: `llama-3.1-8b-instruct`)
    - `AETHERIUS_LLM_MODEL_CODE` (예: `qwen2.5-coder-7b-instruct` 또는 `qwen2.5-coder-14b-instruct`)
    - `AETHERIUS_LLM_MODEL_JSON` (예: `llama-3.1-8b-instruct`)
  - 단일 모델만 쓰면 `AETHERIUS_LLM_MODEL`만 설정해도 됩니다.
  - `AETHERIUS_LLM_API_KEY` (로컬이면 아무 값이나 가능)
- LLM을 켜는 기능
  - `auto_god on` (AI God 개입)
  - `ai_events on` (AI 이벤트 오케스트레이터)
  - `ask_science <query>` (과학자 리포트)

### 4.2 Vercel 배포(헤드리스 API + 브라우저 로그인)
- 이 레포는 Vercel의 Serverless Function(`/api/*`)로 헤드리스 백엔드를 호스팅할 수 있습니다.
- 브라우저 로그인/인증은 `/api/login` → Bearer 토큰 발급 → 이후 `/api/*` 호출 시 `Authorization: Bearer <token>`을 사용합니다.
- 로컬 확인(빌드)
  - `npm run build`
- Vercel 환경변수(필수)
  - `AETHERIUS_AUTH_USERNAME` (기본 `admin`)
  - `AETHERIUS_AUTH_PASSWORD` (임의의 강한 비밀번호)
  - `AETHERIUS_AUTH_SECRET` (긴 랜덤 문자열, JWT 서명 키)
- 엔드포인트
  - `POST /api/login` `{ "username": "...", "password": "..." }`
  - `POST /api/tick` `{ "count": 1 }`
  - `POST /api/command` `{ "cmd": "status" }`
  - `GET /api/status?id=<entityId>`
- 기본 콘솔 UI
  - `/`(public/index.html)에서 로그인 후 tick/command를 바로 호출할 수 있습니다.

### 설치
```bash
npm install
```

### 실행
**CLI 모드 (기본값)**
```bash
npm start -- --mode cli
```

**서버 모드**
```bash
npm start -- --mode server
```

### API 예시 (Server Mode)
- **상태 확인**: `GET /status`
- **명령 전송**: `POST /command`
  ```json
  { "command": "spawn_entity plant Rose" }
  ```

---

## 5. 개발 원칙 (Development Principles)

1.  **No Abbreviations**: `Sim` 대신 `Simulation`, `Env` 대신 `Environment` 사용. 명확성이 길이보다 우선함.
2.  **Source of Truth**: GitHub 리포지토리를 유일한 진실의 원천(Single Source of Truth)으로 관리.
3.  **Security**: 민감한 정보(SSH Key 등)는 프라이빗 서브모듈([Aetherius-Secrets](https://github.com/EndlessGames/Aetherius-Secrets))로 분리하여 관리.
4.  **Automation**: `auto-sync.ps1` 스크립트를 통해 공용 환경에서도 안전하게 작업 동기화.
5.  **Code Rules**: 구현/용어 기준은 [CODE_RULES.md](CODE_RULES.md)를 따른다. (이 프로젝트의 “ECS”는 전통적 일괄처리 ECS가 아니라 이벤트 기반 하이브리드 의미)

---

## 6. 핵심 개발 로드맵 (Core Development Roadmap)

본 로드맵은 시뮬레이션 엔진의 **정밀도(Accuracy)**, **재현성(Reproducibility)**, **창발성(Emergence)**을 확보하기 위한 기술적 마일스톤에 집중합니다.
사업적 활용 방안(상용화 또는 순수 연구)은 엔진의 기반이 완성된 후 결정될 예정입니다.
자세한 3개년 계획은 [ROADMAP.md](ROADMAP.md)를 참조하십시오.

### **Phase 1: 기초 물리 및 환경 역학 (1~3개월)**
*결정론적 환경 시뮬레이션의 수학적 모델 확립*

**연구 목표**
- **유체 역학(Fluid Dynamics)**: Navier-Stokes 방정식을 단순화한 격자 기반의 이류-확산(Advection-Diffusion) 모델 구현.
- **열역학(Thermodynamics)**: 에너지 보존 법칙을 준수하는 열 전달 및 대기 순환 시스템 구축.
- **수문학(Hydrology)**: 토양 수분 포화도, 침투, 증발산(Evapotranspiration)의 정량적 계산.

**기술적 과제**
- **부동소수점 결정론(Floating Point Determinism)**: IEEE 754 표준 준수 및 플랫폼 간 연산 결과의 완벽한 일치 보장.
- **메모리 최적화**: 10억 개 이상의 셀(Cell) 처리를 위한 `SoA`(Structure of Arrays) 패턴 및 `TypedArray` 활용 극대화.

**검증 지표**
- 물리량(에너지, 질량) 보존 오차율 < 0.001%.
- 단위 시간당 시뮬레이션 처리 속도(TPS) 안정화.

---

### **Phase 2: 생물학적 복잡계 및 진화 (4~6개월)**
*개체 단위의 생존 메커니즘과 집단 유전학의 구현*

**연구 목표**
- **유전 알고리즘(Genetic Algorithm)**: 염기서열 변이(Mutation), 교차(Crossover)를 통한 형질 유전 및 자연선택 시뮬레이션.
- **표현형 가소성(Phenotypic Plasticity)**: 환경 스트레스(가뭄, 고온)에 따른 식물의 실시간 생리적 적응 반응 구현.
- **생태학적 상호작용**: 종간 경쟁(Competition), 공생(Symbiosis), 기생(Parasitism) 모델링 및 로트카-볼테라(Lotka-Volterra) 방정식 검증.

**기술적 과제**
- **Entity Component System (ECS) 고도화**: 수십만 개체(Entity)의 병렬 처리를 위한 데이터 지향 설계(DOD).
- **공간 분할(Spatial Partitioning)**: Quadtree/Octree를 활용한 충돌 감지 및 상호작용 검색 최적화.

**검증 지표**
- 섀넌 다양성 지수(Shannon Diversity Index)를 통한 생태계 건강성 측정.
- 10,000세대 이상 장기 시뮬레이션 시 유전적 다양성 유지 여부.

---

### **Phase 3: 거시적 창발성 및 데이터 분석 (7~12개월)**
*대규모 환경에서의 창발적 현상 관측 및 학술적 가시화*

**연구 목표**
- **창발성(Emergence) 관측**: 단순한 규칙에서 발생하는 복잡한 패턴(군집 이동, 식생 군락 형성 등) 분석.
- **기후 변화 시뮬레이션**: 외부 변수(CO2 농도, 일조량) 변화에 따른 생태계의 장기적 천이(Succession) 과정 연구.
- **카오스 이론 검증**: 초기 조건의 미세한 차이가 결과에 미치는 나비 효과(Butterfly Effect) 정량화.

**기술적 과제**
- **GPGPU 가속**: WebGPU 또는 Compute Shader를 활용한 대규모 병렬 연산 처리.
- **실시간 데이터 시각화**: 시뮬레이션 데이터의 실시간 히트맵, 그래프 렌더링 및 로깅 시스템 구축.

**검증 지표**
- 시뮬레이션 결과의 통계적 유의성 검증 (p-value).
- 논문 작성을 위한 고해상도 데이터셋 추출 파이프라인 완성.

---

### **학술적 기여 분야 (Interdisciplinary Contribution)**
- **계산 생물학 (Computational Biology)**
- **복잡계 물리학 (Complex Systems Physics)**
- **인공 생명 (Artificial Life)**

---

*Copyright © 2026 EndlessGames. Licensed under the MIT License.*
