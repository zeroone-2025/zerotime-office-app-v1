# 제로타임 백오피스 (ZeroTime Backoffice)

**전북대학교 공지사항 알림 서비스 (JBNU Alarm) 관리자 대시보드**

이 프로젝트는 `jbnu-alarm-api-v1` 백엔드 서버와 연동하여 사용자 관리, 공지사항 관리, 시스템 모니터링을 수행하는 Next.js 기반의 관리자 웹 애플리케이션입니다.

## 🚀 주요 기능

### 1. 📊 대시보드 (Dashboard)
- 전체 사용자 수, 읽은 공지 수, 즐겨찾기 수 등 핵심 지표 시각화
- 주간/월간 활성 사용자 차트 (Recharts 활용)

### 2. 👥 사용자 관리 (User Management)
- 전체 가입 사용자 목록 조회 및 검색
- 사용자 상세 정보 조회 (프로필, 소속 학과, 구독 키워드 등)
- 사용자 활동 로그 확인 (읽은 공지, 즐겨찾기 내역)
- **권한 관리**: 일반 사용자, 관리자, 최고 관리자(super_admin) 권한 부여

### 3. 📢 공지사항 관리 (Notice Management)
- 수집된 공지사항 전체 목록 조회
- 게시판별 필터링 및 키워드 검색
- **공지 삭제**: 관리자 권한을 통한 공지 삭제 (Shadcn UI 삭제 확인 모달 적용)

### 4. 🔐 인증 및 보안 (Authentication)
- **Google OAuth 2.0** 기반 소셜 로그인
- JWT 토큰 기반 인증 및 미들웨어를 통한 접근 제어
- `super_admin` 등 Role 기반 페이지 접근 제한

### 5. 🎨 브랜딩 및 UI
- **ZeroTime** 공식 브랜딩 적용 (로고, 심볼, 파비콘)
- **Shadcn UI** & **Tailwind CSS v4** 기반의 모던하고 일관된 디자인
- 반응형 사이드바 및 레이아웃

## 🛠 기술 스택 (Tech Stack)

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (@radix-ui)
- **Icons**: Lucide React
- **Data Fetching**: Axios
- **State Management**: React Hooks (Context API 불필요시 최소화)
- **Charts**: Recharts
- **Date Handling**: date-fns

## 🏁 시작하기 (Getting Started)

### 1. 환경 변수 설정 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요.

```env
# 백엔드 API 주소
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth 클라이언트 ID (Firebase 또는 GCP 콘솔)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 2. 패키지 설치

```bash
npm install
# or
yarn install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

## 📂 프로젝트 구조

```
zerotime-office-app-v1/
├── app/
│   ├── _components/    # 전역 컴포넌트 (Sidebar 등)
│   ├── dashboard/      # 대시보드 페이지
│   ├── notices/        # 공지 관리 페이지
│   ├── users/          # 사용자 관리 페이지
│   ├── auth/           # 인증 콜백 처리
│   ├── layout.tsx      # 루트 레이아웃
│   └── page.tsx        # 로그인 페이지
├── components/
│   └── ui/             # Shadcn UI 컴포넌트
├── lib/
│   ├── api.ts          # Axios API 클라이언트 및 타입 정의
│   ├── auth.ts         # 인증 유틸리티 (쿠키 관리)
│   ├── constants.ts    # 상수 데이터 (게시판 이름 매핑 등)
│   └── utils.ts        # Tailwind 유틸리티
└── public/             # 정적 리소스
```

## 🤝 기여하기 (Contributing)

이 프로젝트는 ZeroTime 팀 내부용으로 개발되었습니다. 버그 제보 및 기능 제안은 이슈를 이용해 주세요.
