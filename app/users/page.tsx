'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
} from '@tanstack/react-table';
import { usersAPI, type AdminUser } from '@/lib/api';
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

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    user: { label: '일반', variant: 'default' },
    admin: { label: '관리자', variant: 'secondary' },
    super_admin: { label: '최고관리자', variant: 'destructive' },
};

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [sorting, setSorting] = useState<SortingState>([]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const params: any = { limit: 100 };
            if (roleFilter !== 'all') params.role = roleFilter;

            const response = await usersAPI.getAll(params);
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [roleFilter]);

    const columns: ColumnDef<AdminUser>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <div className="w-12">{row.getValue('id')}</div>,
        },
        {
            accessorKey: 'email',
            header: '이메일',
            cell: ({ row }) => <div className="font-medium">{row.getValue('email')}</div>,
        },
        {
            accessorKey: 'nickname',
            header: '닉네임',
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
            header: '가입일',
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
                    onClick={() => router.push(`/users/${row.original.id}`)}
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
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
            globalFilter: search,
        },
        onGlobalFilterChange: setSearch,
    });

    if (loading) {
        return <div className="flex items-center justify-center h-96">로딩 중...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">유저 관리</h1>
                <p className="text-muted-foreground mt-2">전체 유저 목록 및 관리</p>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="이메일 또는 닉네임 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
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
                                    검색 결과가 없습니다.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    총 {table.getFilteredRowModel().rows.length}명의 유저
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        이전
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        다음
                    </Button>
                </div>
            </div>
        </div>
    );
}
