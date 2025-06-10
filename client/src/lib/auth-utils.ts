// Authentication utility functions
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch("/api/user", {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    return response.ok && response.status === 200;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}

export async function loginUser(credentials: { usernameOrEmail: string; password: string }) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      console.warn(`Logout request failed: ${response.status}`);
    }
    
    // Clear any local storage or session data
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (error) {
    console.error("Logout failed:", error);
    // Force reload anyway to clear state
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
}