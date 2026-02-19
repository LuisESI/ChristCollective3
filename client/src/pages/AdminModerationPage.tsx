import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Shield, AlertTriangle, Eye, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { ModerationLog } from "@shared/schema";

interface ModerationLogWithUser extends ModerationLog {
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  } | null;
}

export default function AdminModerationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("flagged");

  useEffect(() => {
    if (!authLoading && user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/"; }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: stats } = useQuery<{ total: number; approved: number; flagged: number; rejected: number }>({
    queryKey: ["/api/admin/moderation/stats"],
    enabled: user?.isAdmin === true,
  });

  const { data: logs = [], isLoading } = useQuery<ModerationLogWithUser[]>({
    queryKey: ["/api/admin/moderation", activeTab],
    queryFn: async () => {
      const res = await apiRequest(`/api/admin/moderation?decision=${activeTab}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: user?.isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/moderation/${id}/approve`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      toast({ title: "Content approved", description: "The content is now visible to users." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve content.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/admin/moderation/${id}/reject`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderation/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-posts"] });
      toast({ title: "Content rejected", description: "The content has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject content.", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const decisionBadge = (decision: string) => {
    switch (decision) {
      case "approved":
        return <Badge className="bg-green-600 text-white">Approved</Badge>;
      case "flagged":
        return <Badge className="bg-yellow-600 text-white">Flagged</Badge>;
      case "rejected":
        return <Badge className="bg-red-600 text-white">Rejected</Badge>;
      default:
        return <Badge>{decision}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-[#D4AF37] hover:bg-[#D4AF37]/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Shield className="h-6 w-6 text-[#D4AF37]" />
          <h1 className="text-2xl font-bold text-[#D4AF37]">Content Moderation</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-[#0A0A0A] border-[#333]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[#333]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats?.approved || 0}</div>
              <div className="text-xs text-gray-400">Approved</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[#333]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats?.flagged || 0}</div>
              <div className="text-xs text-gray-400">Flagged</div>
            </CardContent>
          </Card>
          <Card className="bg-[#0A0A0A] border-[#333]">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</div>
              <div className="text-xs text-gray-400">Rejected</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1A1A1A] border border-[#333] mb-4">
            <TabsTrigger value="flagged" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              <AlertTriangle className="h-4 w-4 mr-1" /> Flagged
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              <CheckCircle className="h-4 w-4 mr-1" /> Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              <XCircle className="h-4 w-4 mr-1" /> Rejected
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="text-center text-gray-400 py-10">Loading moderation logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No {activeTab} content found.</div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <Card key={log.id} className="bg-[#0A0A0A] border-[#333]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 border border-[#D4AF37]">
                            <AvatarImage src={log.user?.profileImageUrl || ""} />
                            <AvatarFallback className="bg-[#1A1A1A] text-[#D4AF37]">
                              {log.user?.displayName?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-sm">
                                {log.user?.displayName || "Unknown"}
                              </span>
                              {decisionBadge(log.decision)}
                              <Badge variant="outline" className="border-[#333] text-gray-400 text-xs">
                                {log.contentType}
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm break-words">
                              {log.contentPreview || "No preview available"}
                            </p>
                            {(() => {
                              const cats = log.flagCategories as string[] | null;
                              if (!cats || !Array.isArray(cats) || cats.length === 0) return null;
                              return (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {cats.map((cat: string) => (
                                    <Badge key={cat} variant="outline" className="border-red-800 text-red-400 text-xs">
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              );
                            })()}
                            <div className="text-xs text-gray-500 mt-2">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                            </div>
                          </div>
                        </div>
                        {log.decision === "flagged" && (
                          <div className="flex gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="bg-green-700 hover:bg-green-600 text-white"
                              onClick={() => approveMutation.mutate(log.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectMutation.mutate(log.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
