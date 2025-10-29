import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { isNativeApp } from "@/lib/platform";

import { User } from "@shared/schema";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  usernameOrEmail: string;
  password: string;
};

type RegisterData = {
  username: string;
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        data: credentials,
      });
      
      // Check if login failed
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Incorrect password");
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      // Mobile apps need longer delay for cross-origin session cookie propagation
      const delay = isNativeApp() ? 1000 : 300;
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        refetch(); 
      }, delay);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const response = await apiRequest("/api/register", {
        method: "POST",
        data: credentials,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setTimeout(() => {
        refetch();
      }, 100);
      toast({
        title: "Account created!",
        description: "Welcome to Christ Collective.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: "Please try again with different details.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      // Redirect to home page after logout
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear local data
      queryClient.clear();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}