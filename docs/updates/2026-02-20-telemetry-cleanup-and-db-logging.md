# 텔레메트리 JSONL 정리 및 DB 로깅 정책 업데이트 (2026-02-20)

## 1. 배경

- `data/reports/*.jsonl`에는 웜홀, 다큐멘터리 드론, 과학자 리포트, AI 이벤트 등 텔레메트리 이벤트가 JSONL로 기록된다.
- 동일한 이벤트는 이미 Persistence 계층(MongoDB/Redis/InMemory)을 통해 DB에도 저장되고 있어, 파일은 보조 로그 역할만 한다.
- 여러 번 시뮬레이션을 재시작하면 세션별 로그가 계속 누적되어, 디스크 정리 기준이 불명확했다.

## 2. 개선 목표

- “필요없는 데이터”의 기준을 명시하고, 재시작 시 자동으로 정리되도록 한다.
- DB를 단일 진실 원천으로 유지하면서, 파일 로그는 세션 단위의 일회용 텔레메트리로 취급한다.

## 3. 동작 변경 사항

### 3.1 엔진 시작 시 텔레메트리 파일 자동 삭제

- 파일: `src/main.ts`
- 추가 함수: `cleanupRuntimeArtifacts()`
- 동작:
  - 프로세스 시작 시 `data/reports` 디렉터리의 `*.jsonl` 파일을 검색한다.
  - `AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START`(기본 `'1'`)가 `'1'`이면, 해당 JSONL 파일을 모두 삭제한다.
  - 이후 새 세션에서 발생하는 텔레메트리만 다시 JSONL로 기록된다.

```ts
async function cleanupRuntimeArtifacts() {
  const cleanOnStart = (process.env.AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START ?? '1') === '1';
  if (!cleanOnStart) return;

  const root = process.cwd();
  const reportsDir = path.join(root, 'data', 'reports');
  try {
    const entries = await fs.promises.readdir(reportsDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
        .map((e) =>
          fs.promises.unlink(path.join(reportsDir, e.name)).catch(() => {})
        )
    );
  } catch {
  }
}
```

### 3.2 환경 변수 정리

- `AETHERIUS_TELEMETRY_JSONL`:
  - `'1'`이면 텔레메트리를 DB + JSONL 파일(`data/reports/*.jsonl`)에 함께 기록한다.
  - `'0'` 또는 미설정이면 JSONL 파일은 생성하지 않는다.
- `AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START`:
  - 기본값: `'1'`
  - `'1'`이면 엔진 시작 시 기존 JSONL 파일을 삭제한다.
  - `'0'`이면 기존 JSONL을 유지하고, 새 로그를 이어서 기록한다.

## 4. DB와 파일의 역할 분리

- DB(Persistence):
  - TickSnapshot, WorldEvent, EvolutionStats, ExperimentMetadata를 저장하는 **단일 진실 원천**.
  - MongoDB/Redis/InMemory 드라이버에 따라 스키마/키 패턴이 결정된다.
- `data/reports/*.jsonl`:
  - 동일 이벤트를 파일로 복제한 **보조 텔레메트리**.
  - 세션 단위의 디버깅/분석용이며, 자동 정리 대상이다.

## 5. 운영 가이드

- 디스크를 최소화하고 싶을 때:
  - `.env`에 `AETHERIUS_TELEMETRY_JSONL=0` 설정 → JSONL 자체를 쓰지 않음.
  - 또는 기본값 그대로 두고, `AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START=1`로 세션별 로그만 유지.
- 장기 파일 로그가 필요할 때:
  - `AETHERIUS_TELEMETRY_CLEAN_JSONL_ON_START=0`로 설정하여 재시작 시 삭제되지 않게 한다.

