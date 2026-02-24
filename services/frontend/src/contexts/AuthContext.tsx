"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8086/api/v1";

/* ── Types ──────────────────────────────────────────── */
export type UserRole = "client" | "freelancer" | "admin" | "pending";

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    display_name: string;
    profile_completed: boolean;
    avatar_url: string | null;
}

interface AuthContextValue {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    loginWithOAuth: (provider: string, code: string, role?: string) => Promise<AuthUser>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    setProfileCompleted: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Storage helpers ────────────────────────────────── */
const STORAGE_USER_KEY = "mw_user";
const STORAGE_TOKEN_KEY = "mw_token";

function saveAuth(user: AuthUser, token: string) {
    try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } catch {
        /* SSR or private browsing — ignore */
    }
}

function loadAuth(): { user: AuthUser | null; token: string | null } {
    try {
        const raw = localStorage.getItem(STORAGE_USER_KEY);
        const token = localStorage.getItem(STORAGE_TOKEN_KEY);
        return { user: raw ? JSON.parse(raw) : null, token };
    } catch {
        return { user: null, token: null };
    }
}

function clearAuth() {
    try {
        localStorage.removeItem(STORAGE_USER_KEY);
        localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
        /* noop */
    }
}

/* ── Provider ───────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    /* Hydrate from localStorage on mount */
    useEffect(() => {
        const stored = loadAuth();
        if (stored.user && stored.token) {
            setUser(stored.user);
            setToken(stored.token);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const body = await res.json();

        if (!res.ok) {
            const msg =
                res.status === 401
                    ? "Invalid email or password."
                    : res.status === 403
                        ? body.message || "Account suspended."
                        : body.message || "Login failed.";
            throw new Error(msg);
        }

        const authUser: AuthUser = {
            id: body.data.user_id,
            email,
            role: body.data.role as UserRole,
            display_name: body.data.display_name ?? email.split("@")[0],
            profile_completed: !!body.data.profile_completed,
            avatar_url: body.data.avatar_url ?? null,
        };
        const authToken = body.data.token as string;

        setUser(authUser);
        setToken(authToken);
        saveAuth(authUser, authToken);

        return authUser;
    }, []);

    const loginWithOAuth = useCallback(
        async (provider: string, code: string, role?: string) => {
            const res = await fetch(`${API_BASE}/auth/oauth/${provider}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, ...(role ? { role } : {}) }),
            });

            const body = await res.json();

            if (!res.ok) {
                throw new Error(
                    body.message || `OAuth login with ${provider} failed.`
                );
            }

            const authUser: AuthUser = {
                id: body.data.user_id,
                email: body.data.email ?? "",
                role: body.data.role as UserRole,
                display_name:
                    body.data.display_name ?? body.data.email?.split("@")[0] ?? "User",
                profile_completed: !!body.data.profile_completed,
                avatar_url: body.data.avatar_url ?? null,
            };
            const authToken = body.data.token as string;

            setUser(authUser);
            setToken(authToken);
            saveAuth(authUser, authToken);

            return authUser;
        },
        []
    );

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        clearAuth();
    }, []);

    /** Re-fetch user data from /users/me (e.g. after completing profile wizard) */
    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const body = await res.json();
            const d = body.data;
            const updated: AuthUser = {
                id: d.id,
                email: d.email,
                role: d.role as UserRole,
                display_name: d.display_name ?? d.email?.split("@")[0],
                profile_completed: !!d.profile_completed,
                avatar_url: d.avatar_url ?? null,
            };
            setUser(updated);
            saveAuth(updated, token);
        } catch {
            /* ignore network errors on refresh */
        }
    }, [token]);

    /** Locally set profile_completed without refetch */
    const setProfileCompleted = useCallback(() => {
        setUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, profile_completed: true };
            if (token) saveAuth(updated, token);
            return updated;
        });
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                loginWithOAuth,
                logout,
                refreshUser,
                setProfileCompleted,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/* ── Hook ───────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
