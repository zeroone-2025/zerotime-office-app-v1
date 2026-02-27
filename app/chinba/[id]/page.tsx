'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import { chinbaAPI, type AdminChinbaEventDetail, type AdminChinbaParticipant } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import ScheduleHeatmap from './_components/ScheduleHeatmap';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: '진행중', variant: 'default' },
    completed: { label: '종료', variant: 'secondary' },
    expired: { label: '만료', variant: 'outline' },
};

export default function ChinbaEventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<AdminChinbaEventDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvent = async () => {
            try {
                const response = await chinbaAPI.getDetail(eventId);
                setEvent(response.data);
            } catch (error) {
                console.error('Failed to load event:', error);
            } finally {
                setLoading(false);
            }
        };
        loadEvent();
    }, [eventId]);

    if (loading) {
        return <div className="flex items-center justify-center h-96">로딩 중...</div>;
    }

    if (!event) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <p className="text-muted-foreground">이벤트를 찾을 수 없습니다.</p>
                <Button variant="outline" onClick={() => router.push('/chinba')}>
                    목록으로 돌아가기
                </Button>
            </div>
        );
    }

    const statusConfig = statusLabels[event.status] || statusLabels.active;
    const submittedCount = event.participants.filter(p => p.has_submitted).length;
    const notSubmittedCount = event.participants.length - submittedCount;
    const submitRate = event.participants.length > 0
        ? Math.round((submittedCount / event.participants.length) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/chinba')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{event.title}</h1>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
            </div>

            {/* 생성자 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">생성자 정보</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">닉네임</p>
                            <button
                                className="text-blue-600 hover:underline cursor-pointer font-medium"
                                onClick={() => router.push(`/users/${event.creator_id}`)}
                            >
                                {event.creator_nickname || `User #${event.creator_id}`}
                            </button>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">이메일</p>
                            <p className="font-medium">{event.creator_email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">유저 ID</p>
                            <p className="font-medium">{event.creator_id}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 이벤트 정보 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">이벤트 정보</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">이벤트 ID</p>
                            <p className="font-mono text-sm">{event.event_id}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">제목</p>
                            <p className="font-medium">{event.title}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">상태</p>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">날짜</p>
                            <p className="font-medium">{event.dates.join(', ')}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">시간 범위</p>
                            <p className="font-medium">{event.start_hour}:00 ~ {event.end_hour}:00</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">생성일</p>
                            <p className="font-medium">
                                {format(new Date(event.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 탭 */}
            <Tabs defaultValue="stats">
                <TabsList>
                    <TabsTrigger value="stats">참여 현황</TabsTrigger>
                    <TabsTrigger value="schedule">일정 히트맵</TabsTrigger>
                    <TabsTrigger value="participants">참여 인원 목록</TabsTrigger>
                </TabsList>

                <TabsContent value="stats" className="mt-4">
                    <StatsTab
                        total={event.participants.length}
                        submitted={submittedCount}
                        notSubmitted={notSubmittedCount}
                        submitRate={submitRate}
                    />
                </TabsContent>

                <TabsContent value="schedule" className="mt-4">
                    {submittedCount === 0 ? (
                        <Card>
                            <CardContent className="py-12">
                                <p className="text-center text-muted-foreground">
                                    아직 일정을 제출한 참여자가 없습니다.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <ScheduleHeatmap
                            dates={event.dates}
                            heatmap={event.heatmap}
                            recommendedTimes={event.recommended_times}
                            startHour={event.start_hour}
                            endHour={event.end_hour}
                            totalParticipants={event.participants.length}
                            submittedCount={submittedCount}
                        />
                    )}
                </TabsContent>

                <TabsContent value="participants" className="mt-4">
                    <ParticipantsTab participants={event.participants} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function StatsTab({
    total,
    submitted,
    notSubmitted,
    submitRate,
}: {
    total: number;
    submitted: number;
    notSubmitted: number;
    submitRate: number;
}) {
    const stats = [
        { label: '전체 참여자', value: total },
        { label: '제출 완료', value: submitted },
        { label: '미제출', value: notSubmitted },
        { label: '제출률', value: `${submitRate}%` },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.label}>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function ParticipantsTab({ participants }: { participants: AdminChinbaParticipant[] }) {
    const router = useRouter();

    const columns: ColumnDef<AdminChinbaParticipant>[] = [
        {
            accessorKey: 'user_id',
            header: '유저 ID',
            cell: ({ row }) => <div className="w-16">{row.getValue('user_id')}</div>,
        },
        {
            accessorKey: 'nickname',
            header: '닉네임',
            cell: ({ row }) => {
                const nickname = row.getValue('nickname') as string | undefined;
                const userId = row.original.user_id;
                return (
                    <button
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={() => router.push(`/users/${userId}`)}
                    >
                        {nickname || `User #${userId}`}
                    </button>
                );
            },
        },
        {
            accessorKey: 'email',
            header: '이메일',
            cell: ({ row }) => row.getValue('email') || '-',
        },
        {
            accessorKey: 'has_submitted',
            header: '제출 여부',
            cell: ({ row }) => {
                const submitted = row.getValue('has_submitted') as boolean;
                return submitted
                    ? <Badge variant="default">제출</Badge>
                    : <Badge variant="outline">미제출</Badge>;
            },
        },
        {
            accessorKey: 'submitted_at',
            header: '제출일시',
            cell: ({ row }) => {
                const submittedAt = row.getValue('submitted_at') as string | undefined;
                if (!submittedAt) return '-';
                return format(new Date(submittedAt), 'yyyy-MM-dd HH:mm', { locale: ko });
            },
        },
    ];

    const table = useReactTable({
        data: participants,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                참여자가 없습니다.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
