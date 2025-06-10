import React, { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
};

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
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const userData = await response.json();
        return userData;
      } catch (error) {
        console.error("Auth query error:", error);
        return null;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 0, // Always refetch to ensure fresh auth state
    gcTime: 0, // Don't cache auth data
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Login failed: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Force a refetch to ensure auth state is updated
      setTimeout(() => {
        refetch();
      }, 100);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Sign in failed",
        description: "Please check your username and password.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Registration failed: ${response.status}`);
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