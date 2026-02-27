'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
} from '@tanstack/react-table';
import { usersAPI, type AdminUser, type AdminUserListResponse } from '@/lib/api';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    user: { label: '일반', variant: 'default' },
    admin: { label: '관리자', variant: 'secondary' },
    super_admin: { label: '최고관리자', variant: 'destructive' },
};

const userTypeLabels: Record<string, { label: string; variant: 'default' | 'secondary' }> = {
    student: { label: '학생', variant: 'default' },
    mentor: { label: '선배', variant: 'secondary' },
};

function SortableHeader({ column, label, sorting }: { column: string; label: string; sorting: SortingState }) {
    const currentSort = sorting.find(s => s.id === column);
    return (
        <span className="inline-flex items-center gap-1">
            {label}
            {currentSort ? (
                currentSort.desc ? <ArrowDown className="size-3.5" /> : <ArrowUp className="size-3.5" />
            ) : (
                <ArrowUpDown className="size-3.5 opacity-40" />
            )}
        </span>
    );
}

export default function UsersPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-96">로딩 중...</div>}>
            <UsersPageContent />
        </Suspense>
    );
}

function UsersPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL 파라미터에서 초기값 복원
    const [data, setData] = useState<AdminUserListResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
    const [limit] = useState(10);
    const [userTypeTab, setUserTypeTab] = useState(() => searchParams.get('user_type') || 'all');
    const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') || 'all');
    const [sorting, setSorting] = useState<SortingState>(() => {
        const sort = searchParams.get('sort');
        const order = searchParams.get('order');
        if (sort) return [{ id: sort, desc: order !== 'asc' }];
        return [{ id: 'created_at', desc: true }];
    });

    // 상태 변경 시 URL 동기화 (replace로 히스토리 쌓지 않음)
    useEffect(() => {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (userTypeTab !== 'all') params.set('user_type', userTypeTab);
        if (roleFilter !== 'all') params.set('role', roleFilter);
        const sortItem = sorting[0];
        if (sortItem && (sortItem.id !== 'created_at' || !sortItem.desc)) {
            params.set('sort', sortItem.id);
            params.set('order', sortItem.desc ? 'desc' : 'asc');
        }
        const qs = params.toString();
        router.replace(qs ? `/users?${qs}` : '/users', { scroll: false });
    }, [page, userTypeTab, roleFilter, sorting, router]);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const sortItem = sorting[0];
            const params: Record<string, any> = {
                page,
                limit,
            };
            if (roleFilter !== 'all') params.role = roleFilter;
            if (userTypeTab !== 'all') params.user_type = userTypeTab;
            if (sortItem) {
                params.sort = sortItem.id;
                params.order = sortItem.desc ? 'desc' : 'asc';
            }

            const response = await usersAPI.getAll(params);
            setData(response.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }, [page, limit, roleFilter, userTypeTab, sorting]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // 필터/탭/정렬 변경 시 page=1 리셋
    const handleUserTypeChange = (value: string) => {
        setUserTypeTab(value);
        setPage(1);
    };

    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
        setPage(1);
    };

    const handleSortToggle = (columnId: string) => {
        setSorting(prev => {
            const current = prev.find(s => s.id === columnId);
            if (!current) return [{ id: columnId, desc: true }];
            if (current.desc) return [{ id: columnId, desc: false }];
            return [{ id: 'created_at', desc: true }];
        });
        setPage(1);
    };

    const users = data?.users ?? [];
    const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
    const studentCount = data?.student_count ?? 0;
    const mentorCount = data?.mentor_count ?? 0;

    const columns: ColumnDef<AdminUser>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <div className="w-12">{row.getValue('id')}</div>,
        },
        {
            accessorKey: 'email',
            header: () => (
                <button className="cursor-pointer" onClick={() => handleSortToggle('email')}>
                    <SortableHeader column="email" label="이메일" sorting={sorting} />
                </button>
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue('email')}</div>,
        },
        {
            accessorKey: 'nickname',
            header: () => (
                <button className="cursor-pointer" onClick={() => handleSortToggle('nickname')}>
                    <SortableHeader column="nickname" label="닉네임" sorting={sorting} />
                </button>
            ),
            cell: ({ row }) => row.getValue('nickname') || '-',
        },
        {
            accessorKey: 'role',
            header: '역할',
            cell: ({ row }) => {
                const role = row.getValue('role') as string;
                const config = roleLabels[role] || roleLabels.user;
                return <Badge variant={config.variant}>{config.label}</Badge>;
            },
        },
        {
            accessorKey: 'user_type',
            header: '유형',
            cell: ({ row }) => {
                const userType = row.getValue('user_type') as string;
                const config = userTypeLabels[userType] || userTypeLabels.student;
                return <Badge variant={config.variant}>{config.label}</Badge>;
            },
        },
        {
            accessorKey: 'is_active',
            header: '상태',
            cell: ({ row }) => {
                const isActive = row.getValue('is_active') as number;
                return isActive === 1 ? (
                    <Badge variant="default">활성</Badge>
                ) : (
                    <Badge variant="secondary">비활성</Badge>
                );
            },
        },
        {
            accessorKey: 'school',
            header: '학교',
        },
        {
            accessorKey: 'read_count',
            header: '읽음',
            cell: ({ row }) => <div className="text-center">{row.getValue('read_count')}</div>,
        },
        {
            accessorKey: 'favorite_count',
            header: '즐겨찾기',
            cell: ({ row }) => <div className="text-center">{row.getValue('favorite_count')}</div>,
        },
        {
            accessorKey: 'keyword_count',
            header: '키워드',
            cell: ({ row }) => <div className="text-center">{row.getValue('keyword_count')}</div>,
        },
        {
            accessorKey: 'created_at',
            header: () => (
                <button className="cursor-pointer" onClick={() => handleSortToggle('created_at')}>
                    <SortableHeader column="created_at" label="가입일" sorting={sorting} />
                </button>
            ),
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
                        router.push(`/users/${row.original.id}`);
                    }}
                >
                    상세보기
                </Button>
            ),
        },
    ];

    const table = useReactTable({
        data: users,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        manualSorting: true,
        pageCount: totalPages,
        state: {
            sorting,
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
                <h1 className="text-3xl font-bold">유저 관리</h1>
                <p className="text-muted-foreground mt-2">전체 유저 목록 및 관리</p>
            </div>

            {/* 탭 + 검색 + 역할 필터 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Tabs value={userTypeTab} onValueChange={handleUserTypeChange}>
                    <TabsList>
                        <TabsTrigger value="all">전체 ({studentCount + mentorCount})</TabsTrigger>
                        <TabsTrigger value="student">학생 ({studentCount})</TabsTrigger>
                        <TabsTrigger value="mentor">선배 ({mentorCount})</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Input
                    placeholder="현재 페이지 내 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:max-w-sm"
                />
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="역할 필터" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="user">일반</SelectItem>
                        <SelectItem value="admin">관리자</SelectItem>
                        <SelectItem value="super_admin">최고관리자</SelectItem>
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
                                    onClick={() => router.push(`/users/${row.original.id}`)}
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
                    총 {data?.total ?? 0}명의 유저
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
