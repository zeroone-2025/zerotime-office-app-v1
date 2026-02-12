'use client';

import { useEffect, useState } from 'react';
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
import { noticesAPI, type AdminNotice } from '@/lib/api';
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
import { ExternalLink, Trash2 } from 'lucide-react';
import { getBoardName, BOARD_OPTIONS } from '@/lib/constants';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NoticesPage() {
    const [notices, setNotices] = useState<AdminNotice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [boardFilter, setBoardFilter] = useState<string>('all');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const loadNotices = async () => {
        try {
            setLoading(true);
            const params: any = { limit: 100 };
            if (boardFilter !== 'all') params.board_code = boardFilter;

            const response = await noticesAPI.getAll(params);
            setNotices(response.data);
        } catch (error) {
            console.error('Failed to load notices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotices();
    }, [boardFilter]);

    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        try {
            await noticesAPI.delete(deleteId);
            alert('공지가 삭제되었습니다.');
            await loadNotices();
        } catch (error) {
            console.error('Failed to delete notice:', error);
            alert('공지 삭제에 실패했습니다.');
        } finally {
            setDeleteId(null);
        }
    };

    const columns: ColumnDef<AdminNotice>[] = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <div className="w-12">{row.getValue('id')}</div>,
        },
        {
            accessorKey: 'title',
            header: '제목',
            cell: ({ row }) => (
                <div className="max-w-md truncate font-medium">{row.getValue('title')}</div>
            ),
        },
        {
            accessorKey: 'board_code',
            header: '게시판',
            cell: ({ row }) => <Badge variant="outline">{getBoardName(row.getValue('board_code'))}</Badge>,
        },
        {
            accessorKey: 'date',
            header: '작성일',
            cell: ({ row }) => {
                const date = new Date(row.getValue('date'));
                return format(date, 'yyyy-MM-dd', { locale: ko });
            },
        },
        {
            accessorKey: 'view',
            header: '조회수',
            cell: ({ row }) => <div className="text-center">{row.getValue('view')}</div>,
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
            id: 'actions',
            header: '작업',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(row.original.link, '_blank');
                        }}
                    >
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(row.original.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data: notices,
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
                <h1 className="text-3xl font-bold">공지 관리</h1>
                <p className="text-muted-foreground mt-2">전체 공지 목록 및 관리</p>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="제목 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={boardFilter} onValueChange={setBoardFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="게시판 필터" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {BOARD_OPTIONS.map((board) => (
                            <SelectItem key={board.code} value={board.code}>
                                {board.name}
                            </SelectItem>
                        ))}
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
                    총 {table.getFilteredRowModel().rows.length}개의 공지
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
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>정말 이 공지를 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            이 작업은 되돌릴 수 없으며, 공지가 영구적으로 삭제됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
