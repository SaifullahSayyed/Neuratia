import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  full_name: string;
  role: "patient" | "doctor" | "admin";
  age?: number;
  education_level?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: "patient" | "doctor" | "admin";
  loading: boolean;
  signOut: () => Promise<void>;
  token: string | null;
  loginDemoUser: (role?: "patient" | "doctor" | "admin") => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: "patient",
  loading: true,
  signOut: async () => {},
  token: null,
  loginDemoUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .single();
      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Continue with metadata role
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginDemoUser = (targetRole: "patient" | "doctor" | "admin" = "patient") => {
    const demoId = `demo-${targetRole}-123`;
    const mockUser: User = {
      id: demoId,
      app_metadata: {},
      user_metadata: { role: targetRole, full_name: `Demo ${targetRole.toUpperCase()}` },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as any;

    const mockSession: Session = {
      access_token: "mock-demo-jwt-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user: mockUser,
    };

    setUser(mockUser);
    setSession(mockSession);
    setProfile({
      id: demoId,
      full_name: `Demo ${targetRole.toUpperCase()}`,
      role: targetRole,
    });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors on sign out
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || (user?.user_metadata?.role as "patient" | "doctor" | "admin") || "patient";
  const token = session?.access_token || null;

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, token, loginDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
