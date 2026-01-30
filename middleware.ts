import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    // 인증이 필요 없는 경로
    const publicPaths = ['/', '/auth/callback'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    // 로그인 페이지나 콜백 페이지는 통과
    if (isPublicPath) {
        return NextResponse.next();
    }

    // localStorage를 사용하므로 클라이언트 사이드에서 체크
    // 미들웨어에서는 쿠키가 없으면 로그인 페이지로 리다이렉트
    // (실제로는 클라이언트 컴포넌트에서 localStorage 체크)

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
