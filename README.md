# Aetherius Simulation Engine (에테리우스 시뮬레이션 엔진)

**Aetherius**는 고해상도 자연 현상과 생물학적 상호작용을 정밀하게 모사하기 위한 TypeScript 기반의 시뮬레이션 엔진입니다.  
단순한 게임 로직을 넘어, 물리적 확산(Diffusion), 이류(Advection), 그리고 리비히의 최소량의 법칙(Liebig's Law)에 기반한 식물 성장 모델을 포함합니다.

---

## 1. 프로젝트 비전 (Vision)

- **과학적 정밀함 (Scientific Accuracy)**: 20개 이상의 환경 변수와 10억 개 이상의 파라미터(Environment Grid)를 처리할 수 있는 구조.
- **확장성 (Scalability)**: CLI(로컬 테스트)와 Web Server(원격 API) 모드를 동시에 지원하는 이중 아키텍처.
- **결정론적 시뮬레이션 (Deterministic Simulation)**: 모든 상태 변경은 중앙 이벤트 루프(Event Loop)와 Tick 시스템을 통해서만 이루어짐.

---

## 2. 핵심 아키텍처 (Core Architecture)

### 2.1 이중 실행 모드 (Dual Execution Mode)
단일 코드베이스(`main.ts`)에서 실행 인자에 따라 두 가지 모드로 작동합니다.
- **CLI 모드 (`--mode cli`)**: 개발자 및 디버깅용 대화형 터미널.
- **Server 모드 (`--mode server`)**: Express 기반 REST API 서버. 외부 요청을 비동기 이벤트 큐(Event Queue)에 등록하여 처리.

### 2.2 이벤트 기반 시스템 (Event-Driven System)
모든 상호작용은 `EventBus`를 통해 발행(Publish) 및 구독(Subscribe) 됩니다.
- **네임스페이스(Namespace) 구조**: 명확한 계층 구조를 위해 줄임말을 사용하지 않고 전체 단어를 사용합니다.
  - `Simulation.Event`: 최상위 이벤트 인터페이스.
  - `Environment.Event`: 날씨, 물리 현상 등.
  - `Biological.Event`: 생명체 생성, 성장, 사멸 등.
  - `System.Event`: 틱(Tick), 데이터 저장 등.
  - `Command.Event`: 사용자 및 API 명령.

### 2.3 환경 그리드 (Environment Grid)
- **TypedArray 최적화**: 대규모 환경 데이터를 처리하기 위해 `Float32Array`를 사용하여 메모리 효율성과 연산 속도를 극대화.
- **물리 엔진**: 확산(Diffusion) 및 이류(Advection) 알고리즘을 통해 열, 수분, 영양분의 자연스러운 이동을 시뮬레이션.

### 2.4 생물학적 모델 (Biological Model)
- **고급 식물 컴포넌트 (`PlantComponent`)**:
  - 광합성 효율, 수분 스트레스, 영양분 흡수율 등 20+ 파라미터.
  - 환경 요인(빛, 물, CO2)의 상호작용을 곱셈 방식(Multiplicative)으로 계산하여 리얼한 성장 곡선 구현.

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
  { "command": "spawn plant 10 10" }
  ```

---

## 5. 개발 원칙 (Development Principles)

1.  **No Abbreviations**: `Sim` 대신 `Simulation`, `Env` 대신 `Environment` 사용. 명확성이 길이보다 우선함.
2.  **Source of Truth**: GitHub 리포지토리를 유일한 진실의 원천(Single Source of Truth)으로 관리.
3.  **Security**: 민감한 정보(SSH Key 등)는 프라이빗 서브모듈(`Aetherius-Secrets`)로 분리하여 관리.
4.  **Automation**: `auto-sync.ps1` 스크립트를 통해 공용 환경에서도 안전하게 작업 동기화.

---

## 6. 로드맵 (Roadmap)

- [x] **Phase 1: Foundation** - 이벤트 루프, 기본 ECS, CLI/Server 구조 확립.
- [x] **Phase 2: Environment** - TypedArray 그리드, 네임스페이스 기반 이벤트 리팩토링.
- [ ] **Phase 3: Physics** - 유체 역학(Fluid Dynamics) 기반의 대기 및 수문 시뮬레이션.
- [ ] **Phase 4: Ecology** - 먹이사슬 및 유전 알고리즘 도입.

---

*Copyright © 2026 EndlessGames. All Rights Reserved.*
