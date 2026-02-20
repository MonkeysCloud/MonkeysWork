import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { api, setAuthToken } from "@/lib/api";

/* ── Types ──────────────────────────────────────── */
export type UserRole = "client" | "freelancer" | "admin";

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
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Storage helpers ───────────────────────────── */
const STORAGE_USER_KEY = "mw_user";
const STORAGE_TOKEN_KEY = "mw_token";

function saveAuth(user: AuthUser, token: string) {
    try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
        localStorage.setItem(STORAGE_TOKEN_KEY, token);
    } catch { /* ignore */ }
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
    } catch { /* ignore */ }
}

/* ── Provider ──────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate from localStorage on mount
    useEffect(() => {
        const stored = loadAuth();
        if (stored.user && stored.token) {
            setUser(stored.user);
            setToken(stored.token);
            setAuthToken(stored.token);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const body = await api<{
            data: {
                user_id: string;
                role: string;
                display_name?: string;
                profile_completed?: boolean;
                avatar_url?: string;
                token: string;
            };
        }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        const authUser: AuthUser = {
            id: body.data.user_id,
            email,
            role: body.data.role as UserRole,
            display_name: body.data.display_name ?? email.split("@")[0],
            profile_completed: !!body.data.profile_completed,
            avatar_url: body.data.avatar_url ?? null,
        };
        const authToken = body.data.token;

        setUser(authUser);
        setToken(authToken);
        setAuthToken(authToken);
        saveAuth(authUser, authToken);

        return authUser;
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        setAuthToken(null);
        clearAuth();
    }, []);

    const refreshUser = useCallback(async () => {
        if (!token) return;
        try {
            const body = await api<{ data: Record<string, unknown> }>("/users/me");
            const d = body.data;
            const updated: AuthUser = {
                id: d.id as string,
                email: d.email as string,
                role: d.role as UserRole,
                display_name: (d.display_name as string) ?? (d.email as string)?.split("@")[0],
                profile_completed: !!d.profile_completed,
                avatar_url: (d.avatar_url as string) ?? null,
            };
            setUser(updated);
            saveAuth(updated, token);
        } catch { /* ignore */ }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/* ── Hook ──────────────────────────────────────── */
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
    return ctx;
}
