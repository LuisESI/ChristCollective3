import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export default function DebugAuthPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [apiTests, setApiTests] = useState<Record<string, any>>({});

  useEffect(() => {
    setSessionId(localStorage.getItem('sessionId'));
  }, []);

  // Test various API endpoints
  const testEndpoints = [
    '/api/user',
    '/api/group-chat-queues',
    '/api/notifications/unread-count',
    '/api/direct-chats',
  ];

  const runTests = async () => {
    const results: Record<string, any> = {};
    
    for (const endpoint of testEndpoints) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        const sid = localStorage.getItem('sessionId');
        if (sid) {
          headers['X-Session-ID'] = sid;
        }
        
        const res = await fetch(endpoint, {
          credentials: 'include',
          headers,
        });
        
        results[endpoint] = {
          status: res.status,
          ok: res.ok,
          data: res.ok ? await res.json().catch(() => null) : null,
        };
      } catch (error: any) {
        results[endpoint] = {
          status: 'error',
          ok: false,
          error: error.message,
        };
      }
    }
    
    setApiTests(results);
  };

  const clearSession = () => {
    localStorage.removeItem('sessionId');
    setSessionId(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#D4AF37] mb-6">Auth Debug Page</h1>

        {/* Auth State */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Auth State
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
              ) : user ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span>Loading:</span>
              <Badge variant={authLoading ? "default" : "secondary"}>
                {authLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>User:</span>
              <Badge variant={user ? "default" : "destructive"}>
                {user ? user.username : "Not authenticated"}
              </Badge>
            </div>
            {user && (
              <>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="text-sm font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-sm">{user.email || 'N/A'}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Session Info
              {sessionId ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-300">
            <div className="flex justify-between items-start">
              <span>Session ID:</span>
              <span className="text-sm font-mono break-all max-w-xs text-right">
                {sessionId || 'Not set'}
              </span>
            </div>
            <Button 
              onClick={clearSession}
              variant="destructive"
              size="sm"
              className="w-full mt-2"
            >
              Clear Session & Reload
            </Button>
          </CardContent>
        </Card>

        {/* API Tests */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              API Endpoint Tests
              <Button 
                onClick={runTests}
                size="sm"
                className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Tests
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(apiTests).length === 0 ? (
              <p className="text-gray-400 text-sm">Click "Run Tests" to test API endpoints</p>
            ) : (
              Object.entries(apiTests).map(([endpoint, result]) => (
                <div key={endpoint} className="border border-gray-700 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-300">{endpoint}</span>
                    <Badge 
                      variant={result.ok ? "default" : "destructive"}
                      className={result.ok ? "bg-green-600" : ""}
                    >
                      {result.status}
                    </Badge>
                  </div>
                  {result.data && (
                    <pre className="text-xs bg-black p-2 rounded overflow-auto max-h-32 text-gray-400">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-400">Error: {result.error}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Debug Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 text-sm space-y-2">
            <p><strong className="text-[#D4AF37]">Expected Behavior:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Auth State should show your username</li>
              <li>Session ID should be present in localStorage</li>
              <li>All API tests should return 200 (OK)</li>
            </ul>
            <p className="mt-4"><strong className="text-[#D4AF37]">If tests fail:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Click "Clear Session & Reload"</li>
              <li>Login again</li>
              <li>Come back to this page and run tests</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
