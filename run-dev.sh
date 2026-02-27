#!/bin/bash

# ZeroTime Office App v1 - Local Development Setup Script
# 백오피스 로컬 개발 환경 세팅 및 실행 스크립트

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}ZeroTime Office App v1 - Development Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Node.js 버전 확인
echo -e "${YELLOW}[1/4] Node.js 버전 확인 중...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js가 설치되지 않았습니다${NC}"
    echo -e "${YELLOW}Node.js를 설치해주세요: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 버전: ${NODE_VERSION}${NC}"

# 2. 의존성 확인 및 설치
echo -e "\n${YELLOW}[2/4] 의존성 확인 중...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}node_modules가 없습니다. 의존성을 설치합니다...${NC}"
    npm install
    echo -e "${GREEN}✓ 의존성 설치 완료${NC}"
else
    # package.json이 변경되었는지 확인
    if [ "package.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}package.json이 변경되었습니다. 의존성을 업데이트합니다...${NC}"
        npm install
        echo -e "${GREEN}✓ 의존성 업데이트 완료${NC}"
    else
        echo -e "${GREEN}✓ 의존성이 이미 설치되어 있습니다${NC}"
    fi
fi

# 3. 환경 변수 설정
echo -e "\n${YELLOW}[3/4] 환경 변수 확인 중...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}.env.local 파일이 없습니다. 기본값으로 생성합니다...${NC}"
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF
    echo -e "${GREEN}✓ .env.local 파일 생성 완료 (API: http://localhost:8080)${NC}"
else
    echo -e "${GREEN}✓ .env.local 파일이 이미 존재합니다${NC}"
fi

# 환경 변수 출력
if [ -f ".env.local" ]; then
    echo -e "\n${BLUE}현재 환경 변수 설정:${NC}"
    while IFS= read -r line; do
        if [[ ! -z "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
            echo -e "${GREEN}  • ${line}${NC}"
        fi
    done < .env.local
fi

# 4. 백엔드 API 서버 확인
echo -e "\n${YELLOW}[4/4] 백엔드 API 서버 확인 중...${NC}"

# .env.local에서 API URL 추출 (따옴표 제거)
API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.local | cut -d'=' -f2 | tr -d '"')

if [ -z "$API_URL" ]; then
    API_URL="http://localhost:8080"
fi

# API 서버 health check
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ 백엔드 API 서버가 실행 중입니다 (${API_URL})${NC}"
else
    echo -e "${YELLOW}⚠ 백엔드 API 서버에 연결할 수 없습니다 (${API_URL})${NC}"
    echo -e "${YELLOW}⚠ 백엔드 서버를 먼저 실행해주세요:${NC}"
    echo -e "${YELLOW}   cd ../jbnu-alarm-api-v1 && ./run-dev.sh${NC}\n"

    read -p "API 없이 계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}개발 서버 시작을 취소합니다${NC}"
        exit 1
    fi
fi

# 개발 서버 실행
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 모든 설정이 완료되었습니다!${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "${GREEN}백오피스 서버 주소: http://localhost:3002${NC}"
echo -e "${GREEN}백엔드 API 서버: ${API_URL}${NC}\n"
echo -e "${YELLOW}서버를 중지하려면 Ctrl+C를 누르세요${NC}\n"

# Next.js 개발 서버 실행 (포트 3002)
npm run dev
