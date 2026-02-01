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
    admission_year?: number;
    is_active: number;  // 1=활성, 0=비활성
    created_at: string;
    read_count: number;
    favorite_count: number;
    keyword_count: number;
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
    getAll: (params?: { skip?: number; limit?: number; search?: string; role?: string }) =>
        api.get<AdminUser[]>('/admin/users', { params }),

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
};

// 공지 관리
export const noticesAPI = {
    getAll: (params?: { skip?: number; limit?: number; board_code?: string; search?: string }) =>
        api.get<AdminNotice[]>('/admin/notices', { params }),

    delete: (noticeId: number) =>
        api.delete(`/admin/notices/${noticeId}`),
};
