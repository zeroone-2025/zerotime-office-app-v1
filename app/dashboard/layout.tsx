'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/_components/AppSidebar';
import { isAuthenticated } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        // 로그인 상태 확인
        if (!isAuthenticated()) {
            router.replace('/');
        }
    }, [router]);

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                    <div className="container mx-auto p-6">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
