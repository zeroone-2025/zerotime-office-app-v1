'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usersAPI, type AdminUserDetail, type Notice, type Keyword } from '@/lib/api';
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
import { ArrowLeft, Trash2 } from 'lucide-react';
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    const [reads, setReads] = useState<Notice[]>([]);
    const [favorites, setFavorites] = useState<Notice[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);

    // 수정 모드
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ nickname: '', role: '', dept_code: '', school: '' });

    useEffect(() => {
        loadUserData();
    }, [userId]);

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

    const handleDelete = async () => {
        try {
            await usersAPI.delete(userId);
            alert('사용자가 삭제되었습니다.');
            router.push('/users');
        } catch (error: any) {
            console.error('Failed to delete user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 삭제에 실패했습니다.';
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
                        <h1 className="text-3xl font-bold">유저 상세</h1>
                        <p className="text-muted-foreground mt-2">{user.email}</p>
                    </div>
                </div>
                {user.role !== 'super_admin' && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>사용자 삭제 확인</AlertDialogTitle>
                                <AlertDialogDescription>
                                    정말로 <strong>{user.email}</strong> 사용자를 삭제하시겠습니까?
                                    <br />
                                    이 작업은 되돌릴 수 없으며, 모든 관련 데이터(읽음, 즐겨찾기 등)가 함께 삭제됩니다.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    삭제
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
