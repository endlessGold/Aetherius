# 다음 업데이트 작업

미구현·추후 작업을 정리한 목록입니다. 진행 시 이 파일 또는 월별 로그에 반영합니다.

---

## DESIGN_REFACTOR 기준 (우선순위)

| 순위 | 항목 | 상태 | 비고 |
|------|------|------|------|
| 1 | CommandHandler.getWorld() + Server | ✅ 완료 | getWorld() 공개, Server는 handler.getWorld() 사용 |
| 2 | 부트스트랩 분리 (createWorld + seed) | ✅ 완료 | bootstrap/worldBootstrap.ts |
| 3 | 이벤트 정책 문서화 (EventLoop vs EventBus) | ✅ 완료 | [EVENT_POLICY.md](../EVENT_POLICY.md) |
| 4 | 명령 레지스트리 도입 | 🔶 구조만 | command/commands/ 헬퍼 있음, 도메인별 commands/*.ts 분리 선택 |
| 5 | World 시스템 주입 옵션 | ⏳ 미구현 | options?.systems로 테스트/대체 시스템 주입 |
| 6 | 카탈로그 데이터 분리 | ⏳ 미구현 | catalogPresets.ts 또는 JSON, buildCatalog 단순화 |

---

## 폴더 구조 (FOLDER_STRUCTURE_PLAN)

- Phase 3 (domain/ entities·evolution 정리): 선택. 필요 시 entities → domain/entities, evolution → domain/evolution 이동.
- catalog 데이터 분리: DESIGN_REFACTOR 6과 동일.

---

## Phase 문서 기준 (기능·검증)

- **Phase 1**: 결정론 모드/성능 측정 포인트 등 검증 강화.
- **Phase 2**: Quadtree/Octree 인터페이스, 개체군 통계/다양성 메트릭.
- **Phase 3**: 관측 메트릭, 시각화 API 확장, 데이터셋 추출 포맷.

---

## 기타

- `spawn_entity basic`: 현재 "not supported in new system yet" — basic 타입은 미구현.
- 타입 정리: `weatherEntity: any`, `(world as any).ecosystemSystem` 등 → 공식 타입 확대로 any 축소.
