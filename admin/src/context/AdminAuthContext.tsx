"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "../services/api";

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  username: string;
  role: "admin";
  walletBalance: number;
}

interface AdminAuthContextType {
  admin: AdminProfile | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  syncProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("admin_token");
      if (token) {
        try {
          const res = await api.get("/user/profile"); // Same profile check
          if (res.success && res.data.role === "admin") {
            setAdmin(res.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Admin auth initialization error:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Admin route guards
  useEffect(() => {
    if (!loading) {
      const isDashboardRoute = pathname?.startsWith("/dashboard");
      const isLoginRoute = pathname === "/login";

      if (isDashboardRoute && !admin) {
        router.push("/login");
      } else if (isLoginRoute && admin) {
        router.push("/dashboard");
      } else if (pathname === "/") {
        router.push(admin ? "/dashboard" : "/login");
      }
    }
  }, [admin, loading, pathname, router]);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { usernameOrEmail, password });
      if (res.success) {
        if (res.data.role !== "admin") {
          throw new Error("Access Denied: Admin access only");
        }
        localStorage.setItem("admin_token", res.data.token);
        setAdmin(res.data);
        router.push("/dashboard");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to login");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setAdmin(null);
    router.push("/login");
  };

  const syncProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      if (res.success && res.data.role === "admin") {
        setAdmin(res.data);
      }
    } catch (error) {
      console.error("Failed to sync admin profile:", error);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, syncProfile }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
