# 하이브리드 서버·클라이언트 아키텍처 명시 (2026-02-20)

## 1. 이슈 요약

- Aetherius는 단일 코드베이스에서 **CLI 클라이언트**와 **HTTP 서버(Express) + 브라우저 콘솔**을 동시에 지원하는 하이브리드 아키텍처를 갖고 있음.
- 하지만 문서 상에서는 “서버 모드/CLI 모드”가 개별적으로 언급될 뿐, **하이브리드 구조**가 명시적으로 강조되어 있지 않았음.
- Phase 3에서 원격 관측/대시보드/자동화까지 확장할 때, 이 특성을 설계 기준으로 삼기 위해 문서화 필요.

## 2. 현 구조 정리

- 진입점: `src/main.ts`
  - `--mode cli` → 로컬 터미널 기반 CLI 클라이언트 (`src/app/cli.ts`)
  - `--mode server` → Express 기반 HTTP 서버 (`src/app/server/server.ts`, `router.ts`)
- 서버 모드:
  - `/api/command`, `/api/tick`, `/api/status`, `/api/science`, `/api/narrative`, `/api/snapshots`, `/api/events` 등 REST 엔드포인트 제공.
  - Vercel 배포 시 Serverless Function로 동작하며, 브라우저 로그인 콘솔을 통해 클라이언트 역할도 수행.
- 공통 코어:
  - CLI/서버 모두 동일 `World` 인스턴스와 `EventBus`, `Persistence` 계층을 공유.
  - 명령·상태 조회·스냅샷/이벤트 저장 로직은 공통 도메인 레이어 위에 얹힌다.

## 3. 개선/결정 사항

1. **README에 하이브리드 구조 명시**
   - “실행 모드” 설명에 “단일 코드베이스로 로컬 CLI 클라이언트와 HTTP 서버(Express)·브라우저(로그인 콘솔)를 모두 지원하는 하이브리드 구조”라고 명시.
2. **ARCHITECTURE.md 레이어 설명 보강**
   - `앱(진입)` 레이어를 “CLI·서버 진입, 라우팅 (하이브리드: 터미널 클라이언트 + HTTP 서버)”로 업데이트.
3. **서버 API 확장**
   - Express 라우트에서 JSON5 응답을 선택적으로 지원 (`?format=json5` 또는 `Accept: application/json5`).
   - 기본 응답은 기존처럼 `application/json` 유지.

## 4. 영향 범위

- 문서:
  - [README.md](../README.md) — 실행 모드 설명 수정.
  - [ARCHITECTURE.md](../ARCHITECTURE.md) — 레이어 표에 하이브리드 성격 반영.
- 서버 API:
  - `src/app/server/router.ts` 및 주요 라우트에서 JSON5 응답 지원.
- 아키텍처 인식:
  - 팀/기여자가 이 프로젝트를 “엔진 + 서버 + 클라이언트(터미널/브라우저)를 모두 포함한 하이브리드”로 이해하도록 기준 정립.

## 5. 후속 작업 아이디어

- CLI와 HTTP API를 모두 호출할 수 있는 통합 클라이언트 라이브러리(예: `@aetherius/client`) 분리 검토.
- 브라우저 콘솔 외에, 관측/제어용 전용 웹 UI 또는 대시보드 추가.
- JSON5 요청 바디(`Content-Type: application/json5`) 파싱 지원 여부 검토.

