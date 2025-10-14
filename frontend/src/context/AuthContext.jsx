import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loginUserApi,
  registerUserApi,
  getMeApi,
  logoutUserApi,
} from "../api/userApi"

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // 'loading' | 'authenticated' | 'unauthenticated'
  const [error, setError] = useState(null);

  // --- actions ---
  const me = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const { data } = await getMeApi();
      setUser(data.user || null);
      setStatus(data?.user ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    setError(null);
    setStatus("loading");
    try {
      const { data } = await loginUserApi(identifier, password);
      setUser(data.user);
      setStatus("authenticated");
      return { ok: true, user: data.user };
    } catch (e) {
      const msg = e?.response?.data?.message || "Login failed";
      setError(msg);
      setStatus("unauthenticated");
      return { ok: false, error: msg };
    }
  }, []);

  const register = useCallback(async ({ fullName, username, email, password }) => {
    setError(null);
    setStatus("loading");
    try {
      const { data } = await registerUserApi({ fullName, username, email, password });
      setUser(data.user);
      setStatus("authenticated");
      return { ok: true, user: data.user };
    } catch (e) {
      const msg = e?.response?.data?.message || "Registration failed";
      setError(msg);
      setStatus("unauthenticated");
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await logoutUserApi();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  // --- bootstrap session once ---
  useEffect(() => {
    me();
  }, [me]);

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      isLoading: status === "loading",
      isAuthed: status === "authenticated",
      login,
      register,
      logout,
      me,
      setError, // expose if a screen wants to clear error
    }),
    [user, status, error, login, register, logout, me]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
