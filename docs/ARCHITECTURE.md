# Aetherius 아키텍처 요약

한 페이지 수준의 구조 요약입니다. 상세 재설계·개선 계획은 [DESIGN_REFACTOR.md](DESIGN_REFACTOR.md)를 참고하세요.

---

## 핵심 개념

- **ECR/ECE**: 이 프로젝트의 "ECS"는 전통적 일괄 처리 ECS가 아니라, **EventBus 구독 기반 리액터 + Registry(World.nodes, EventBus)** 구조입니다. (용어: [CODE_RULES.md](../CODE_RULES.md))
- **Tick**: `World.tick()`이 시간 단위. 입력(CLI/API)은 큐에 쌓이고, Tick 경계에서 처리·반영됩니다.
- **이벤트**: 시뮬레이션 이벤트는 **EventBus** 사용. 서버 API 비동기 요청만 **EventLoop**(레거시) 사용.

## 레이어

| 레이어 | 역할 | 대표 파일 |
|--------|------|------------|
| 진입·부트스트랩 | 모드(CLI/Server) 선택, 월드 생성·시드 | `main.ts`, `bootstrap/worldBootstrap.ts` |
| 명령 | 문자열 명령 파싱 → 실행 | `interface/commandHandler.ts` |
| 월드·시스템 | Tick 루프, 환경·생태·웜홀 등 | `core/world.ts`, `core/systems/*` |
| 엔티티·조립 | ECR/ECE 엔티티, 카탈로그 | `entities/assembly.ts`, `entities/catalog.ts` |
| 저장 | 스냅샷/이벤트 저장 (env 기반 드라이버) | `data/persistence.ts`, `data/noSqlAdapter.ts` |
| 서버 API | REST, 세션, Tick/Command 라우트 | `server/router.ts`, `server/worldSession.ts` |

## 디렉터리

- `src/core` — 엔진 코어(World, EventBus, 환경 그리드, 시스템)
- `src/entities` — 엔티티·비헤이비어·카탈로그·생태/진화 시스템
- `src/interface` — CLI, Server, CommandHandler
- `src/server` — API 라우터, WorldSession, 비동기 명령 처리
- `src/bootstrap` — 월드 생성·어셈블·시드
- `src/ai` — LLM, 과학자 에이전트, TensorFlow 예측
- `src/data` — Persistence, NoSQL 어댑터

## 확장·리팩터

- 명령 추가: `CommandHandler.execute()` switch + 핸들러 메서드 (추후 레지스트리 패턴 검토)
- 시스템 추가: `World` 생성자 또는 주입 옵션 + Tick 순서 (추후 파이프라인화 검토)
- 상세 이슈·재설계: [DESIGN_REFACTOR.md](DESIGN_REFACTOR.md)
