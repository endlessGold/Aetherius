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
- **대규모 스케일 (Massive Scale)**: **10억 개(1 Billion)** 이상의 환경 파라미터를 실시간으로 시뮬레이션하는 것을 목표로 설계됨.
- **TypedArray 최적화**: `Float32Array`와 `SharedArrayBuffer`를 사용하여 메모리 효율성과 연산 속도를 극대화.
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
3.  **Security**: 민감한 정보(SSH Key 등)는 프라이빗 서브모듈([Aetherius-Secrets](https://github.com/endlessGold/Aetherius-Secrets))로 분리하여 관리.
4.  **Automation**: `auto-sync.ps1` 스크립트를 통해 공용 환경에서도 안전하게 작업 동기화.

---

## 6. 과학적 개발 로드맵 (Scientific Development Roadmap)

상업적 이익이 아닌, **시뮬레이션의 정밀도(Accuracy)**, **재현성(Reproducibility)**, **창발성(Emergence)**을 목표로 하는 순수 연구 개발 계획입니다.
자세한 3개년 연구 계획은 [ROADMAP.md](ROADMAP.md)를 참조하십시오.

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
- 시뮬레이션 결과의 통계적 유의성 검증 (P-value).
- 논문 작성을 위한 고해상도 데이터셋 추출 파이프라인 완성.

---

### **학술적 기여 분야 (Interdisciplinary Contribution)**
- **계산 생물학 (Computational Biology)**
- **복잡계 물리학 (Complex Systems Physics)**
- **인공 생명 (Artificial Life)**

---

*Copyright © 2026 EndlessGames. All Rights Reserved.*
