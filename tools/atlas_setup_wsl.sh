#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# WSL에서 Atlas CLI로 MongoDB Atlas M0 클러스터 + DB 사용자 + IP 허용 한 번에 설정
# - OAuth 로그인: atlas auth login 시 브라우저 리다이렉트
# - 조직 ID(필수), 프로젝트 ID(없으면 첫 프로젝트 사용), DB 비밀번호(없으면 자동 생성)
#
# 사용 (WSL):
#   cd /mnt/f/Projects/Aetherius
#   chmod +x tools/atlas_setup_wsl.sh
#   ./tools/atlas_setup_wsl.sh
#
# 환경 변수 (선택):
#   ATLAS_ORG_ID          조직 ID (기본: DBOrganization 쪽 org)
#   ATLAS_PROJECT_ID      프로젝트 ID (없으면 org 내 첫 프로젝트 사용)
#   AETHERIUS_DB_USER    DB 사용자 이름 (기본: aetherius)
#   AETHERIUS_DB_PASSWORD DB 비밀번호 (없으면 openssl로 생성 후 출력)
# -----------------------------------------------------------------------------
set -e

ATLAS_ORG_ID="${ATLAS_ORG_ID:-699466161903a12c34b372f9}"
CLUSTER_NAME="${ATLAS_CLUSTER_NAME:-aetherius-cluster}"
DB_USER="${AETHERIUS_DB_USER:-aetherius}"
PROJECT_ID="${ATLAS_PROJECT_ID:-}"

echo "🔌 Atlas CLI로 MongoDB Atlas 설정 (WSL)"
echo "   조직 ID: $ATLAS_ORG_ID"
echo ""

# 1) Atlas CLI 존재 확인
if ! command -v atlas &>/dev/null; then
  echo "❌ 'atlas' 명령을 찾을 수 없습니다. WSL에서 Atlas CLI를 설치하세요:"
  echo ""
  echo "   sudo apt-get install -y gnupg curl"
  echo "   curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor"
  echo "   echo \"deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse\" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list"
  echo "   sudo apt-get update && sudo apt-get install -y mongodb-atlas-cli"
  echo ""
  echo "   또는: https://www.mongodb.com/docs/atlas/cli/current/install-atlas-cli/"
  exit 1
fi

# 2) 로그인(한 번만, 브라우저 OAuth 리다이렉트)
echo "📌 Atlas 로그인 확인 (미로그인 시 브라우저가 열립니다)..."
if ! atlas auth whoami &>/dev/null; then
  echo "   atlas auth login 실행 중..."
  atlas auth login
fi
echo "   로그인됨."
echo ""

# 3) 프로젝트 ID (없으면 자동 생성)
PROJECT_NAME="${ATLAS_PROJECT_NAME:-AetheriusDB}"
if [ -z "$PROJECT_ID" ]; then
  echo "📌 조직 내 프로젝트 확인 중..."
  if ! command -v jq &>/dev/null; then
    echo "   jq가 필요합니다: sudo apt-get install -y jq"
    exit 1
  fi
  PROJECT_ID=$(atlas projects list --orgId "$ATLAS_ORG_ID" -o json | jq -r '.results[0].id // empty')
  if [ -z "$PROJECT_ID" ]; then
    echo "   프로젝트 없음 → '$PROJECT_NAME' 프로젝트 생성 중..."
    PROJECT_ID=$(atlas projects create "$PROJECT_NAME" --orgId "$ATLAS_ORG_ID" -o json | jq -r '.id // empty')
    if [ -z "$PROJECT_ID" ]; then
      echo "❌ 프로젝트 생성에 실패했습니다. Atlas 대시보드에서 수동으로 프로젝트를 만든 뒤 ATLAS_PROJECT_ID를 지정해 다시 실행하세요."
      exit 1
    fi
    echo "   생성된 프로젝트 ID: $PROJECT_ID"
  else
    echo "   사용할 프로젝트 ID: $PROJECT_ID"
  fi
else
  echo "   사용할 프로젝트 ID: $PROJECT_ID"
fi
echo ""

# 4) DB 비밀번호
if [ -n "$AETHERIUS_DB_PASSWORD" ]; then
  DB_PASS="$AETHERIUS_DB_PASSWORD"
  echo "📌 DB 비밀번호: (환경 변수 사용)"
else
  DB_PASS=$(openssl rand -base64 12 | tr -d /=+ | head -c 16)
  echo "📌 DB 비밀번호(자동 생성). 아래 값을 .env의 AETHERIUS_MONGODB_URI에 넣으세요:"
  echo "   $DB_PASS"
fi
echo ""

# 5) M0 클러스터 생성 (이미 있으면 스킵)
echo "📌 클러스터 '$CLUSTER_NAME' 확인/생성 중..."
if atlas clusters describe "$CLUSTER_NAME" --projectId "$PROJECT_ID" &>/dev/null; then
  echo "   이미 존재함. 스킵."
