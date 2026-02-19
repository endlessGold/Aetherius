# Aetherius 코드 룰 (Code Rules)

## 1) 용어(중요)

이 저장소에서 “ECS”는 **편의상 사용하는 명칭**입니다. 전통적인 ECS처럼 “시스템이 컴포넌트 배열을 일괄 처리(batch)”하는 구조가 아닙니다.

- **실제 모델**: 이벤트 기반 레지스트리/리액터에 가깝습니다. (ECR/ECE: Entity-Component-Registry / Entity-Component-Event)
- **System**: “일괄 처리 루프”가 아니라, `EventBus`에 이벤트를 구독하고 반응하는 **이벤트 핸들러/리액터**를 의미합니다.
- **Registry**: `World.nodes(Map)`와 `EventBus(구독 테이블 + 큐)`가 사실상의 레지스트리 역할을 합니다.

문서/대화에서 “ECS”라는 단어를 쓰더라도, 구현과 설계 판단은 위 의미를 기준으로 합니다.

## 2) 상태 변경 규칙

- **Tick 단위 진행**: 시뮬레이션의 시간 진행과 결과 반영은 `World.tick()`을 기준으로 일어납니다.
- **이벤트 우선**: 외부 입력(서버 API/CLI)은 즉시 상태를 바꾸지 않고, 이벤트/요청 큐에 적재한 뒤 Tick에서 처리합니다.
- **결정론 우선**: 동일 입력(이벤트 시퀀스) → 동일 결과를 목표로 합니다. 시간/난수에 의존하는 로직은 Tick 경계에서 통제합니다.

## 3) 이벤트 작성/사용 기준

- **신규 기능은 EventBus 기준**: `EventBus` + `core/events/eventTypes.ts`의 네임스페이스 이벤트를 우선 사용합니다.
- **Raw string 이벤트 최소화**: 가능하면 `Simulation.Event` 파생 클래스를 사용해 카테고리/우선순위를 명시합니다.
- **이벤트는 “사실”에 가깝게**: 명령(Command)과 사실(Fact)을 구분합니다.
  - Command: “~해라”(의도)
  - Fact: “~가 일어났다”(결과)

## 4) 컴포넌트/노드 기준

- **컴포넌트는 작은 단위로**: 하나의 컴포넌트가 너무 많은 책임을 갖지 않도록 쪼갭니다.
- **I/O 금지**: 컴포넌트/시뮬레이션 코어에서는 네트워크/파일 I/O를 직접 수행하지 않습니다. (외부 인터페이스 계층에서 이벤트로 전달)
- **핸들러는 순수하게**: `handleEvent`는 가능하면 입력 이벤트와 내부 상태만으로 동작하도록 유지합니다.

## 5) 네이밍/구조 규칙

- **줄임말 금지**: `Sim`, `Env` 같은 축약을 피하고 전체 단어를 사용합니다.
- **폴더 의미를 지킴**
  - `src/core`: 엔진의 규칙/시간/이벤트/월드
  - `src/components`: 노드에 부착되는 상태+반응 단위
  - `src/core/systems`: 이벤트 리액터(구독 기반)
  - `src/app`: CLI·Server 진입점 및 CommandHandler
  - `src/app/server`: REST 라우터, WorldSession, API 핸들러(명령을 큐로 전달)
  - `src/bootstrap`: 월드 생성·어셈블·시드 등 앱 부트스트랩

## 6) 이벤트: EventLoop vs EventBus

- **EventBus**: 시뮬레이션 이벤트의 주 채널. Tick, Biological, System, Command 등 네임스페이스 이벤트는 EventBus로 발행·구독한다. 신규 기능은 EventBus 기준으로 구현한다.
- **EventLoop**: 레거시. 현재는 서버 모드의 `AsyncRequest`(API 요청을 Tick 경계에서 실행) 처리용으로만 사용한다. EventLoop에 새 이벤트 타입을 붙이지 말고, 필요 시 EventBus로 마이그레이션한다.

## 7) 임시 문서·일회용 스크립트

- **임시 문서**: 커밋하기 애매한 기획·메모·프롬프트 덤프 등은 **저장소 루트나 `docs/`가 아닌 별도 폴더**에 둔다. 예: `_temp/`, `.scratch/` (원하면 `.gitignore`에 추가).
- **일회용 스크립트**: PS1·임시 셸 스크립트 등 자주 쓰지 않는 코드는 저장소에 넣지 않거나, 위와 같이 임시 폴더에 두고 필요 시 `.gitignore`로 제외한다.
- **docs/**: 공개·유지보수용 문서(아키텍처, 사용법, 호스팅 안내 등)만 둔다.

## 8) AI 프롬프트 및 출력 언어

- **프롬프트는 영어로**: LLM에 보내는 시스템/사용자 프롬프트는 **영어**로 작성한다. AI 소통을 영어 기준으로 하면 동작이 안정적이고 버그가 적다. (`src/ai/agents/`, `src/ai/llmService.ts` 등)
- **번역 옵션**: 사용자에게 한국어로 보여줄 필요가 있으면 **번역 옵션**을 켠다. 기본은 영어 출력이며, 다음이 설정되면 출력만 한국어로 번역한다.
  - **CLI**: `narrative --ko`, `ask_science "질문" --ko` (또는 `--lang=ko`)
  - **환경 변수**: `AETHERIUS_OUTPUT_LANG=ko` 이면 narrative/ask_science 결과를 한국어로 번역
  - **API**: `GET /api/narrative?lang=ko`, `GET|POST /api/science?lang=ko` 또는 body `lang: "ko"`
- 번역은 [src/ai/translate.ts](src/ai/translate.ts)의 `translateToKorean`으로, 동일 LLM으로 1회 호출해 수행한다.

## 9) 생태적 존재 규칙 (Bio-Logic)

- **Existence is Action**: 모든 생명 엔터티(Economant)는 **행동하는 것 자체가 기회(V)를 소모**하는 행위임을 명시한다. 행동하지 않으면 기회를 "아끼는" 것이지, 행동 = 기회 소비.
- **Abstract Trading**: "거래"를 **상호작용 및 자원 이동**으로 범용화한다. 식물의 뿌리 확장·영양분 찬탈, 동물의 사냥 등은 모두 동일한 자산 이동 로직(예: `transferPoly`, `competeForResource`)으로 처리한다.
- **Environmental Witness**: 관측자(Witness)는 반드시 다른 Economant일 필요는 없다. **시스템 외부의 '환경 엔터티'**가 보증인 역할을 수행하여 수수료(에너지 소모)를 담당하는 구조를 유지한다.
