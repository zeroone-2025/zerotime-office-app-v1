export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
}

export function setAuthToken(token: string): void {
    localStorage.setItem('accessToken', token);
}

export function removeAuthToken(): void {
    localStorage.removeItem('accessToken');
}

export function isAuthenticated(): boolean {
    return !!getAuthToken();
}