else
  atlas clusters create "$CLUSTER_NAME" \
    --projectId "$PROJECT_ID" \
    --provider AWS \
    --region US_EAST_1 \
    --tier M0 \
    --watch
  echo "   생성 완료."
fi
echo ""

# 6) DB 사용자 생성 (이미 있으면 실패할 수 있음 → 스킵 처리)
echo "📌 DB 사용자 '$DB_USER' 확인/생성 중..."
if atlas dbusers describe "$DB_USER" --projectId "$PROJECT_ID" &>/dev/null; then
  echo "   이미 존재함. 비밀번호 변경은 Atlas 대시보드에서 하세요."
else
  atlas dbusers create readWriteAnyDatabase \
    --username "$DB_USER" \
    --password "$DB_PASS" \
    --projectId "$PROJECT_ID"
  echo "   생성 완료."
fi
echo ""

# 7) IP 허용 (0.0.0.0/0)
echo "📌 IP 접근 목록에 0.0.0.0/0 추가 중..."
if atlas accesslists list --projectId "$PROJECT_ID" -o json 2>/dev/null | jq -e '.results[] | select(.cidrBlock == "0.0.0.0/0")' &>/dev/null; then
  echo "   이미 있음. 스킵."
else
  atlas accesslists create 0.0.0.0/0 --type cidrBlock --projectId "$PROJECT_ID" || true
  echo "   추가 완료."
fi
echo ""

# 8) 연결 문자열 조회
echo "📌 연결 문자열 조회 중..."
CONN_JSON=$(atlas clusters connectionStrings describe "$CLUSTER_NAME" --projectId "$PROJECT_ID" -o json 2>/dev/null || true)
if [ -z "$CONN_JSON" ]; then
  echo "   클러스터가 아직 준비 중일 수 있습니다. 1–2분 후 아래를 수동 실행:"
  echo "   atlas clusters connectionStrings describe $CLUSTER_NAME --projectId $PROJECT_ID -o json"
  echo ""
  echo "   아래 .env 값만 먼저 적용하세요 (URI는 대시보드 Connect에서 복사):"
else
  SRV=$(echo "$CONN_JSON" | jq -r '.standardSrv // .connectionStrings.standardSrv // empty')
  if [ -z "$SRV" ]; then
    SRV=$(echo "$CONN_JSON" | jq -r '.[] | select(.type == "STANDARD") | .srvAddress // empty' 2>/dev/null || true)
  fi
  if [ -n "$SRV" ]; then
    # mongodb+srv://host → mongodb+srv://user:pass@host
    if [[ "$SRV" =~ ^mongodb\+srv://(.+)$ ]]; then
      HOST="${BASH_REMATCH[1]}"
      # 비밀번호에 특수문자 있을 수 있으므로 URL 인코딩 (간단히 유지)
      PASS_ESC=$(printf '%s' "$DB_PASS" | jq -sRr @uri)
      USER_ESC=$(printf '%s' "$DB_USER" | jq -sRr @uri)
      FULL_URI="mongodb+srv://${USER_ESC}:${PASS_ESC}@${HOST}"
      echo "   URI 생성됨 (비밀번호 포함)."
      echo ""
      echo "--- .env에 넣을 내용 (프로젝트 루트) ---"
      echo "AETHERIUS_NOSQL_DRIVER=mongodb"
      echo "AETHERIUS_MONGODB_URI=$FULL_URI"
      echo "AETHERIUS_MONGODB_DB=aetherius"
      echo "---"
      echo ""
      ENV_FILE="${ENV_FILE:-.env}"
      if [ -f "$ENV_FILE" ]; then
        if grep -q "AETHERIUS_MONGODB_URI=" "$ENV_FILE" 2>/dev/null; then
          echo "   기존 $ENV_FILE 에 AETHERIUS_MONGODB_URI가 있습니다. 위 값을 수동으로 반영하세요."
        else
          echo "AETHERIUS_NOSQL_DRIVER=mongodb" >> "$ENV_FILE"
          echo "AETHERIUS_MONGODB_URI=$FULL_URI" >> "$ENV_FILE"
          echo "AETHERIUS_MONGODB_DB=aetherius" >> "$ENV_FILE"
          echo "   위 세 줄을 $ENV_FILE 끝에 추가했습니다."
        fi
      else
        echo "   $ENV_FILE 이 없어 추가하지 않았습니다. 위 블록을 복사해 .env를 만드세요."
      fi
  else
    echo "   standardSrv를 찾지 못했습니다. 출력: $CONN_JSON"
    echo "   Atlas 대시보드 → Connect → Connect your application 에서 URI를 복사한 뒤"
    echo "   USER/PASS를 $DB_USER / (위에 출력된 비밀번호) 로 바꿔 .env에 넣으세요."
  fi
fi

echo ""
echo "✅ Atlas 설정 완료. 연동 검증: npm run experiment:db"
