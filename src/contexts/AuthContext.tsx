import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { AUTH_LOGOUT_EVENT } from "@/api/client";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/lib/authToken";
import type { LoginPayload, RegisterPayload, User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isLoadingUser: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY_KEY = ["auth", "me"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const hasToken = Boolean(getAuthToken());

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: authApi.me,
    enabled: hasToken,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    function handleLogout() {
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
      navigate("/login", { replace: true });
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ token, user }) => {
      setAuthToken(token);
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ token, user }) => {
      setAuthToken(token);
      queryClient.setQueryData(ME_QUERY_KEY, user);
    },
  });

  function logout() {
    authApi.logout().catch(() => {
      // Best-effort server-side revocation; client state is cleared regardless.
    });
    clearAuthToken();
    queryClient.setQueryData(ME_QUERY_KEY, null);
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isLoadingUser: hasToken && meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data),
      login: (payload) => loginMutation.mutateAsync(payload).then((res) => res.user),
      register: (payload) => registerMutation.mutateAsync(payload).then((res) => res.user),
      logout,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meQuery.data, meQuery.isLoading, hasToken, loginMutation.isPending, registerMutation.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
