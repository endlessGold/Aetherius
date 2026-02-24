---
title: Economy SDK API (KO)
version: 1.0.0
language: ko
module: economy
description: Aetherius Economy 모듈의 전체 public SDK-API 참조 문서
sidebar:
  label: Economy (KO)
  order: 10
---

# Economy SDK-API 레퍼런스 (KO)

## 1. SDK 개요

### 1.1 설치 및 실행 맥락

- 현재 Aetherius는 TypeScript/Node.js 프로젝트로, `npm run build` 후 `dist/` 디렉터리에서 실행됩니다.
- Economy SDK-API는 주로 다음 두 방식으로 사용됩니다.
  - 프로젝트 내부에서 상대 경로 import로 Economy 모듈을 직접 불러와 시뮬레이션을 제어합니다.
  - 향후 패키지로 배포될 경우 패키지 이름(`aetherius`) 기준으로 동일한 API를 제공하는 것을 목표로 합니다.
- 이 문서에서는 Economy 모듈이 제공하는 타입/함수/클래스를 중심으로 설명합니다.

### 1.2 Economy 모듈 개요

- Economy 모듈은 다음과 같은 기능을 제공합니다.
  - Vertic/Edges/Poly로 표현되는 “생존 경제” 상태 모델링
  - EconomyAgent/Genome 기반 유전 진화
  - AetheriusEngine을 통한 행동(채굴/가공/소비/거래/광합성 등) 적용
  - EconomySystem과 World/EventBus 연동

## 2. 공개 타입

### 2.1 자원 및 상태 타입

- Vertic, Edges, Poly
  - Vertic: 생존/행동 에너지에 해당하는 기초 자원입니다.
  - Edges: 신뢰/신용·관계 같은 “선” 개념입니다.
  - Poly: 거래 가능한 자산/영양 단위이며, `area`와 `energyDensity`를 가집니다.
- Economant
  - 개별 생명체의 Vertic/Edges/Poly 상태를 묶은 구조체입니다.
- NutrientPool
  - 식물을 위해 환경에 존재하는 Poly 풀을 나타냅니다.

### 2.2 종 역할/행동 타입

- SpeciesRole (enum)
  - `plant`, `marketAgent`, `grazer`, `predator`, `decomposer` 등의 종 역할입니다.
  - 각 값은 자동 할당된 숫자로, ID와 코드명을 동시에 나타냅니다.
- SpeciesRoleId, PlantSpeciesRole, AnimalSpeciesRole, PrimaryProducerRole
  - 역할 ID 및 역할 그룹을 표현하는 타입 별칭입니다.
- EconomyActionKind (enum)
  - MINE / CRAFT / CONSUME / TRADE_BUY / TRADE_SELL / WITNESS / IDLE
  - PHOTOSYNTHESIS / PROCESS_NUTRIENT / COMPETE_NUTRIENT 등 Economy에서 사용하는 모든 행동 ID입니다.

### 2.3 에이전트 및 유전체 타입

- EconomyAgent
  - Economant + EconomyGenome + 식별자를 가진 에이전트 구조체입니다.
- EconomyGenome
  - 행동별 가중치, 가공 파라미터(craftArea), 변이율(mutationRate), 세대 번호 등을 포함하는 유전체입니다.
- RunOneStepResult
  - 한 라운드 실행 후 “어떤 에이전트가 어떤 행동을 했는지, 누가 디폴트(파산) 상태가 되었는지”를 담는 결과 타입입니다.

## 3. 엔진 함수

### 3.1 AetheriusEngine

- 역할
  - Vertic/Edges/Poly 관점에서의 행위(채굴, 가공, 소비, 거래 등)를 실제 상태 변화로 적용하는 엔진입니다.
- 특징
  - 상태를 직접 변경하므로, 호출 시점과 입력 상태에 유의해야 합니다.

### 3.2 selectAction

- 역할
  - 주어진 EconomyAgent와 주변 집단, 영양 풀 상태를 바탕으로, EconomyGenome 가중치에 따라 다음 EconomyAction을 선택합니다.
