# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZeroTime Office App은 JBNU Alarm 서비스의 관리자 대시보드입니다. Next.js 16 기반으로 사용자 관리, 공지사항 관리, 시스템 모니터링을 수행합니다.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## Backend Dependency

백엔드 API 서버(`http://localhost:8000`)가 필요합니다. `NEXT_PUBLIC_API_URL` 환경변수로 설정.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn UI (@radix-ui)
- **Icons**: Lucide React
- **Data Fetching**: Axios
- **Charts**: Recharts

### Project Structure
```
app/
├── _components/    # 전역 컴포넌트 (Sidebar 등)
├── dashboard/      # 대시보드 페이지
├── notices/        # 공지 관리 페이지
├── users/          # 사용자 관리 페이지
├── auth/           # 인증 콜백 처리
├── layout.tsx      # 루트 레이아웃
└── page.tsx        # 로그인 페이지
components/ui/      # Shadcn UI 컴포넌트
lib/
├── api.ts          # Axios API 클라이언트 및 타입 정의
├── auth.ts         # 인증 유틸리티 (쿠키 관리)
├── constants.ts    # 상수 데이터
└── utils.ts        # Tailwind 유틸리티
```

### Authentication
- Google OAuth 2.0 기반 소셜 로그인
- JWT 토큰 인증 + 미들웨어 접근 제어
- `super_admin` Role 기반 페이지 접근 제한

## Git Conventions

### Commit Message Format

```
<type>(<scope>): <설명>

# 관련 이슈가 있으면 본문 또는 footer에 참조
Refs #이슈번호
```

**타입 (필수)**:
| 타입 | 용도 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷팅 (비즈니스 로직 변경 없음) |
| `refactor` | 코드 리팩토링 (기능 변화 없음) |
| `perf` | 성능 개선 |
| `test` | 테스트 코드 추가/수정 |
| `build` | 빌드 설정, 의존성 수정 |
| `chore` | 잡일, 설정 파일 등 |
| `ci` | CI/CD 파이프라인 변경 |

**스코프 (선택)**: `auth`, `dashboard`, `users`, `notices`, `ui`, `config` 등

**예시**:
```
feat(dashboard): 주간 활성 사용자 차트 추가
fix(auth): super_admin 권한 체크 누락 수정
refactor(notices): 공지 목록 필터링 로직 분리
```

### Branch Naming

```
<type>/#<이슈번호>-<짧은설명>
```

**타입**: `feature/`, `fix/`, `hotfix/`, `refactor/`, `docs/`

**예시**:
```
feature/#12-user-detail-page
fix/#45-dashboard-chart-error
hotfix/#99-auth-middleware
```

### Epic Branch 전략 (연관 이슈 묶음)

하나의 큰 기능이 여러 이슈로 나뉠 때, Epic 브랜치를 사용한다.

```
dev (기본 브랜치)
 └── feature/#10-social-login          ← Epic 브랜치 (dev에서 분기)
      ├── feature/#10-login-ui         ← Epic에서 분기, 완료 후 Epic으로 머지
      ├── feature/#11-login-api        ← Epic에서 분기, 완료 후 Epic으로 머지
      └── feature/#12-login-token      ← Epic에서 분기, 완료 후 Epic으로 머지
```

**규칙**:
1. Epic 브랜치는 `dev`에서 분기하고, 대표 이슈 번호를 사용한다
2. 하위 브랜치들은 Epic 브랜치에서 분기하고, 완료 후 Epic으로 PR/머지한다
3. 모든 하위 작업이 완료되면 Epic 브랜치를 `dev`로 PR한다
4. 이슈가 2개 이하로 밀접하게 연관되면, 하나의 브랜치에서 커밋 메시지로 이슈를 구분해도 된다

### AI 커밋/브랜치 자동 판단 규칙

Claude가 커밋 또는 브랜치를 생성할 때:
1. 변경 내용을 분석하여 적절한 커밋 타입을 자동 선택한다
2. 변경된 모듈에 따라 scope를 자동 부여한다
3. 브랜치 생성 시 이슈 번호가 제공되면 네이밍 규칙을 따른다
4. 커밋 메시지는 한글로 작성하되, 타입과 스코프는 영문으로 한다
5. **반드시 위 컨벤션을 따르며, 규칙에 맞지 않는 커밋/브랜치를 만들지 않는다**
