"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signInDirect: (userObj: Profile) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signInDirect: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    try {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (data) {
          const isAdminRole = data.role === "admin" || data.email === "admin@example.com" || (userEmail && userEmail.startsWith("admin@"));
          setProfile({
            ...data,
            role: isAdminRole ? "admin" : data.role,
          } as Profile);
          return;
        }
      }
    } catch {
      // ignore
    }

    const emailToCheck = userEmail || user?.email || "";
    const isAdminEmail = emailToCheck === "admin@example.com" || emailToCheck.startsWith("admin@");
    const localRole = localStorage.getItem("demo_role");

    setProfile({
      id: userId,
      email: emailToCheck,
      display_name: isAdminEmail ? "Administrator" : "Kupujący",
      role: (isAdminEmail || localRole === "admin") ? "admin" : "customer",
      created_at: new Date().toISOString(),
    });
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signInDirect = (userObj: Profile) => {
    const u = { id: userObj.id, email: userObj.email } as User;
    setUser(u);
    setProfile(userObj);
    localStorage.setItem("demo_user", JSON.stringify(userObj));
    localStorage.setItem("demo_role", userObj.role);
  };

  useEffect(() => {
    let mounted = true;
    const checkUser = async () => {
      // 1. Sprawdź najpierw demo session w localStorage
      const demoUserStr = localStorage.getItem("demo_user");
      if (demoUserStr) {
        try {
          const parsed = JSON.parse(demoUserStr);
          if (mounted) {
            setUser({ id: parsed.id, email: parsed.email } as User);
            setProfile(parsed);
            setLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }

      // 2. Sprawdź Supabase
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && mounted) {
            setUser(session.user);
            await fetchProfile(session.user.id, session.user.email);
          }
        }
      } catch (e) {
        console.warn("Supabase session check skipped", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem("demo_user");
    localStorage.removeItem("demo_role");
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        signInDirect,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
