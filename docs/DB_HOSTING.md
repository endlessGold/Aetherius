# 무료 DB 호스팅 안내 (API·연결 문자열)

Aetherius는 **DB 서버를 직접 호스팅하지 않습니다.**
아래 무료 호스팅 서비스를 사용해 계정·클러스터만 만들고, **연결 문자열(API)** 을 `.env`에 넣으면 앱이 해당 DB에 자동 연동됩니다.

---

## 1. MongoDB Atlas (권장)

- **무료**: M0 클러스터 (512MB, 제한 내 무료)
- **API**: 연결 문자열(URI)로 Node.js `mongodb` 드라이버 사용 (이미 프로젝트에 포함)

### 설정 절차

1. **가입·클러스터 생성**
   - [MongoDB Atlas](https://cloud.mongodb.com) 접속 → 로그인 후 **프로젝트** 선택 (조직·프로젝트가 비어 있으면 새 프로젝트 생성 가능)
   - **Build a Database** (또는 Create → Build a Database) → **M0 FREE** 선택 → Create
   - 리전 선택 후 **Create Cluster**

2. **DB 사용자 생성**
   - Security → Database Access → Add New Database User
   - Username / Password 설정 (나중에 URI에 넣음)

3. **네트워크 접근 허용**
   - Security → Network Access → Add IP Address
   - 개발: `0.0.0.0/0` (모든 IP) 또는 본인 IP 입력

4. **연결 문자열 복사**
   - Database → Connect → **Connect your application**
   - Driver: **Node.js**, 버전 선택 후 나오는 URI 복사
     예: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - `USER` / `PASS`를 2단계에서 만든 DB 사용자로 바꿈

5. **.env에 설정**

   ```env
   AETHERIUS_NOSQL_DRIVER=mongodb
   AETHERIUS_MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   AETHERIUS_MONGODB_DB=aetherius
   ```

이후 서버/CLI 실행 시 스냅샷·이벤트·진화 통계가 Atlas에 저장됩니다.

### CLI로 한 번에 설정 (WSL, OAuth 리다이렉트)

브라우저 대신 **Atlas CLI**로 클러스터·DB 사용자·IP 허용을 한 번에 수행할 수 있습니다.  
(최초 1회 `atlas auth login` 시 브라우저가 열려 OAuth 로그인합니다.)

1. **WSL에서 Atlas CLI 설치** (미설치 시)

   ```bash
   sudo apt-get install -y gnupg curl
   curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
   echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
   sudo apt-get update && sudo apt-get install -y mongodb-atlas-cli jq
   ```

2. **프로젝트 루트에서 설정 스크립트 실행**

   ```bash
   cd /mnt/f/Projects/Aetherius
   chmod +x tools/atlas_setup_wsl.sh
   ./tools/atlas_setup_wsl.sh
   ```

   - 첫 실행 시 `atlas auth login`으로 브라우저가 열리면 로그인(Google 등 OAuth) 후 완료.
   - 프로젝트가 없으면 **AetheriusDB** 프로젝트를 자동 생성한 뒤, **M0 클러스터 생성**, **DB 사용자 생성**, **0.0.0.0/0 IP 허용**, **연결 URI 생성**까지 수행합니다.
   - 생성된 URI와 DB 비밀번호가 출력되며, 가능하면 `.env` 끝에 자동 추가됩니다.

3. **환경 변수 (선택)**

   | 변수 | 설명 | 기본값 |
   |------|------|--------|
   | `ATLAS_ORG_ID` | 조직 ID | `699466161903a12c34b372f9` (DBOrganization) |
   | `ATLAS_PROJECT_ID` | 프로젝트 ID (비우면 org 내 첫 프로젝트 사용, 없으면 AetheriusDB 생성) | (없음) |
   | `ATLAS_PROJECT_NAME` | 프로젝트 없을 때 생성할 이름 | `AetheriusDB` |
   | `AETHERIUS_DB_USER` | DB 사용자 이름 | `aetherius` |
   | `AETHERIUS_DB_PASSWORD` | DB 비밀번호 (비우면 자동 생성 후 출력) | (자동 생성) |

   예: 기존 프로젝트 지정 후 실행

   ```bash
   ATLAS_PROJECT_ID=61234abc567890def123456 ./tools/atlas_setup_wsl.sh
   ```

4. **연동 검증**

   ```bash
   npm run experiment:db
   ```

### WSL에서 mongosh 설치 (npm, 글로벌)

Atlas 등 MongoDB에 터미널에서 접속하려면 **mongosh**(MongoDB Shell)가 필요합니다. **글로벌 설치**만 사용하며, 프로젝트 `package.json`에는 넣지 않습니다.

1. **전역 설치**

   ```bash
   npm install -g mongosh
   ```

2. **연결 예시** (Atlas SRV 주소·사용자·비밀번호는 본인 값으로)

   ```bash
   mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/" --apiVersion 1 --username YOUR_USER --password 'YOUR_PASS'
   ```

   비밀번호에 특수문자가 있으면 작은따옴표로 감싸세요.  
   설치 없이 한 번만 쓰려면: `npx mongosh "mongodb+srv://..." --username ... --password ...`

### WSL에서 연동 (브라우저 OAuth 로그인 후)

Atlas는 **계정이 필요**합니다. 이미 브라우저로 로그인(Google/GitHub 등 리다이렉트 OAuth)했다면 그 계정으로 아래만 진행하면 됩니다.

1. **브라우저에서 연결 문자열 복사**
   - Atlas 대시보드 → Database → Connect → **Connect your application**
   - URI 복사 (예: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/...`)
   - `USER`/`PASS`는 **Database Access**에서 만든 DB 사용자(비밀번호)로 넣은 값

2. **WSL 터미널에서 프로젝트로 이동 후 .env 설정**

   ```bash
   cd /mnt/f/Projects/Aetherius   # Windows 드라이브는 보통 /mnt/f/ 또는 /mnt/c/
   # .env가 없으면 .env.example 복사 후 편집
   cp -n .env.example .env 2>/dev/null || true
   nano .env   # 또는 code .env
   ```

   아래 세 줄을 추가하거나 기존 값을 바꿉니다 (URI는 본인 값으로).

   ```env
   AETHERIUS_NOSQL_DRIVER=mongodb
   AETHERIUS_MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   AETHERIUS_MONGODB_DB=aetherius
   ```

3. **WSL에서 연동 검증**

   ```bash
   npm run experiment:db
   ```

   성공 시 `✅ DB 호스팅 연동 정상. (driver=mongodb)` 가 나옵니다.  
   실패 시 Atlas에서 **Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)** 와 **Database Access** 사용자 비밀번호를 확인하세요.

---

## 2. Upstash Redis

- **무료**: 일일 요청/데이터 제한 내 무료
- **API**: Redis 프로토콜 URL 또는 REST API (이 프로젝트는 Redis URL 사용)

### 설정 절차

1. **가입·DB 생성**
   - https://upstash.com 접속 → Sign Up / Log In
   - Console → Create Database → 리전 선택 → Create

2. **연결 정보 복사**
   - 생성한 DB 클릭 → **Redis Connect** 또는 상세 페이지에서
   - **Redis URL** 복사 (형식: `rediss://default:비밀번호@호스트.upstash.io:6379`)

3. **.env에 설정**

   ```env
   AETHERIUS_NOSQL_DRIVER=redis
   AETHERIUS_REDIS_URL=rediss://default:YOUR_PASSWORD@xxx.upstash.io:6379
   ```

이후 서버/CLI 실행 시 Redis에 스냅샷·이벤트 등이 저장됩니다.

---

## 3. 로컬 기본값 (DB 호스팅 없음)

`.env`에 `AETHERIUS_NOSQL_DRIVER`를 넣지 않거나 `inmemory`로 두면:

- DB 서버 없이 **메모리**에만 저장
- 프로세스 종료 시 데이터 사라짐 (개발·테스트용)

```env
# 기본값
AETHERIUS_NOSQL_DRIVER=inmemory
```

---

## 4. 비밀 관리

연결 문자열에 **계정/비밀번호**가 포함되므로:

- `.env`는 **커밋하지 말 것** (이미 .gitignore 대상)
- 팀·배포용은 [Aetherius-Secrets](SECRETS_REF.md) 또는 배포 환경의 시크릿에 아래 변수만 넣어 두고, 실행 시 주입

| 변수 | 용도 |
|------|------|
| `AETHERIUS_NOSQL_DRIVER` | `inmemory` \| `mongodb` \| `redis` |
| `AETHERIUS_MONGODB_URI` | MongoDB 연결 문자열 (Atlas 사용 시) |
| `AETHERIUS_MONGODB_DB` | 사용할 DB 이름 (기본 `aetherius`) |
| `AETHERIUS_REDIS_URL` | Redis 연결 URL (Upstash 사용 시) |

---

## 요약

| 방식 | 설정 | 비고 |
|------|------|------|
| **호스팅 없음** | `AETHERIUS_NOSQL_DRIVER=inmemory` (또는 미설정) | 로컬 메모리만 |
| **MongoDB Atlas** | 위 1번 절차 후 URI를 `.env`에 설정 | 무료 M0, 연결 문자열 = API 연동 |
| **Upstash Redis** | 위 2번 절차 후 Redis URL을 `.env`에 설정 | 무료 티어, URL = API 연동 |

“호스팅”은 **Atlas/Upstash에서 클러스터·DB를 만든 뒤**, 이 프로젝트에는 **연결 정보만 .env로 넣어 연동**하는 방식입니다.

### 호스팅 연동 검증

연결 정보를 넣은 뒤 다음 명령으로 정상 연동 여부를 확인한다.

```bash
npm run experiment:db
```

- 성공 시: `✅ DB 호스팅 연동 정상. (driver=...)` 출력 후 종료 코드 0
- 실패 시: 연결 오류 메시지와 함께 종료 코드 1 (URI/URL·네트워크·Atlas IP 화이트리스트 확인)

### Vercel 배포 시 DB 연동

백엔드를 Vercel Serverless Functions(`/api/*`)로 둘 때, MongoDB Atlas를 DB 서버로 쓰려면 Vercel 프로젝트에 다음 환경 변수를 넣는다.

1. **Vercel 대시보드** → 프로젝트 선택 → **Settings** → **Environment Variables**
2. 아래 변수 추가. `AETHERIUS_MONGODB_URI`는 **Sensitive**로 표시해 Secrets에 저장하는 것을 권장한다.

| 변수 | 값 | 비고 |
|------|-----|------|
| `AETHERIUS_NOSQL_DRIVER` | `mongodb` | Atlas 사용 시 |
| `AETHERIUS_MONGODB_URI` | Atlas 연결 문자열 (위 1번 절차에서 복사한 URI) | Secrets 권장 |
| `AETHERIUS_MONGODB_DB` | `aetherius` (또는 사용할 DB 이름) | 선택, 기본 `aetherius` |

3. 저장 후 **Redeploy** 하면, Serverless 인스턴스에서 `World`가 생성될 때 `createPersistenceFromEnv()`가 MongoDB를 사용한다. `/api/tick`, `/api/command` 등 호출 시 스냅샷·이벤트가 Atlas에 기록된다.

**동작 요약**

- Serverless 인스턴스가 바뀌어도 **스냅샷·이벤트·진화 통계는 Atlas에 영구 저장**된다.
- 인메모리 월드 상태(엔티티, tick 수 등)는 **요청/인스턴스마다 초기화**될 수 있다. 콜드스타트 시 `World`가 새로 만들어지므로, “이어하기”가 필요하면 추후 “최신 스냅샷 로드 후 World 복원” 단계를 별도 구현해야 한다.

**Vercel + DB 검증 체크리스트**

1. Vercel 프로젝트에 `AETHERIUS_NOSQL_DRIVER=mongodb`, `AETHERIUS_MONGODB_URI`, `AETHERIUS_MONGODB_DB` 설정 후 Redeploy.
2. 로그인: `POST /api/login`으로 Bearer 토큰 발급.
3. Tick 호출: `POST /api/tick` body `{ "count": 1 }`, Header `Authorization: Bearer <token>`.
4. MongoDB Atlas 대시보드에서 해당 DB의 `snapshots`, `world_events` 컬렉션에 문서가 증가했는지 확인.

위 단계가 모두 통과하면 Vercel 백엔드와 DB 서버 연동이 정상 동작하는 것이다.

### 웹 API로 DB 호스팅 업로드

서버 모드(`npm run start:server`) 실행 후, 설정된 persistence(Atlas/Redis)에 HTTP로 데이터를 올릴 수 있다.

- **POST /api/snapshots** — body에 `TickSnapshot` JSON 전송 시 DB에 스냅샷 저장.
- **POST /api/events** — body에 `WorldEventPayload` JSON 전송 시 DB에 이벤트 저장.

요청 형식은 [DB_PLAN.md](DB_PLAN.md) §4 참고.

### IDE AI 협업용 Atlas 초대 (선택)

Cursor 등 IDE의 AI와 협업 편의를 위해 Atlas 프로젝트에 에이전트 이메일을 초대할 수 있다.

- **초대 시**: Atlas 대시보드 → Project Settings → **Access Manager** (또는 Organization → Invite User)에서 해당 이메일 초대.
- **역할 권장**: **Read Only** 또는 **Data Access Read Only** 등 최소 권한으로 부여해, 클러스터/연결 정보 조회만 가능하게 두는 것을 권장한다.
- 앱의 DB 연결(연결 문자열)은 `.env`로만 하면 되며, 초대와 무관하다.
