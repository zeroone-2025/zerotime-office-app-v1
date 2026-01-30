'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const processedRef = useRef(false);
    const [status, setStatus] = useState('로그인 처리 중...');

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const accessToken = searchParams.get('access_token');
        const error = searchParams.get('error');

        // 사용자가 로그인을 취소한 경우
        if (error === 'access_denied') {
            setStatus('로그인이 취소되었습니다.');
            setTimeout(() => {
                router.replace('/');
            }, 800);
            return;
        }

        // 기타 에러가 있는 경우
        if (error) {
            setStatus('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
            setTimeout(() => {
                router.replace('/');
            }, 2000);
            return;
        }

        if (accessToken) {
            const processLogin = async () => {
                try {
                    // 1. 먼저 토큰을 임시로 설정하여 API 호출
                    setAuthToken(accessToken);
                    setStatus('사용자 정보를 확인하는 중...');

                    // 2. 사용자 정보 조회
                    const response = await authAPI.getCurrentUser();
                    const userProfile = response.data;

                    // 3. 관리자 권한 확인
                    if (userProfile.role === 'user') {
                        // 권한 없음: 토큰 삭제
                        localStorage.removeItem('accessToken');
                        setStatus('❌ 관리자 권한이 없습니다.');
                        setTimeout(() => {
                            router.replace('/');
                        }, 2500);
                        return;
                    }

                    // 4. 관리자 또는 최고 관리자: 대시보드로 이동
                    setStatus('✅ 로그인 성공! 대시보드로 이동합니다.');
                    setTimeout(() => {
                        router.replace('/dashboard');
                    }, 500);
                } catch (error) {
                    console.error('Login failed:', error);
                    setStatus('로그인 실패. 다시 시도해주세요.');
                    localStorage.removeItem('accessToken');

                    setTimeout(() => {
                        router.replace('/');
                    }, 2000);
                }
            };

            processLogin();
        } else {
            console.error('No access_token parameter found in URL');
            setStatus('잘못된 접근입니다. 홈으로 이동합니다.');

            setTimeout(() => {
                router.replace('/');
            }, 2000);
        }
    }, [searchParams, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                {/* 로딩 스피너 */}
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
                {/* 로딩 문구 */}
                <p className="text-sm text-gray-600">{status}</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
                    <p className="text-sm text-gray-600">로그인 중입니다...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
