import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Trash2, Clock, DollarSign, Users, Building, Receipt, UserCheck, Search, Eye, Calendar, Mail, X, Phone, MapPin, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Campaign, User, Donation, SponsorshipApplication } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);



  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && user && !user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: pendingCampaigns, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/campaigns/pending"],
    enabled: user?.isAdmin === true,
  });

  const { data: allCampaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ["/api/admin/campaigns"],
    enabled: user?.isAdmin === true,
  });

  // Fetch all users for admin management
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.isAdmin === true,
  });

  // Fetch all transactions
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: user?.isAdmin === true,
  });

  // Fetch sponsorship applications
  const { data: sponsorshipApplications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/admin/sponsorship-applications"],
    enabled: user?.isAdmin === true,
  });

  // Fetch pending ministries for approval
  const { data: pendingMinistries = [], isLoading: ministriesLoading } = useQuery({
    queryKey: ["/api/ministries/pending"],
    enabled: user?.isAdmin === true,
  });

  const approveMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("POST", `/api/admin/campaigns/${campaignId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({
        title: "Campaign Approved",
        description: "The campaign has been approved and is now live.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("POST", `/api/admin/campaigns/${campaignId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({
        title: "Campaign Rejected",
        description: "The campaign has been rejected.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      await apiRequest("DELETE", `/api/admin/campaigns/${campaignId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({
        title: "Campaign Deleted",
        description: "The campaign has been permanently removed.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sponsorship application mutations
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      await apiRequest("POST", `/api/admin/sponsorship-applications/${applicationId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsorship-applications"] });
      toast({
        title: "Application Approved",
        description: "The sponsorship application has been approved.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      await apiRequest("POST", `/api/admin/sponsorship-applications/${applicationId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sponsorship-applications"] });
      toast({
        title: "Application Rejected",
        description: "The sponsorship application has been rejected.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Ministry approval mutations
  const approveMinistryMutation = useMutation({
    mutationFn: async (ministryId: number) => {
      await apiRequest("PATCH", `/api/ministries/${ministryId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ministries"] });
      toast({
        title: "Ministry Approved",
        description: "The ministry profile has been approved and is now live.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMinistryMutation = useMutation({
    mutationFn: async (ministryId: number) => {
      await apiRequest("PATCH", `/api/ministries/${ministryId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ministries/pending"] });
      toast({
        title: "Ministry Rejected",
        description: "The ministry profile has been rejected and removed.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter users based on search query
  const filteredUsers = Array.isArray(allUsers) ? allUsers.filter((user: User) =>
    !searchQuery || 
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage campaigns, transactions, and user accounts.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pending Ministries</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {ministriesLoading ? "..." : Array.isArray(pendingMinistries) ? pendingMinistries.length : 0}
                  </p>
                </div>
                <Building className="h-8 w-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pending Campaigns</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {pendingLoading ? "..." : Array.isArray(pendingCampaigns) ? pendingCampaigns.length : 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Users</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {usersLoading ? "..." : Array.isArray(allUsers) ? allUsers.length : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Raised</p>
                  <p className="text-xl font-bold text-primary mt-1">
                    {transactionsLoading 
                      ? "..." 
                      : formatCurrency(
                          Array.isArray(allTransactions) ? allTransactions.reduce((sum: number, transaction: Donation) => 
                            sum + (Number(transaction.amount) || 0), 0
                          ) : 0
                        )
                    }
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="ministries" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-gray-900 border-gray-800 text-xs gap-2 p-2">
            <TabsTrigger value="ministries" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">Ministries</span>
                <span className="text-xs opacity-70">({Array.isArray(pendingMinistries) ? pendingMinistries.length : 0})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">Campaigns</span>
                <span className="text-xs opacity-70">({Array.isArray(pendingCampaigns) ? pendingCampaigns.length : 0})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="sponsorships" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">Sponsors</span>
                <span className="text-xs opacity-70">({Array.isArray(sponsorshipApplications) ? sponsorshipApplications.filter((app: SponsorshipApplication) => app.status === 'pending').length : 0})</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md hidden lg:flex">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">All Campaigns</span>
                <span className="text-xs opacity-70">Manage</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md hidden lg:flex">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">Transactions</span>
                <span className="text-xs opacity-70">View</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-primary data-[state=active]:text-black px-3 py-3 rounded-md hidden lg:flex">
              <div className="flex flex-col items-center gap-1">
                <span className="font-medium text-xs">Users</span>
                <span className="text-xs opacity-70">Manage</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-primary mb-4">All Transactions</h2>
              {transactionsLoading ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-3 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : Array.isArray(allTransactions) && allTransactions.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No transactions found.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Date</TableHead>
                          <TableHead className="text-gray-300">Amount</TableHead>
                          <TableHead className="text-gray-300">Campaign</TableHead>
                          <TableHead className="text-gray-300">Transaction ID</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(allTransactions) && allTransactions.map((transaction: Donation) => (
                          <TableRow key={transaction.id} className="border-gray-700">
                            <TableCell className="text-gray-300">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>{formatDate(transaction.createdAt || new Date())}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-green-400 font-medium">
                              {formatCurrency(Number(transaction.amount))}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {transaction.campaignId}
                            </TableCell>
                            <TableCell className="text-gray-400 font-mono text-sm">
                              {transaction.stripePaymentId}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-900 text-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-primary">User Management</h2>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              {usersLoading ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-3 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredUsers.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No users found.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">User</TableHead>
                          <TableHead className="text-gray-300">Email</TableHead>
                          <TableHead className="text-gray-300">Joined</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user: User) => (
                          <TableRow key={user.id} className="border-gray-700">
                            <TableCell className="text-gray-300">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-gray-700 text-gray-300">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                                  <p className="text-sm text-gray-500">@{user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatDate(user.createdAt || new Date())}
                            </TableCell>
                            <TableCell>
                              <Badge className={user.isAdmin ? "bg-purple-900 text-purple-300" : "bg-green-900 text-green-300"}>
                                <UserCheck className="h-3 w-3 mr-1" />
                                {user.isAdmin ? "Admin" : "User"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-primary mb-4">All Campaigns</h2>
              {campaignsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-gray-700 rounded w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : Array.isArray(allCampaigns) && allCampaigns.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Building className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No active campaigns found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(allCampaigns) && allCampaigns.map((campaign: Campaign) => (
                    <Card key={campaign.id} className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{campaign.title}</CardTitle>
                            <CardDescription className="text-gray-400 mt-2">
                              {formatCurrency(Number(campaign.currentAmount))} of {formatCurrency(Number(campaign.goal))} raised • 
                              Status: {campaign.status}
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-900 text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                              <div
                                className="bg-primary h-2 rounded-full shadow-lg shadow-primary/50"
                                style={{
                                  width: `${Math.min(
                                    (Number(campaign.currentAmount) / Number(campaign.goal)) * 100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-400">
                              {Math.round((Number(campaign.currentAmount) / Number(campaign.goal)) * 100)}% funded
                            </p>
                          </div>
                          <div className="ml-4 flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                              onClick={() => {/* Add view transactions functionality */}}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              Transactions
                            </Button>
                            <Button
                              onClick={() => deleteMutation.mutate(campaign.id)}
                              disabled={deleteMutation.isPending}
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sponsorships" className="space-y-6">
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-primary mb-4">Sponsorship Applications</h2>
              {applicationsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-gray-700 rounded w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : Array.isArray(sponsorshipApplications) && sponsorshipApplications.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <UserCheck className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No sponsorship applications yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(sponsorshipApplications) && sponsorshipApplications.map((application: SponsorshipApplication) => (
                    <Card key={application.id} className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-white">{application.name}</CardTitle>
                            <CardDescription className="text-gray-400 mt-1">
                              {application.email}
                            </CardDescription>
                            
                            {/* Platforms */}
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-300 mb-2">Platforms:</p>
                              <div className="flex flex-wrap gap-2">
                                {Array.isArray(application.platforms) && application.platforms.map((platform: any, index: number) => (
                                  <a
                                    key={index}
                                    href={platform.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block"
                                  >
                                    <Badge variant="outline" className="text-xs hover:bg-blue-900 hover:border-blue-600 transition-colors cursor-pointer">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      {platform.platform} ({platform.subscriberCount ? platform.subscriberCount.toLocaleString() : 'N/A'} followers)
                                    </Badge>
                                  </a>
                                ))}
                              </div>
                            </div>

                            {/* Content Description */}
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-300">Content:</p>
                              <p className="text-gray-400 text-sm mt-1 line-clamp-2">{application.content}</p>
                            </div>

                            {/* Target Audience */}
                            {application.audience && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-300">Target Audience:</p>
                                <p className="text-gray-400 text-sm">{application.audience}</p>
                              </div>
                            )}

                            {/* Message */}
                            {application.message && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-300">Why they want to join:</p>
                                <p className="text-gray-400 text-sm mt-1 line-clamp-3">{application.message}</p>
                              </div>
                            )}

                            <div className="mt-3 text-xs text-gray-500">
                              Applied: {application.createdAt ? formatDate(application.createdAt) : 'Unknown'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Badge 
                              className={
                                application.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                                application.status === 'approved' ? 'bg-green-900 text-green-300' :
                                'bg-red-900 text-red-300'
                              }
                            >
                              {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {application.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {application.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {application.status === 'pending' && (
                        <CardContent>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-700 hover:bg-green-600 text-white"
                              onClick={() => approveApplicationMutation.mutate(application.id)}
                              disabled={approveApplicationMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {approveApplicationMutation.isPending ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectApplicationMutation.mutate(application.id)}
                              disabled={rejectApplicationMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {rejectApplicationMutation.isPending ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ministries" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Ministry Profile Approvals</h2>
              {ministriesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-gray-700 rounded w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : Array.isArray(pendingMinistries) && pendingMinistries.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Building className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No pending ministry profiles.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Array.isArray(pendingMinistries) && pendingMinistries.map((ministry: any) => (
                    <Card key={ministry.id} className="bg-gray-900/50 border-gray-700 backdrop-blur overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                          {/* Ministry Logo */}
                          <div className="flex-shrink-0">
                            <Avatar className="h-20 w-20 mx-auto sm:mx-0">
                              <AvatarImage src={ministry.logo} alt={ministry.name} />
                              <AvatarFallback className="bg-primary text-black text-2xl font-bold">
                                {ministry.name?.charAt(0) || 'M'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {/* Ministry Details */}
                          <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-xl font-bold text-white mb-2">{ministry.name}</h3>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                  {ministry.denomination && (
                                    <Badge variant="outline" className="text-xs bg-blue-900/30 border-blue-600 text-blue-300">
                                      {ministry.denomination}
                                    </Badge>
                                  )}
                                  <Badge className="bg-yellow-900/30 border-yellow-600 text-yellow-300">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Review
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Description */}
                            <div className="mb-6">
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {ministry.description}
                              </p>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                              <div className="space-y-3">
                                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-400">
                                  <Mail className="h-4 w-4 mr-2 text-primary" />
                                  <span className="break-all">{ministry.email}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-400">
                                  <Phone className="h-4 w-4 mr-2 text-primary" />
                                  <span>{ministry.phone}</span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-400">
                                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                                  <span className="break-words">{ministry.address}</span>
                                </div>
                                {ministry.website && (
                                  <div className="flex items-center justify-center sm:justify-start text-sm text-gray-400">
                                    <ExternalLink className="h-4 w-4 mr-2 text-primary" />
                                    <a 
                                      href={ministry.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline break-all"
                                    >
                                      {ministry.website}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                              <div className="flex gap-3">
                                <Button
                                  size="sm"
                                  className="bg-green-700 hover:bg-green-600 text-white px-6"
                                  onClick={() => approveMinistryMutation.mutate(ministry.id)}
                                  disabled={approveMinistryMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {approveMinistryMutation.isPending ? "Approving..." : "Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="px-6"
                                  onClick={() => rejectMinistryMutation.mutate(ministry.id)}
                                  disabled={rejectMinistryMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {rejectMinistryMutation.isPending ? "Rejecting..." : "Reject"}
                                </Button>
                              </div>
                              <div className="text-xs text-gray-500 sm:ml-auto">
                                Submitted: {ministry.createdAt ? formatDate(ministry.createdAt) : 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-primary mb-4">Pending Campaign Approvals</h2>
              {pendingLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-gray-700 rounded w-20"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : Array.isArray(pendingCampaigns) && pendingCampaigns.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No pending campaigns to review.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(pendingCampaigns) && pendingCampaigns.map((campaign: Campaign) => (
                    <Card key={campaign.id} className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-white">{campaign.title}</CardTitle>
                            <CardDescription className="text-gray-400 mt-2">
                              Goal: {formatCurrency(Number(campaign.goal))}
                            </CardDescription>
                            <p className="text-gray-300 mt-3 line-clamp-3">{campaign.description}</p>
                          </div>
                          <Badge className="bg-yellow-900 text-yellow-300 ml-4">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-400">
                            <p>Created: {formatDate(campaign.createdAt || new Date())}</p>
                            {campaign.image && (
                              <p className="mt-1">
                                <span className="text-green-400">✓</span> Image attached
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => approveMutation.mutate(campaign.id)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => rejectMutation.mutate(campaign.id)}
                              disabled={rejectMutation.isPending}
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => deleteMutation.mutate(campaign.id)}
                              disabled={deleteMutation.isPending}
                              variant="outline"
                              className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Modal */}
        {selectedUser && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="max-w-4xl bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedUser.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gray-700 text-gray-300 text-lg">
                        {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl font-bold text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </DialogTitle>
                      <DialogDescription className="text-gray-400">
                        @{selectedUser.username} • {selectedUser.isAdmin ? 'Administrator' : 'User'}
                      </DialogDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center">
                        <Mail className="h-5 w-5 mr-2 text-primary" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">{selectedUser.email || 'No email provided'}</span>
                      </div>
                      {selectedUser.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{selectedUser.phone}</span>
                        </div>
                      )}
                      {selectedUser.location && (
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{selectedUser.location}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-primary" />
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-300 font-mono text-sm">{selectedUser.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Account Type:</span>
                        <Badge className={selectedUser.isAdmin ? "bg-purple-900 text-purple-300" : "bg-green-900 text-green-300"}>
                          {selectedUser.isAdmin ? "Administrator" : "Standard User"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Member Since:</span>
                        <span className="text-gray-300">{formatDate(selectedUser.createdAt || new Date())}</span>
                      </div>
                      {selectedUser.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Updated:</span>
                          <span className="text-gray-300">{formatDate(selectedUser.updatedAt)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Bio Section */}
                {selectedUser.bio && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Biography</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">{selectedUser.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Stripe Information */}
                {selectedUser.stripeCustomerId && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white flex items-center">
                        <Receipt className="h-5 w-5 mr-2 text-primary" />
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Stripe Customer ID:</span>
                        <span className="text-gray-300 font-mono text-sm">{selectedUser.stripeCustomerId}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Toggle Admin
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Activity
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}