- 특징
  - 확률적 선택을 수행하므로, 같은 상태에서도 RNG 시드에 따라 결과가 달라질 수 있습니다.

### 3.3 runOneStep

- 역할
  - EconomyAgent 집단에 대해 “행동 선택 → 엔진 적용 → 디폴트 처리”까지 한 라운드를 실행합니다.
- 결과
  - RunOneStepResult를 반환하고, 콜백(onAction, onDefault)으로 외부 시스템과 연동할 수 있습니다.

### 3.4 createPopulation

- 역할
  - 초기 EconomyAgent 집단을 생성합니다.
- 입력
  - 개수, 종 ID, 난수 발생기(PRNG)를 입력으로 받아, 각 에이전트에 기본 유전체와 상태를 부여합니다.

## 4. 진화 및 유전체

### 4.1 EconomyEvolution

- 역할
  - 세대 단위로 EconomyAgent 집단을 진화시키는 고수준 엔진입니다.
- 동작
  - 적합도(fitness)에 따라 상위 개체를 선별하고, 교차(crossover)와 변이(mutate)를 적용해 다음 세대를 만듭니다.

### 4.2 EconomyEvolutionConfig 및 기본 설정

- EconomyEvolutionConfig
  - populationSize, stepsPerGeneration, eliteCount, seed 등을 포함하는 진화 설정입니다.
- DEFAULT_EVOLUTION_CONFIG
  - 합리적인 기본값을 가진 EconomyEvolutionConfig입니다.

### 4.3 Genome 유틸리티

- createEconomyGenome
  - 기본 가중치(식물/비식물)에 기반해 EconomyGenome을 생성합니다.
- fitness
  - Economant 상태를 입력으로 받아 “얼마나 많은 V/E/P를 확보했는지”를 하나의 숫자로 계산합니다.
- mutate / crossover
  - mutate: 유전체에 작은 노이즈를 주어 탐색 범위를 넓힙니다.
  - crossover: 두 유전체를 섞어 새로운 유전체를 만듭니다.

## 5. Events 연동

### 5.1 Economy 이벤트 개요

- Economy.ActionApplied
  - Economy 모듈에서 특정 EconomyAction이 실제로 수행되었을 때 발행되는 이벤트입니다.
- Economy.DefaultOccurred
  - Vertic=0 상태 등으로 디폴트(파산/기초수급)가 발생했을 때 발행됩니다.

### 5.2 RunOneStepResult와 이벤트

- runOneStep 결과의 actions/defaults는 EconomySystem을 통해 EventBus로 변환됩니다.
- payload에는 entityId, actionKind(EconomyActionKind), tickCount, rehabCount 등이 포함됩니다.

## 6. 설정 (Configuration)

### 6.1 EconomySystemConfig

- enabled: EconomySystem 활성화 여부.
- stepsPerGeneration: 한 세대에 포함되는 틱 수.
- populationSize: EconomyAgent 집단 크기.
- seed: Economy 진화를 위한 난수 시드.

### 6.2 기타 설정 값

- DEFAULT_ENVIRONMENT
  - Economy 환경의 기본 상태를 나타내는 값입니다.
- DEFAULT_EVOLUTION_CONFIG
  - EconomyEvolution을 위한 기본 설정입니다.

## 7. 예제 (Examples)

### 7.1 최소 Economy 시뮬레이션 흐름

- Economy 모듈에서 초기 population을 생성합니다.
- AetheriusEngine과 PRNG를 준비합니다.
- 루프를 돌며 runOneStep을 호출하고, RunOneStepResult를 사용해 로깅/분석을 수행합니다.

### 7.2 World + Economy 통합 흐름

- World 인스턴스를 생성하고 EconomySystem을 등록합니다.
- EconomySystemConfig로 populationSize/stepsPerGeneration 등을 설정합니다.
- World.tick() 호출 시 EconomySystem.tick(world)가 함께 실행되어,
  - EnvironmentGrid와 EconomyAgent 행동이 함께 진화하는 통합 시뮬레이션이 진행됩니다.

