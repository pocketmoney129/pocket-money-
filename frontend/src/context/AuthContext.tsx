"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "../services/api";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "user" | "admin";
  status: "inactive" | "active" | "suspended";
  sponsor: string | null;
  referralCode: string;
  walletBalance: number;
  totalIncome: number;
  kyc: {
    status: "none" | "pending" | "approved" | "rejected";
    documentType?: string;
    documentNumber?: string;
    documentFront?: string;
    documentBack?: string;
    remarks?: string;
  };
  bankDetails: {
    holderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifsc?: string;
    upiId?: string;
  };
  activePackage?: { _id: string; name: string; price: number } | null;
  packageActivatedAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<any>;
  verifyRegistrationOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  syncProfile: () => Promise<void>;
  updateUserBalance: (amount: number) => void;
  updateKycStatus: (kyc: any) => void;
  updateBankDetails: (details: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/user/profile");
          if (res.success) {
            setUser(res.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Protected route guards
  useEffect(() => {
    if (!loading) {
      const isDashboardRoute = pathname?.startsWith("/dashboard");
      const isAuthRoute = pathname === "/login" || pathname === "/register";

      if (isDashboardRoute && !user) {
        router.push("/login");
      } else if (isAuthRoute && user) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { usernameOrEmail, password });
      if (res.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data);
        router.push("/dashboard");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to login");
    }
  };

  const register = async (userData: any) => {
    try {
      const res = await api.post("/auth/register", userData);
      return res;
    } catch (error: any) {
      throw new Error(error.message || "Failed to register");
    }
  };

  const verifyRegistrationOtp = async (email: string, otp: string) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      if (res.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data);
        router.push("/dashboard");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to verify OTP");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  const syncProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      if (res.success) {
        setUser(res.data);
      }
    } catch (error) {
      console.error("Failed to sync profile:", error);
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, walletBalance: newBalance });
    }
  };

  const updateKycStatus = (kyc: any) => {
    if (user) {
      setUser({ ...user, kyc });
    }
  };

  const updateBankDetails = (bankDetails: any) => {
    if (user) {
      setUser({ ...user, bankDetails });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyRegistrationOtp,
        logout,
        syncProfile,
        updateUserBalance,
        updateKycStatus,
        updateBankDetails
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
