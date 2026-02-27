'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    usersAPI, authAPI, departmentsAPI,
    type AdminUserDetail, type Notice, type Keyword,
    type Timetable, type TimetableClass, type CareerProfile,
} from '@/lib/api';
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

const VALID_TABS = ['info', 'reads', 'favorites', 'keywords', 'timetable', 'career'] as const;
type TabValue = typeof VALID_TABS[number];

const DAY_NAMES = ['월', '화', '수', '목', '금'];

const VISIBILITY_LABELS: Record<string, string> = {
    all: '전체 공개',
    career_only: '이력만 공개',
    private: '비공개',
};

export default function UserDetailPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-96">로딩 중...</div>}>
            <UserDetailContent />
        </Suspense>
    );
}

function UserDetailContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = Number(params.id);

    // URL query string으로 탭 상태 관리
    const rawTab = searchParams.get('tab');
    const tab: TabValue = VALID_TABS.includes(rawTab as TabValue) ? (rawTab as TabValue) : 'info';

    const setTab = useCallback((value: string) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('tab', value);
        router.replace(`?${newParams.toString()}`);
    }, [router, searchParams]);

    const [user, setUser] = useState<AdminUserDetail | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [reads, setReads] = useState<Notice[]>([]);
    const [favorites, setFavorites] = useState<Notice[]>([]);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [timetable, setTimetable] = useState<Timetable | null>(null);
    const [career, setCareer] = useState<CareerProfile | null>(null);
    const [deptMap, setDeptMap] = useState<Record<string, string>>({});
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
            const [userRes, readsRes, favoritesRes, keywordsRes, timetableRes, careerRes, deptsRes] = await Promise.all([
                usersAPI.getDetail(userId),
                usersAPI.getReads(userId).catch(() => ({ data: [] })),
                usersAPI.getFavorites(userId).catch(() => ({ data: [] })),
                usersAPI.getKeywords(userId).catch(() => ({ data: [] })),
                usersAPI.getTimetable(userId).catch(() => ({ data: null })),
                usersAPI.getCareer(userId).catch(() => ({ data: null })),
                departmentsAPI.getAll().catch(() => ({ data: [] })),
            ]);

            const userData = userRes.data;
            setUser(userData);
            setReads(readsRes.data);
            setFavorites(favoritesRes.data);
            setKeywords(keywordsRes.data);
            setTimetable(timetableRes.data);
            setCareer(careerRes.data);

            const map: Record<string, string> = {};
            for (const d of deptsRes.data) {
                map[d.dept_code] = d.dept_name;
            }
            setDeptMap(map);

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
            alert('사용자가 비활성화되었습니다.');
            await loadUserData();
        } catch (error: any) {
            console.error('Failed to deactivate user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 비활성화에 실패했습니다.';
            alert(errorMessage);
        }
    };

    const handleHardDelete = async () => {
        try {
            await usersAPI.hardDelete(userId);
            alert('사용자가 강제 삭제되었습니다.');
            router.push('/users');
        } catch (error: any) {
            console.error('Failed to force delete user:', error);
            const errorMessage = error.response?.data?.detail || '사용자 강제 삭제에 실패했습니다.';
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
                        {user.is_active === 0 && (
                            <Button variant="outline" size="sm" onClick={handleRestore}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                복구
                            </Button>
                        )}

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
                                        비활성화
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
                                            강제 삭제
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialog open={softDeleteOpen} onOpenChange={setSoftDeleteOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>사용자 비활성화 확인</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <strong>{user.email}</strong> 사용자를 비활성화하시겠습니까?
                                        <br /><br />
                                        비활성화된 사용자는:
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>로그인할 수 없습니다</li>
                                            <li>사용자 목록에서 &quot;비활성&quot; 상태로 표시됩니다</li>
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
                                        비활성화
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog open={hardDeleteOpen} onOpenChange={setHardDeleteOpen}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">강제 삭제 경고</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <strong className="text-red-600">{user.email}</strong> 사용자를 강제 삭제하시겠습니까?
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
                                        강제 삭제
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">기본 정보</TabsTrigger>
                    <TabsTrigger value="reads">읽은 공지 ({reads.length})</TabsTrigger>
                    <TabsTrigger value="favorites">즐겨찾기 ({favorites.length})</TabsTrigger>
                    <TabsTrigger value="keywords">키워드 ({keywords.length})</TabsTrigger>
                    <TabsTrigger value="timetable">일정관리</TabsTrigger>
                    <TabsTrigger value="career">이력관리</TabsTrigger>
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
                                                    최고관리자는 환경변수(.env)로만 관리됩니다
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
                                        <p className="text-sm font-medium mt-1">{user.dept_code ? (deptMap[user.dept_code] || user.dept_code) : '-'}</p>
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

                {/* 시간표 탭 */}
                <TabsContent value="timetable">
                    <TimetableTab timetable={timetable} />
                </TabsContent>

                {/* 경력 탭 */}
                <TabsContent value="career">
                    <CareerTab career={career} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ==================== 시간표 탭 컴포넌트 ====================

function TimetableTab({ timetable }: { timetable: Timetable | null }) {
    if (!timetable || timetable.classes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>시간표</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">등록된 시간표가 없습니다.</p>
                </CardContent>
            </Card>
        );
    }

    const classes = timetable.classes;

    // 시간 범위 계산
    const allMinutes = classes.flatMap((c) => {
        const start = timeToMinutes(c.start_time);
        const end = timeToMinutes(c.end_time);
        return [start, end];
    });
    const minTime = Math.floor(Math.min(...allMinutes) / 60) * 60; // 정시로 내림
    const maxTime = Math.ceil(Math.max(...allMinutes) / 60) * 60;  // 정시로 올림

    // 30분 단위 시간 슬롯 생성
    const timeSlots: number[] = [];
    for (let t = minTime; t < maxTime; t += 30) {
        timeSlots.push(t);
    }

    // 요일별 수업 그룹핑 (day: 0=월 ~ 4=금)
    const classesByDay: Record<number, TimetableClass[]> = {};
    for (let d = 0; d < 5; d++) {
        classesByDay[d] = classes.filter((c) => c.day === d);
    }

    // 색상 팔레트
    const colors = [
        'bg-blue-100 border-blue-300 text-blue-800',
        'bg-green-100 border-green-300 text-green-800',
        'bg-purple-100 border-purple-300 text-purple-800',
        'bg-orange-100 border-orange-300 text-orange-800',
        'bg-pink-100 border-pink-300 text-pink-800',
        'bg-teal-100 border-teal-300 text-teal-800',
        'bg-yellow-100 border-yellow-300 text-yellow-800',
        'bg-indigo-100 border-indigo-300 text-indigo-800',
    ];

    // 수업명별 색상 매핑
    const uniqueNames = [...new Set(classes.map((c) => c.name))];
    const colorMap: Record<string, string> = {};
    uniqueNames.forEach((name, i) => {
        colorMap[name] = colors[i % colors.length];
    });

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>시간표</CardTitle>
                    <Badge variant="outline">학기: {timetable.semester}</Badge>
                </CardHeader>
                <CardContent>
                    {/* 시간표 그리드 */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                            {/* 헤더 */}
                            <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b">
                                <div className="p-2 text-center text-sm font-medium text-muted-foreground">시간</div>
                                {DAY_NAMES.map((day) => (
                                    <div key={day} className="p-2 text-center text-sm font-medium">{day}</div>
                                ))}
                            </div>

                            {/* 시간 슬롯 */}
                            <div className="relative">
                                {timeSlots.map((slot) => (
                                    <div key={slot} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-dashed border-muted h-8">
                                        <div className="px-2 flex items-center text-xs text-muted-foreground">
                                            {slot % 60 === 0 ? minutesToTime(slot) : ''}
                                        </div>
                                        {[0, 1, 2, 3, 4].map((day) => (
                                            <div key={day} className="relative border-l border-muted" />
                                        ))}
                                    </div>
                                ))}

                                {/* 수업 블록 오버레이 */}
                                {[0, 1, 2, 3, 4].map((day) =>
                                    classesByDay[day]?.map((cls) => {
                                        const startMin = timeToMinutes(cls.start_time);
                                        const endMin = timeToMinutes(cls.end_time);
                                        const top = ((startMin - minTime) / 30) * 32; // h-8 = 32px
                                        const height = ((endMin - startMin) / 30) * 32;

                                        // 칼럼 위치 계산: 60px(시간) + day * (1/5 of remaining)
                                        const leftPercent = ((day) / 5) * 100;
                                        const widthPercent = 100 / 5;

                                        return (
                                            <div
                                                key={cls.id}
                                                className={`absolute rounded border px-1 py-0.5 overflow-hidden ${colorMap[cls.name]}`}
                                                style={{
                                                    top: `${top}px`,
                                                    height: `${height}px`,
                                                    left: `calc(60px + ${leftPercent}%)`,
                                                    width: `calc(${widthPercent}% - 2px)`,
                                                }}
                                            >
                                                <p className="text-xs font-medium truncate">{cls.name}</p>
                                                {height > 40 && (
                                                    <p className="text-[10px] truncate">{cls.professor}</p>
                                                )}
                                                {height > 56 && (
                                                    <p className="text-[10px] truncate">{cls.location}</p>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 수업 목록 */}
            <Card>
                <CardHeader>
                    <CardTitle>수업 목록 ({uniqueNames.length}개)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {uniqueNames.map((name) => {
                            const classItems = classes.filter((c) => c.name === name);
                            const professor = classItems[0]?.professor;
                            const location = classItems[0]?.location;
                            const days = classItems
                                .map((c) => `${DAY_NAMES[c.day]} ${c.start_time}~${c.end_time}`)
                                .join(', ');

                            return (
                                <div key={name} className="flex items-center gap-4 p-3 border rounded-lg">
                                    <div className={`w-3 h-3 rounded-full ${colorMap[name].split(' ')[0]}`} />
                                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                                        <span className="font-medium">{name}</span>
                                        <span className="text-muted-foreground">{professor || '-'}</span>
                                        <span className="text-muted-foreground">{location || '-'}</span>
                                        <span className="text-muted-foreground">{days}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ==================== 경력 탭 컴포넌트 ====================

function CareerTab({ career }: { career: CareerProfile | null }) {
    if (!career || career.id === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>선배 이력</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">등록된 이력이 없습니다.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* 연락처 */}
            <Card>
                <CardHeader>
                    <CardTitle>연락처</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>이름</Label>
                            <p className="text-sm font-medium mt-1">{career.name || '-'}</p>
                        </div>
                        <div>
                            <Label>이메일</Label>
                            <p className="text-sm font-medium mt-1">{career.email || '-'}</p>
                        </div>
                        <div>
                            <Label>전화번호</Label>
                            <p className="text-sm font-medium mt-1">{career.phone || '-'}</p>
                        </div>
                        <div>
                            <Label>공개설정</Label>
                            <p className="text-sm font-medium mt-1">
                                {VISIBILITY_LABELS[career.visibility] || career.visibility}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 학력 */}
            {career.educations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>학력</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {career.educations.map((edu) => (
                                <div key={edu.id} className="p-3 border rounded-lg">
                                    <p className="font-medium">
                                        {edu.school} · {edu.major} · {edu.degree} · {edu.status}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {edu.start_date} ~ {edu.is_current ? '현재' : edu.end_date || '-'}
                                        {edu.region && ` · ${edu.region}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 경력 */}
            {career.works.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>경력</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {career.works.map((work) => (
                                <div key={work.id} className="p-3 border rounded-lg">
                                    <p className="font-medium">
                                        {work.company} · {work.position} · {work.employment_type}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {work.start_date} ~ {work.is_current ? '현재' : work.end_date || '-'}
                                        {work.region && ` · ${work.region}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 스킬 */}
            {career.skill_tags.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>스킬</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {career.skill_tags.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 자격증 */}
            {career.certifications.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>자격증</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {career.certifications.map((cert) => (
                                <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <span className="font-medium">{cert.name}</span>
                                    <span className="text-sm text-muted-foreground">{cert.date || '-'}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 대외활동 */}
            {career.activities.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>대외활동</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {career.activities.map((act) => (
                                <div key={act.id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{act.name}</span>
                                        <span className="text-sm text-muted-foreground">{act.period || '-'}</span>
                                    </div>
                                    {act.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{act.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 멘토 Q&A */}
            {career.is_mentor && career.mentor_qna && (
                <Card>
                    <CardHeader>
                        <CardTitle>멘토 Q&A</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <Label>수도권 취업 목표?</Label>
                                <p className="text-sm font-medium mt-1">
                                    {career.mentor_qna.targeted_capital === true ? '예' :
                                     career.mentor_qna.targeted_capital === false ? '아니오' : '-'}
                                </p>
                            </div>
                            {career.mentor_qna.reason_for_local && (
                                <div>
                                    <Label>지역 선택 이유</Label>
                                    <p className="text-sm mt-1">{career.mentor_qna.reason_for_local}</p>
                                </div>
                            )}
                            {career.mentor_qna.helpful_organizations && (
                                <div>
                                    <Label>도움된 기관</Label>
                                    <p className="text-sm mt-1">{career.mentor_qna.helpful_organizations}</p>
                                </div>
                            )}
                            {career.mentor_qna.local_advantages && (
                                <div>
                                    <Label>지역 장점</Label>
                                    <p className="text-sm mt-1">{career.mentor_qna.local_advantages}</p>
                                </div>
                            )}
                            {career.mentor_qna.local_disadvantages && (
                                <div>
                                    <Label>지역 단점</Label>
                                    <p className="text-sm mt-1">{career.mentor_qna.local_disadvantages}</p>
                                </div>
                            )}
                            {career.mentor_qna.advice_for_juniors && (
                                <div>
                                    <Label>후배에게 한마디</Label>
                                    <p className="text-sm mt-1">{career.mentor_qna.advice_for_juniors}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
