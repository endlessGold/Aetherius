# Aetherius-Secrets 연동

API 키·비밀은 **Aetherius-Secrets** 저장소에서 관리하며, 개발모드에서만 사용한다.

- 저장소: https://github.com/endlessGold/Aetherius-Secrets
- 이 프로젝트의 `.env`는 커밋하지 않는다. 값은 위 저장소 또는 로컬 `.env`에만 둔다.

## Aetherius-Secrets에 올릴 항목

다음 항목을 Secrets 저장소에 보관하고, 필요 시 로컬 `.env`로 복사해 사용한다.

| 변수명 | 용도 |
|--------|------|
| `GEMINI_API_KEY` | Gemini API (AI 기능: ask_science, auto_god, ai_events) |
| `AETHERIUS_AUTH_SECRET` | JWT 서명 (배포 시) |
| `AETHERIUS_AUTH_USERNAME` / `AETHERIUS_AUTH_PASSWORD` | API 인증 (배포 시) |
| `AETHERIUS_NOSQL_DRIVER` | DB 드라이버: `inmemory` \| `mongodb` \| `redis` |
| `AETHERIUS_MONGODB_URI` | MongoDB 연결 문자열 (무료: [MongoDB Atlas](https://www.mongodb.com/atlas)) |
| `AETHERIUS_MONGODB_DB` | MongoDB DB 이름 (기본 `aetherius`) |
| `AETHERIUS_REDIS_URL` | Redis 연결 URL (무료: [Upstash](https://upstash.com)) |

상세 설정은 [무료 DB 호스팅 안내](DB_HOSTING.md) 참고.

## 업로드 방법 (Aetherius-Secrets에 반영)

1. https://github.com/endlessGold/Aetherius-Secrets 저장소를 클론한다.
2. 해당 저장소 루트에 `.env` 또는 `env.aetherius` 파일을 만들고, 위 변수들을 `KEY=value` 형식으로 넣는다.
   - 이 프로젝트 로컬 `.env`에 이미 넣어 둔 값(예: `GEMINI_API_KEY`)을 그대로 복사해 붙여넣으면 된다.
3. (선택) 팀원은 Secrets 저장소 클론 후 해당 파일을 Aetherius 프로젝트 루트 `.env`로 복사하거나, 동기화 스크립트로 적용한다.

이 프로젝트 루트의 `.env.example`은 변수 목록만 있으며, 실제 값은 넣지 않는다.
