'use client';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Users, FileText, LogOut } from 'lucide-react';
import LogoSymbol from '@/components/ui/LogoSymbol';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const menuItems = [
    { title: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
    { title: '유저 관리', icon: Users, href: '/users' },
    { title: '공지 관리', icon: FileText, href: '/notices' },
];

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        router.push('/');
    };

    return (
        <Sidebar>
            <SidebarHeader className="border-b p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border shadow-sm">
                        <LogoSymbol className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold tracking-tight">백오피스</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>메뉴</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive}>
                                            <Link href={item.href}>
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                            <span>로그아웃</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
