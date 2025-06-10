import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function AuthTestPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [status, setStatus] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [, navigate] = useLocation();

  const testLogin = async () => {
    try {
      setStatus("Logging in...");
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usernameOrEmail: username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setStatus("Login successful!");
      } else {
        setStatus("Login failed");
      }
    } catch (error) {
      setStatus("Login error: " + error);
    }
  };

  const testAuthStatus = async () => {
    try {
      setStatus("Checking auth...");
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setStatus("Authenticated!");
      } else {
        setUser(null);
        setStatus("Not authenticated (401)");
      }
    } catch (error) {
      setStatus("Auth check error: " + error);
    }
  };

  const testSponsorshipNavigation = async () => {
    try {
      setStatus("Checking auth for sponsorship...");
      const response = await fetch("/api/user", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.id) {
          setStatus("Auth confirmed, navigating to sponsorship page...");
          navigate("/sponsorship-application");
        } else {
          setStatus("No user data, going to auth page...");
          navigate("/auth");
        }
      } else {
        setStatus("Not authenticated, going to auth page...");
        navigate("/auth");
      }
    } catch (error) {
      setStatus("Navigation check error: " + error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Button onClick={testLogin} className="w-full">
              Test Login
            </Button>
            <Button onClick={testAuthStatus} variant="outline" className="w-full">
              Check Auth Status
            </Button>
            <Button onClick={testSponsorshipNavigation} variant="secondary" className="w-full">
              Test Sponsorship Navigation
            </Button>
          </div>

          <div className="p-3 bg-gray-100 rounded text-sm">
            <strong>Status:</strong> {status}
          </div>

          {user && (
            <div className="p-3 bg-green-100 rounded text-sm">
              <strong>User:</strong> {user.username} ({user.email})
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}