import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Axios 인스턴스 생성
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 시 로그아웃 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// ==================== 타입 정의 ====================

export interface DashboardStats {
    total_users: number;
    total_notices: number;
    total_reads: number;
    total_favorites: number;
    new_users_today: number;
    new_notices_today: number;
    admin_count: number;
    super_admin_count: number;
}

export interface AdminUser {
    id: number;
    email: string;
    username?: string;
    nickname?: string;
    dept_code?: string;
    school: string;
    profile_image?: string;
    role: 'user' | 'admin' | 'super_admin';
    user_type: 'student' | 'mentor';
    admission_year?: number;
    is_active: number;  // 1=활성, 0=비활성
    created_at: string;
    read_count: number;
    favorite_count: number;
    keyword_count: number;
}

export interface AdminUserListResponse {
    users: AdminUser[];
    total: number;
    page: number;
    limit: number;
    student_count: number;
    mentor_count: number;
}

export interface AdminUserListParams {
    page?: number;
    limit?: number;
    role?: string;
    user_type?: string;
    sort?: string;
    order?: string;
}

export interface AdminUserDetail extends AdminUser {
    google_id: string;
    updated_at?: string;
    is_active: number;  // 1=활성, 0=비활성
    recent_reads?: Array<{ notice_id: number; read_at: string }>;
    favorites?: Array<{ notice_id: number; favorited_at: string }>;
    subscriptions: string[];
}

export interface AdminNotice {
    id: number;
    title: string;
    link: string;
    board_code: string;
    date: string;
    view: number;
    created_at: string;
    read_count: number;
    favorite_count: number;
}

export interface Notice {
    id: number;
    title: string;
    link: string;
    board_code: string;
    date: string;
    view: number;
    created_at: string;
    is_read: boolean;
    is_favorite: boolean;
    favorite_created_at?: string;
    matched_keywords: string[];
}

export interface Keyword {
    id: number;
    keyword: string;
    created_at: string;
}

// ==================== 시간표 타입 ====================

export interface TimetableClass {
    id: number;
    name: string;
    professor?: string;
    location?: string;
    day: number;
    start_time: string;
    end_time: string;
}

export interface Timetable {
    id: number;
    user_id: number;
    semester: string;
    classes: TimetableClass[];
    created_at: string;
    updated_at: string;
}

// ==================== 경력 타입 ====================

export interface CareerEducation {
    id: number;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    school: string;
    major: string;
    degree: string;
    status: string;
    region?: string;
}

export interface CareerWork {
    id: number;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    company: string;
    position: string;
    employment_type: string;
    region?: string;
}

export interface CareerCertification {
    id: number;
    name: string;
    date?: string;
}

export interface CareerActivity {
    id: number;
    name: string;
    period?: string;
    description?: string;
}

export interface MentorQnA {
    targeted_capital?: boolean;
    reason_for_local?: string;
    helpful_organizations?: string;
    local_advantages?: string;
    local_disadvantages?: string;
    advice_for_juniors?: string;
}

export interface CareerProfile {
    id: number;
    name?: string;
    email?: string;
    phone?: string;
    visibility: string;
    skill_tags: string[];
    is_mentor: boolean;
    educations: CareerEducation[];
    works: CareerWork[];
    certifications: CareerCertification[];
    activities: CareerActivity[];
    mentor_qna?: MentorQnA;
}

// ==================== API 함수 ====================

// 인증
export const authAPI = {
    login: (token: string) => api.post('/auth/google', { token }),
    getCurrentUser: () => api.get('/users/me'),
};

// 대시보드
export const dashboardAPI = {
    getStats: () => api.get<DashboardStats>('/admin/stats'),
};

// 유저 관리
export const usersAPI = {
    getAll: (params?: AdminUserListParams) =>
        api.get<AdminUserListResponse>('/admin/users', { params }),

    getDetail: (userId: number) =>
        api.get<AdminUserDetail>(`/admin/users/${userId}`),

    getReads: (userId: number, params?: { skip?: number; limit?: number }) =>
        api.get<Notice[]>(`/admin/users/${userId}/reads`, { params }),

    getFavorites: (userId: number, params?: { skip?: number; limit?: number }) =>
        api.get<Notice[]>(`/admin/users/${userId}/favorites`, { params }),

    getKeywords: (userId: number) =>
        api.get<Keyword[]>(`/admin/users/${userId}/keywords`),

    update: (userId: number, data: { nickname?: string; role?: string; dept_code?: string; school?: string }) =>
        api.patch<AdminUser>(`/admin/users/${userId}`, data),

    softDelete: (userId: number) =>
        api.delete(`/admin/users/${userId}/soft`),

    hardDelete: (userId: number) =>
        api.delete(`/admin/users/${userId}/hard`),

    restore: (userId: number) =>
        api.post(`/admin/users/${userId}/restore`),

    getTimetable: (userId: number, semester?: string) =>
        api.get<Timetable | null>(`/admin/users/${userId}/timetable`, { params: semester ? { semester } : undefined }),

    getCareer: (userId: number) =>
        api.get<CareerProfile>(`/admin/users/${userId}/career`),
};

// 공지 관리
export interface AdminNoticeListResponse {
    notices: AdminNotice[];
    total: number;
    page: number;
    limit: number;
}

export const noticesAPI = {
    getAll: (params?: { page?: number; limit?: number; board_code?: string; search?: string }) =>
        api.get<AdminNoticeListResponse>('/admin/notices', { params }),

    delete: (noticeId: number) =>
        api.delete(`/admin/notices/${noticeId}`),
};

// ==================== 학과 ====================

export interface Department {
    id: number;
    dept_code: string;
    dept_name: string;
    college_name?: string;
    school: string;
}

export const departmentsAPI = {
    getAll: () => api.get<Department[]>('/departments'),
};

// ==================== 친바 이벤트 타입 ====================

export interface AdminChinbaEvent {
    event_id: string;
    title: string;
    dates: string[];
    start_hour: number;
    end_hour: number;
    status: 'active' | 'completed' | 'expired';
    creator_id: number;
    creator_nickname?: string;
    creator_email?: string;
    participant_count: number;
    submitted_count: number;
    created_at: string;
}

export interface AdminChinbaParticipant {
    user_id: number;
    nickname?: string;
    email?: string;
    has_submitted: boolean;
    submitted_at?: string;
}

export interface AdminChinbaEventDetail extends AdminChinbaEvent {
    participants: AdminChinbaParticipant[];
    updated_at?: string;
}

export interface AdminChinbaEventListResponse {
    items: AdminChinbaEvent[];
    total: number;
    page: number;
    per_page: number;
}

// 친바 이벤트 관리
export const chinbaAPI = {
    getAll: (params?: { skip?: number; limit?: number; status?: string }) =>
        api.get<AdminChinbaEventListResponse>('/admin/chinba/events', { params }),
    getDetail: (eventId: string) =>
        api.get<AdminChinbaEventDetail>(`/admin/chinba/events/${eventId}`),
    getParticipants: (eventId: string) =>
        api.get<AdminChinbaParticipant[]>(`/admin/chinba/events/${eventId}/participants`),
};
