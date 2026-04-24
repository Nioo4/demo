"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getBrowserSupabaseClient, isBrowserSupabaseConfigured } from "@/lib/supabase-browser";

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isBrowserSupabaseConfigured();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = getBrowserSupabaseClient();
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      isLoading,
      session,
      user,
      async signIn(email, password) {
        if (!isConfigured) {
          return "未配置浏览器端 Supabase。";
        }

        const supabase = getBrowserSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(email, password) {
        if (!isConfigured) {
          return "未配置浏览器端 Supabase。";
        }

        const supabase = getBrowserSupabaseClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window === "undefined" ? undefined : `${window.location.origin}/auth`
          }
        });

        if (error) {
          return error.message;
        }

        if (!data.session) {
          return "注册成功，请先完成邮箱验证后再登录。";
        }

        return null;
      },
      async signOut() {
        if (!isConfigured) {
          return;
        }

        const supabase = getBrowserSupabaseClient();
        await supabase.auth.signOut();
      }
    }),
    [isConfigured, isLoading, session, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
