'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/_components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { isAuthenticated } from '@/lib/auth';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/');
        }
    }, [router]);

    return (
        <SidebarProvider className="h-svh">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
                {/* 모바일 헤더 - md 미만에서만 표시 */}
                <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-4 md:hidden">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm font-semibold">제로타임 백오피스</span>
                </header>
                <div className="container mx-auto p-4 md:p-6">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}
