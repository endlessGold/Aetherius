# 하이브리드 서버·클라이언트 아키텍처 문서화 (2026-02-20)

## 1. 배경

- Aetherius는 하나의 코드베이스에서:
  - 로컬 터미널 기반 **CLI 클라이언트**
  - Express 기반 **HTTP 서버 API**
  - Vercel Serverless + 브라우저 로그인 **웹 콘솔**
  을 동시에 지원하는 하이브리드 구조를 가지고 있다.
- 기존 문서에는 CLI/서버 모드가 따로 설명되어 있었지만, “하이브리드 서버·클라이언트 엔진”이라는 관점이 명시적으로 드러나지 않았다.

## 2. 변경 사항

### 2.1 README 업데이트

- 파일: `README.md`
- 변경점:
  - “0. 한눈에 보는 설계” 섹션의 실행 모드 설명을 다음과 같이 명시:
    - 단일 코드베이스로 로컬 CLI 클라이언트와 HTTP 서버(Express)·브라우저(로그인 콘솔)를 모두 지원하는 **하이브리드 구조**임을 강조.

### 2.2 ARCHITECTURE.md 업데이트

- 파일: `docs/ARCHITECTURE.md`
- 변경점:
  - 레이어 표의 `앱(진입)` 레이어를 아래와 같이 수정:
    - “CLI·서버 진입, 라우팅 (하이브리드: 터미널 클라이언트 + HTTP 서버)”
  - 이를 통해 `src/app/cli.ts`와 `src/app/server/server.ts`가 서로 다른 애플리케이션이 아니라, 하나의 엔진 위에 얹힌 두 얼굴(클라이언트/서버)임을 분명히 함.

### 2.3 서버 API와 하이브리드성

- 관련 파일:
  - `src/app/server/router.ts`
  - `src/app/server/routes/*.ts` (status, snapshot, science, narrative, command, tick, snapshots, events, dataset backup, linear model)
- 이미 구현된 내용과 이번 문서화가 연결되도록 다음을 정리:
  - 서버는 REST API를 통해 엔진을 원격 제어하는 **클라이언트 진입점** 역할을 한다.
  - JSON5 응답 선택 지원(`?format=json5` 또는 `Accept: application/json5`)은, 다양한 클라이언트(브라우저/툴링)가 같은 API를 보다 유연하게 소비할 수 있게 하기 위한 하이브리드 설계의 일부이다.

## 3. 사용 예시 (정리)

- 로컬 CLI 클라이언트:
  - `npm start -- --mode cli`
- 로컬/서버 모드:
  - `npm start -- --mode server`
  - 이후:
    - `POST /api/command`
    - `POST /api/tick`
    - `GET /api/status`
    - `GET /api/science`
    - `GET /api/narrative`
- JSON5 응답이 필요한 클라이언트:
  - 예: `GET /api/status?format=json5`
  - 또는: `Accept: application/json5` 헤더를 추가

## 4. 기대 효과

- 아키텍처 관점:
  - Aetherius를 “엔진 + 서버 + 클라이언트(터미널/브라우저)를 동시에 포함한 하이브리드 시스템”으로 인식할 수 있다.
  - 추후 CLI·웹·자동화 도구가 모두 같은 엔진 위에서 움직인다는 전제가 명확해져, 설계/리팩터 의사결정 시 기준점이 된다.
- 운영/사용 관점:
  - 로컬 실험(CLI), 원격 제어(API), 브라우저 관찰/제어 콘솔을 상황에 맞게 조합할 수 있다.

