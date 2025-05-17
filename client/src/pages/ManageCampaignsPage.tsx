import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Helmet } from "react-helmet";
import { MoreHorizontal, Edit, Trash, Eye, Loader2, ImageIcon } from "lucide-react";

type Campaign = {
  id: string;
  title: string;
  description: string;
  goal: string;
  currentAmount: string;
  image?: string;
  additionalImages?: string[];
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ManageCampaignsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["/api/user/campaigns"],
    enabled: isAuthenticated,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/campaigns/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Campaign Deleted",
        description: "Your campaign has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
      setCampaignToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });
  
  const updateCampaignStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/campaigns/${id}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Campaign status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/campaigns"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update campaign status",
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = (id: string) => {
    setCampaignToDelete(id);
  };
  
  const confirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete);
    }
  };
  
  const toggleCampaignStatus = (id: string, currentStatus: boolean) => {
    updateCampaignStatus.mutate({ id, isActive: !currentStatus });
  };
  
  function calculateProgress(current: string, goal: string): number {
    const currentValue = parseFloat(current) || 0;
    const goalValue = parseFloat(goal) || 1; // Prevent division by zero
    
    return Math.min(Math.round((currentValue / goalValue) * 100), 100);
  }
  
  function formatCurrency(amount: string): string {
    const value = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="mb-6">You need to be logged in to manage your campaigns.</p>
          <Button asChild>
            <Link href="/api/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Manage Campaigns | Christ Collective</title>
        <meta name="description" content="Manage your fundraising campaigns, track donations, and update campaign information." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manage Your Campaigns</h1>
            <p className="text-gray-600 mt-2">
              Create, edit and track your fundraising campaigns
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link href="/donate/create">
              Create New Campaign
            </Link>
          </Button>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="active">Active Campaigns</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
                      <div className="h-4 bg-gray-100 rounded mb-4 w-full" />
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.filter((c: Campaign) => c.isActive).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns
                  .filter((campaign: Campaign) => campaign.isActive)
                  .map((campaign: Campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign}
                      onToggleStatus={toggleCampaignStatus}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">No Active Campaigns</h3>
                <p className="text-gray-500 mb-6">You don't have any active campaigns at the moment.</p>
                <Button asChild>
                  <Link href="/donate/create">Create Your First Campaign</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inactive">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
                      <div className="h-4 bg-gray-100 rounded mb-4 w-full" />
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : campaigns.filter((c: Campaign) => !c.isActive).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns
                  .filter((campaign: Campaign) => !campaign.isActive)
                  .map((campaign: Campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign}
                      onToggleStatus={toggleCampaignStatus}
                      onDelete={handleDelete}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No inactive campaigns found.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AlertDialog open={!!campaignToDelete} onOpenChange={() => setCampaignToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your campaign and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CampaignCard({ 
  campaign, 
  onToggleStatus,
  onDelete 
}: { 
  campaign: Campaign;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const progress = calculateProgress(campaign.currentAmount, campaign.goal);
  
  return (
    <Card className="overflow-hidden">
      {campaign.image ? (
        <div className="relative h-48">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          {!campaign.isActive && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Inactive
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-48 bg-gray-100 flex items-center justify-center">
          <ImageIcon size={48} className="text-gray-400" />
          {!campaign.isActive && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Inactive
              </span>
            </div>
          )}
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{campaign.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/donate/${campaign.slug}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/donate/edit/${campaign.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(campaign.id, campaign.isActive)}>
                {campaign.isActive ? (
                  <>
                    <span className="mr-2">🔴</span>
                    <span>Deactivate</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">🟢</span>
                    <span>Activate</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(campaign.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>Created {formatDate(campaign.createdAt)}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex justify-between text-sm font-medium">
          <span>{formatCurrency(campaign.currentAmount)}</span>
          <span>of {formatCurrency(campaign.goal)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/donate/checkout/${campaign.id}`}>
            Donate
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/donate/edit/${campaign.id}`}>
            Edit Campaign
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function calculateProgress(current: string, goal: string): number {
  const currentValue = parseFloat(current) || 0;
  const goalValue = parseFloat(goal) || 1; // Prevent division by zero
  
  return Math.min(Math.round((currentValue / goalValue) * 100), 100);
}

function formatCurrency(amount: string): string {
  const value = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}