# 이벤트 정책: EventLoop vs EventBus

시뮬레이션 내 이벤트 처리 시 **어떤 체계를 쓸지** 정리한 문서입니다.

---

## 요약

| 구분 | EventBus | EventLoop |
|------|----------|-----------|
| **용도** | Tick·시스템·환경·생물 이벤트 (시뮬레이션 로직) | 서버 API 비동기 요청(AsyncRequest) 전달 |
| **위치** | `World.eventBus` | `World.eventLoop` |
| **사용처** | System.Tick, ChangeWeather, 환경/생물 이벤트, 대부분의 게임 로직 | `WorldSession.enqueueRequest` → AsyncRequest → tick()에서 핸들러 실행 |
| **신규 기능** | **EventBus 사용** | 사용 지양 (레거시) |

---

## EventBus (권장)

- **역할**: 시뮬레이션 이벤트의 단일 진실 원천. 구독/발행, `processQueue()`로 비동기 처리 가능.
- **사용 예**: `System.Tick`, `System.ChangeWeather`, `Environment.GlobalParameterChange`, 기타 시스템 이벤트.
- **신규 이벤트 추가 시**: `eventTypes.js`에 이벤트 클래스 정의 후 `world.eventBus.subscribe(...)` / `eventBus.publish(...)` 사용.

---

## EventLoop (레거시)

- **역할**: 서버 모드에서 **API 요청을 Tick 경계로 넘길 때**만 사용. `AsyncRequest`가 큐에 쌓이고, `World.tick()` 맨 앞에서 `eventLoop.tick()` 호출 시 핸들러가 실행됨.
- **사용처**: `WorldSession.enqueueRequest()` → `world.eventLoop.emit(AsyncRequest)` → `AsyncCommandHandler`가 `eventLoop.register(System.AsyncRequest, ...)`로 처리.
- **마이그레이션**: 장기적으로 AsyncRequest도 EventBus로 발행하고, 서버 전용 구독자가 처리하도록 옮기는 방안 가능. 당분간은 EventLoop 유지.

---

## 정리

- **시뮬레이션/월드 로직** → EventBus.
- **서버 API → Tick 경계 전달** → 현재는 EventLoop, 추후 EventBus로 통합 검토.
