# 계정 및 역할 모델 (Account & Role Model)

이 문서는 Aetherius 엔진에서 사용하는 **계정(Account)·역할(Role)** 모델을 정의합니다.  
모든 플레이어, NPC, LLM, 최고권한시스템은 예외 없이 **계정과 역할**을 가집니다.

## 1. 기본 원칙

- **신은 시스템이다**  
  - 이 게임에서 “신”이라는 개념은 곧 **최고권한시스템(Highest Privilege System)**입니다.
  - 코드에서는 해당 영어 표현과 `신` 같은 의미의 이름을 사용하지 않고, `System`, `HighestPrivilegeSystem` 등으로 표기합니다.
- **모든 행동 주체는 계정 단위**  
  - 사람 플레이어, NPC, LLM, 최고권한시스템 모두 계정을 통해 행동합니다.
  - 계정은 최소한 `id`, `username`, `roles`를 갖습니다.
- **역할 기반 권한**  
  - CLI 명령과 시스템 기능은 **역할(Role)**에 의해 허용/제한됩니다.
  - 하나의 계정은 여러 역할을 동시에 가질 수 있습니다.

## 2. 계정 유형

### 2.1 사람 플레이어 (Human Player)

- 예: 일반 유저, 개발자
- 공통 필드:
  - `username`: 로그인 ID
  - `roles`: `["player"]` 또는 `["player", "developer"]` 등
- 특징:
  - CLI/웹 콘솔에서 직접 명령을 입력합니다.

### 2.2 NPC 계정 (NPC Account)

- 예: 마을 주민, 상인, 몬스터, 드론의 “소유자”
- 공통 필드:
  - `username`: `npc_<id>` 형태 권장
  - `roles`: 최소 `["npc"]`
- 특징:
  - 직접 CLI에 명령을 입력하지 않고, 내부 시스템·AI에 의해 행동이 생성됩니다.
  - 로그/트레이싱 시 “누가 이 행동을 유발했는가?”를 계정 단위로 추적할 수 있습니다.

### 2.3 LLM 계정 (LLM Account)

- 예: `ask_science`에 응답하는 과학자 위원회, Auto 오케스트레이터
- 공통 필드:
  - `username`: `llm_science`, `llm_orchestrator` 등
  - `roles`: `["llm"]` + 필요한 경우 `["llm", "system"]`
- 특징:
  - 외부 LLM 호출을 래핑하는 내부 어댑터가 이 계정으로 행동합니다.
  - 어떤 LLM이 어떤 권한으로 세계에 개입했는지 추적 가능합니다.

### 2.4 최고권한시스템 계정 (Highest Privilege System)

- 예: Auto 개입 시스템, 월드 생성/삭제, 긴급 복구용 시스템
- 공통 필드:
  - `username`: `system_root`, `system_auto`, `system_world_admin` 등
  - `roles`: 반드시 `["system"]` 포함 (필요 시 추가 역할 병행)
- 특징:
  - 최상위 권한을 갖는 시스템.  
  - 기존 코드의 `AutoGodSystem`, `DivineSystem` 같은 개념은, 계정/역할 차원에서는 **최고권한시스템**으로 해석됩니다.

## 3. 역할(Role) 정의

역할은 계정이 어떤 명령/기능을 사용할 수 있는지를 결정합니다.

### 3.1 공통 역할 목록

- `player`: 기본 사람 플레이어
- `developer`: 개발자 모드 권한
- `npc`: 비플레이어 캐릭터
- `llm`: LLM 기반 에이전트
- `system`: 최고권한시스템

### 3.2 역할별 권한(개념)

구체적인 권한 매핑은 추후 명령 핸들러에서 세분화하지만, 개념적으로는 다음을 가정합니다.

- `player`
  - 대부분의 관찰/탐험/일반 상호작용 명령 허용
- `developer`
  - 디버그/진단/강제 개입용 명령 허용 (예: 숨겨진 상태 조회, 실험용 명령)
- `npc`
  - 스스로 CLI를 사용하지 않지만, 내부 시스템이 해당 계정으로 행동을 기록
- `llm`
  - `ask_science` 응답, AI 이벤트 오케스트레이션 관련 명령/행동
- `system`
  - 월드 생성/삭제, 전역 환경 강제 변경, 긴급 롤백 등 최상위 수준의 명령

## 4. 인증 토큰 구조 (초기 설계)

현재 JWT 페이로드는 `sub`만 포함합니다. 계정/역할 모델을 위해 다음을 권장합니다.

```json
{
  "sub": "admin",          // username (또는 계정 ID)
  "roles": ["player"],     // 계정에 부여된 역할
  "meta": {
    "displayName": "Admin User"
  }
}
```

### 4.1 계정/역할 부여 전략

- 초기 단계:
  - 환경 변수 기반 단일 계정(`admin`)에 대해 `roles: ["player","developer","system"]`을 부여해도 됩니다.
- 확장 단계:
  - 별도 계정 저장소(파일/DB)를 두고, username-password-roles를 관리합니다.
  - NPC/LLM/시스템 계정은 비밀번호 없이 내부적으로만 사용해도 됩니다.

## 5. 개발자 계정 및 개발 모드 승격

### 5.1 개발자 계정 개념

- 개발자 계정은 최소 `developer` 역할을 가진 계정입니다.
- 예: `username = dev`, `roles = ["player", "developer"]`
- JWT 페이로드 예:
  ```json
  {
    "sub": "dev",
    "roles": ["player", "developer"]
  }
  ```

### 5.2 일반 모드 → 개발 모드 승격

- 일반 로그인 흐름은 동일하지만, **계정의 역할에 따라 모드가 승격**됩니다.
- 기본 규칙:
  - `roles`에 `developer`가 포함된 계정으로 로그인하면:
    - CLI 프롬프트에 개발 모드 표시:
      - 예: `Dev Divine>` 또는 `Divine (dev)>`
    - 추가 디버그/개발용 명령이 노출될 수 있습니다.
  - `roles`에 `system`이 포함된 계정으로 로그인하면:
    - 최고권한시스템 모드로 간주됩니다.

### 5.3 구현 방향 (요약)

- `api/_auth.js`
  - `issueToken(subject, roles)` 형태로 확장하여 역할 정보를 토큰에 포함합니다.
  - 이후 `verifyRequest`에서 `subject`뿐 아니라 `roles`도 반환합니다.
- `api/login.js`
  - `username`에 따라 정해진 역할 집합을 부여합니다.
  - 예:
    - `admin` → `["player","developer","system"]`
    - `dev` → `["player","developer"]`
    - 일반 유저 → `["player"]`
- CLI/서버 측
  - JWT에서 roles를 읽어 현재 세션 모드(일반/개발/최고권한시스템)를 결정합니다.

이 설계를 기반으로, 이후 NPC/LLM/최고권한시스템에 대한 계정 생성과 권한 제어를 점진적으로 코드에 반영할 수 있습니다.
