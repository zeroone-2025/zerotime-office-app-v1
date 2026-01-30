'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardAPI, type DashboardStats } from '@/lib/api';
import { Users, FileText, Eye, Star, UserPlus, FilePlus, Shield, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await dashboardAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96">로딩 중...</div>;
    }

    if (!stats) {
        return <div className="flex items-center justify-center h-96">데이터를 불러올 수 없습니다.</div>;
    }

    const statCards = [
        { title: '총 유저 수', value: stats.total_users, icon: Users, color: 'text-blue-600' },
        { title: '총 공지 수', value: stats.total_notices, icon: FileText, color: 'text-green-600' },
        { title: '총 읽음 수', value: stats.total_reads, icon: Eye, color: 'text-purple-600' },
        { title: '총 즐겨찾기 수', value: stats.total_favorites, icon: Star, color: 'text-yellow-600' },
        { title: '오늘 신규 유저', value: stats.new_users_today, icon: UserPlus, color: 'text-cyan-600' },
        { title: '오늘 신규 공지', value: stats.new_notices_today, icon: FilePlus, color: 'text-orange-600' },
        { title: '관리자 수', value: stats.admin_count, icon: Shield, color: 'text-indigo-600' },
        { title: '최고 관리자 수', value: stats.super_admin_count, icon: ShieldCheck, color: 'text-red-600' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">대시보드</h1>
                <p className="text-muted-foreground mt-2">전북대 공지사항 알림 서비스 관리</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
