'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
} from '@tanstack/react-table';
import { chinbaAPI, type AdminChinbaEvent, type AdminChinbaEventListResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    active: { label: '진행중', variant: 'default' },
    completed: { label: '종료', variant: 'secondary' },
    expired: { label: '만료', variant: 'outline' },
};

function formatDates(dates: string[]): string {
    if (dates.length === 0) return '-';
    const first = dates[0];
    if (dates.length === 1) return first;
    return `${first} 외 ${dates.length - 1}일`;
}

export default function ChinbaEventsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-96">로딩 중...</div>}>
            <ChinbaEventsPageContent />
        </Suspense>
    );
}

function ChinbaEventsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [data, setData] = useState<AdminChinbaEventListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
    const [limit] = useState(10);
    const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || 'all');

    // 상태 변경 시 URL 동기화
    useEffect(() => {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (statusFilter !== 'all') params.set('status', statusFilter);
        const qs = params.toString();
        router.replace(qs ? `/chinba?${qs}` : '/chinba', { scroll: false });
    }, [page, statusFilter, router]);

    const loadEvents = useCallback(async () => {
        setLoading(true);
        try {
            const skip = (page - 1) * limit;
            const params: Record<string, any> = { skip, limit };
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await chinbaAPI.getAll(params);
            setData(response.data);
        } catch (error) {
            console.error('Failed to load chinba events:', error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter]);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const events = data?.items ?? [];
    const totalPages = data ? Math.ceil(data.total / data.per_page) : 0;

    const columns: ColumnDef<AdminChinbaEvent>[] = [
        {
            accessorKey: 'title',
            header: '이벤트명',
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate font-medium" title={row.getValue('title')}>
                    {row.getValue('title')}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: '상태',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                const config = statusLabels[status] || statusLabels.active;
                return <Badge variant={config.variant}>{config.label}</Badge>;
            },
        },
        {
            id: 'creator',
            header: '생성자',
            cell: ({ row }) => {
                const nickname = row.original.creator_nickname;
                const creatorId = row.original.creator_id;
                return (
                    <button
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/users/${creatorId}`);
                        }}
                    >
                        {nickname || `User #${creatorId}`}
                    </button>
                );
            },
        },
        {
            id: 'participation',
            header: '참여인원',
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.submitted_count}/{row.original.participant_count}
                </div>
            ),
        },
        {
            accessorKey: 'dates',
            header: '날짜',
            cell: ({ row }) => formatDates(row.getValue('dates') as string[]),
        },
        {
            accessorKey: 'created_at',
            header: '생성일',
            cell: ({ row }) => {
                const date = new Date(row.getValue('created_at'));
                return format(date, 'yyyy-MM-dd', { locale: ko });
            },
        },
        {
            id: 'actions',
            header: '작업',
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/chinba/${row.original.event_id}`);
                    }}
                >
                    상세보기
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: events,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        pageCount: totalPages,
        state: {
            globalFilter: search,
            pagination: { pageIndex: page - 1, pageSize: limit },
        },
        onGlobalFilterChange: setSearch,
    });

    if (loading && !data) {
        return <div className="flex items-center justify-center h-96">로딩 중...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">친바 관리</h1>
                <p className="text-muted-foreground mt-2">친바 이벤트 목록 및 관리</p>
            </div>

            {/* 검색 + 상태 필터 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Input
                    placeholder="현재 페이지 내 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:max-w-sm"
                />
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="active">진행중</SelectItem>
                        <SelectItem value="completed">종료</SelectItem>
                        <SelectItem value="expired">만료</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 테이블 */}
            <div className="rounded-md border overflow-x-auto">
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
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => router.push(`/chinba/${row.original.event_id}`)}
                                >
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
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    총 {data?.total ?? 0}개의 이벤트
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            이전
                        </Button>
                        {(() => {
                            const pages: (number | '...')[] = [];
                            if (totalPages <= 7) {
                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                            } else {
                                pages.push(1);
                                if (page > 3) pages.push('...');
                                const start = Math.max(2, page - 1);
                                const end = Math.min(totalPages - 1, page + 1);
                                for (let i = start; i <= end; i++) pages.push(i);
                                if (page < totalPages - 2) pages.push('...');
                                pages.push(totalPages);
                            }
                            return pages.map((p, idx) =>
                                p === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">...</span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="min-w-[32px]"
                                        onClick={() => setPage(p)}
                                    >
                                        {p}
                                    </Button>
                                )
                            );
                        })()}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            다음
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
