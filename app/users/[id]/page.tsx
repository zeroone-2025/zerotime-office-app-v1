'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usersAPI, authAPI, type AdminUserDetail, type Notice, type Keyword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Trash2, MoreVertical, RotateCcw, Skull } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getBoardName } from '@/lib/constants';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const roleLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    user: { label: '일반', variant: 'default' },
    admin: { label: '관리자', variant: 'secondary' },
    super_admin: { label: '최고관리자', variant: 'destructive' },
};

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.id);

    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [reads, setReads] = useState<Notice[]>([]);
    const [favorites, setFavorites] = useState<Notice[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);

    // 수정 모드
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nickname: '', role: '', dept_code: '', school: '' });

    // 삭제 다이얼로그 상태
    const [softDeleteOpen, setSoftDeleteOpen] = useState(false);
    const [hardDeleteOpen, setHardDeleteOpen] = useState(false);

    useEffect(() => {
        loadUserData();
        loadCurrentUser();
    }, [userId]);

    const loadCurrentUser = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Failed to load current user:', error);
        }
    };

    const loadUserData = async () => {
        try {
            const userRes = await usersAPI.getDetail(userId);
            const userData = userRes.data;

            setUser(userData);

            // recent_reads와 favorites는 이미 user 객체에 포함되어 있음
            // 키워드는 아직 구현되지 않았으므로 빈 배열
            setReads([]);
            setFavorites([]);
            setKeywords([]);

            setEditData({
                nickname: userData.nickname || '',
                role: userData.role,
                dept_code: userData.dept_code || '',
                school: userData.school || '전북대',
            });
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            // super_admin으로 변경 시도 차단
            if (editData.role === 'super_admin') {
                alert('최고관리자 권한은 환경변수(.env)로만 관리됩니다.');
                return;
            }

            await usersAPI.update(userId, editData);
            await loadUserData();
            setIsEditing(false);
            alert('사용자 정보가 성공적으로 수정되었습니다.');
        } catch (error: any) {
            console.error('Failed to update user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 정보 수정에 실패했습니다.';
            alert(errorMessage);
        }
    };

    const handleSoftDelete = async () => {
        try {
            await usersAPI.softDelete(userId);
            alert('사용자가 소프트 삭제되었습니다.');
            await loadUserData();
        } catch (error: any) {
            console.error('Failed to soft delete user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 소프트 삭제에 실패했습니다.';
            alert(errorMessage);
        }
    };

    const handleHardDelete = async () => {
        try {
            await usersAPI.hardDelete(userId);
            alert('사용자가 완전히 삭제되었습니다.');
            router.push('/users');
        } catch (error: any) {
            console.error('Failed to hard delete user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 하드 삭제에 실패했습니다.';
            alert(errorMessage);
        }
    };

    const handleRestore = async () => {
        try {
            await usersAPI.restore(userId);
            alert('사용자가 복구되었습니다.');
            await loadUserData();
        } catch (error: any) {
            console.error('Failed to restore user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 복구에 실패했습니다.';
            alert(errorMessage);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-96">로딩 중...</div>;
    }

    if (!user) {
        return <div className="flex items-center justify-center h-96">사용자를 찾을 수 없습니다.</div>;
    }

    const roleConfig = roleLabels[user.role] || roleLabels.user;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold">유저 상세</h1>
                            {user.is_active === 0 && (
                                <Badge variant="secondary" className="text-sm">비활성</Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-2">{user.email}</p>
                    </div>
                </div>
                {user.role !== 'super_admin' && (
                    <div className="flex items-center gap-2">
                        {/* 비활성 사용자인 경우 복구 버튼 표시 */}
                        {user.is_active === 0 && (
                            <Button variant="outline" size="sm" onClick={handleRestore}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                복구
                            </Button>
                        )}

                        {/* 삭제 드롭다운 메뉴 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <MoreVertical className="h-4 w-4 mr-2" />
                                    삭제
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {user.is_active === 1 && (
                                    <DropdownMenuItem onClick={() => setSoftDeleteOpen(true)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        소프트 삭제
                                    </DropdownMenuItem>
                                )}
                                {currentUser?.role === 'super_admin' && (
                                    <>
                                        {user.is_active === 1 && <DropdownMenuSeparator />}
                                        <DropdownMenuItem
                                            onClick={() => setHardDeleteOpen(true)}
                                            className="text-red-600"
                                        >
                                            <Skull className="h-4 w-4 mr-2" />
                                            완전 삭제
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 소프트 삭제 확인 다이얼로그 */}
                        <AlertDialog open={softDeleteOpen} onOpenChange={setSoftDeleteOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>소프트 삭제 확인</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <strong>{user.email}</strong> 사용자를 소프트 삭제하시겠습니까?
                                        <br /><br />
                                        소프트 삭제된 사용자는:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>로그인할 수 없습니다</li>
                                            <li>사용자 목록에서 "비활성" 상태로 표시됩니다</li>
                                            <li>모든 데이터가 보존되며 복구가 가능합니다</li>
                                        </ul>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            handleSoftDelete();
                                            setSoftDeleteOpen(false);
                                        }}
                                        className="bg-orange-600 hover:bg-orange-700"
                                    >
                                        소프트 삭제
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        {/* 하드 삭제 확인 다이얼로그 */}
                        <AlertDialog open={hardDeleteOpen} onOpenChange={setHardDeleteOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">⚠️ 완전 삭제 경고</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <strong className="text-red-600">{user.email}</strong> 사용자를 완전히 삭제하시겠습니까?
                                        <br /><br />
                                        <strong className="text-red-600">이 작업은 되돌릴 수 없습니다!</strong>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>사용자 데이터가 DB에서 영구적으로 삭제됩니다</li>
                                            <li>모든 관련 데이터(읽음, 즐겨찾기 등)가 함께 삭제됩니다</li>
                                            <li>복구가 불가능합니다</li>
                                        </ul>
                                        <br />
                                        <strong>Super Admin 권한이 필요합니다.</strong>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>취소</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            handleHardDelete();
                                            setHardDeleteOpen(false);
                                        }}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        완전 삭제
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">기본 정보</TabsTrigger>
                    <TabsTrigger value="reads">읽은 공지 ({reads.length})</TabsTrigger>
                    <TabsTrigger value="favorites">즐겨찾기 ({favorites.length})</TabsTrigger>
                    <TabsTrigger value="keywords">키워드 ({keywords.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>사용자 정보</CardTitle>
                            {!isEditing ? (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    disabled={user.role === 'super_admin'}
                                >
                                    {user.role === 'super_admin' ? '수정 불가' : '수정'}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button onClick={handleSave}>저장</Button>
                                    <Button variant="outline" onClick={() => {
                                        setIsEditing(false);
                                        setEditData({
                                            nickname: user.nickname || '',
                                            role: user.role,
                                            dept_code: user.dept_code || '',
                                            school: user.school || '전북대',
                                        });
                                    }}>취소</Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>ID</Label>
                                    <p className="text-sm font-medium mt-1">{user.id}</p>
                                </div>
                                <div>
                                    <Label>이메일</Label>
                                    <p className="text-sm font-medium mt-1">{user.email}</p>
                                </div>
                                <div>
                                    <Label>닉네임</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editData.nickname}
                                            onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium mt-1">{user.nickname || '-'}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>역할</Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Select
                                                value={editData.role}
                                                onValueChange={(value) => setEditData({ ...editData, role: value })}
                                                disabled={user.role === 'super_admin'}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">일반</SelectItem>
                                                    <SelectItem value="admin">관리자</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {user.role === 'super_admin' && (
                                                <p className="text-xs text-muted-foreground">
                                                    ⚠️ 최고관리자는 환경변수(.env)로만 관리됩니다
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-1 space-y-1">
                                            <Badge variant={roleConfig.variant}>{roleConfig.label}</Badge>
                                            {user.role === 'super_admin' && (
                                                <p className="text-xs text-muted-foreground">
                                                    환경변수로 관리됨
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>학교</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editData.school}
                                            onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium mt-1">{user.school}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>학과 코드</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editData.dept_code}
                                            onChange={(e) => setEditData({ ...editData, dept_code: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-sm font-medium mt-1">{user.dept_code || '-'}</p>
                                    )}
                                </div>
                                <div>
                                    <Label>입학년도</Label>
                                    <p className="text-sm font-medium mt-1">{user.admission_year || '-'}</p>
                                </div>
                                <div>
                                    <Label>가입일</Label>
                                    <p className="text-sm font-medium mt-1">
                                        {format(new Date(user.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <Label>읽은 공지</Label>
                                    <p className="text-2xl font-bold mt-1">{user.read_count}</p>
                                </div>
                                <div>
                                    <Label>즐겨찾기</Label>
                                    <p className="text-2xl font-bold mt-1">{user.favorite_count}</p>
                                </div>
                                <div>
                                    <Label>키워드</Label>
                                    <p className="text-2xl font-bold mt-1">{user.keyword_count}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <Label>구독 중인 게시판 ({user.subscriptions.length})</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {user.subscriptions.map((code) => (
                                        <Badge key={code} variant="outline">{getBoardName(code)}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reads">
                    <Card>
                        <CardHeader>
                            <CardTitle>읽은 공지 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {reads.map((notice) => (
                                    <div key={notice.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{notice.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {getBoardName(notice.board_code)} · {format(new Date(notice.date), 'yyyy-MM-dd', { locale: ko })}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => window.open(notice.link, '_blank')}>
                                            링크
                                        </Button>
                                    </div>
                                ))}
                                {reads.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">읽은 공지가 없습니다.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="favorites">
                    <Card>
                        <CardHeader>
                            <CardTitle>즐겨찾기 목록</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {favorites.map((notice) => (
                                    <div key={notice.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{notice.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {getBoardName(notice.board_code)} · {format(new Date(notice.date), 'yyyy-MM-dd', { locale: ko })}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => window.open(notice.link, '_blank')}>
                                            링크
                                        </Button>
                                    </div>
                                ))}
                                {favorites.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8">즐겨찾기한 공지가 없습니다.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="keywords">
                    <Card>
                        <CardHeader>
                            <CardTitle>구독 키워드</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {keywords.map((keyword) => (
                                    <Badge key={keyword.id} variant="secondary" className="text-base px-3 py-1">
                                        {keyword.keyword}
                                    </Badge>
                                ))}
                                {keywords.length === 0 && (
                                    <p className="text-center text-muted-foreground py-8 w-full">구독 중인 키워드가 없습니다.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
