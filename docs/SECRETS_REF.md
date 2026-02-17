# Aetherius-Secrets 연동

API 키·비밀은 **Aetherius-Secrets** 저장소에서 관리하며, 개발모드에서만 사용한다.

- 저장소: https://github.com/endlessGold/Aetherius-Secrets  
- 이 프로젝트의 `.env`는 커밋하지 않는다. 값은 위 저장소 또는 로컬 `.env`에만 둔다.

## Aetherius-Secrets에 올릴 항목

다음 항목을 Secrets 저장소에 보관하고, 필요 시 로컬 `.env`로 복사해 사용한다.

| 변수명 | 용도 |
|--------|------|
| `GEMINI_API_KEY` | Gemini API (개발·AI 기능) |
| `AETHERIUS_LLM_API_KEY` | LLM API (선택) |
| `AETHERIUS_LLM_BASE_URL` | LLM 엔드포인트 (선택) |
| `AETHERIUS_AUTH_SECRET` | JWT 서명 (배포 시) |
| `AETHERIUS_AUTH_USERNAME` / `AETHERIUS_AUTH_PASSWORD` | API 인증 (배포 시) |

## 업로드 방법 (Aetherius-Secrets에 반영)

1. https://github.com/endlessGold/Aetherius-Secrets 저장소를 클론한다.
2. 해당 저장소 루트에 `.env` 또는 `env.aetherius` 파일을 만들고, 위 변수들을 `KEY=value` 형식으로 넣는다.
   - 이 프로젝트 로컬 `.env`에 이미 넣어 둔 값(예: `GEMINI_API_KEY`)을 그대로 복사해 붙여넣으면 된다.
3. (선택) 팀원은 Secrets 저장소 클론 후 해당 파일을 Aetherius 프로젝트 루트 `.env`로 복사하거나, 동기화 스크립트로 적용한다.

이 프로젝트 루트의 `.env.example`은 변수 목록만 있으며, 실제 값은 넣지 않는다.
