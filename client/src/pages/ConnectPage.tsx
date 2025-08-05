import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { 
  Users, 
  Plus, 
  Heart, 
  BookOpen, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  UserPlus,
  Clock,
  Calendar
} from "lucide-react";
import { insertGroupChatQueueSchema, type GroupChatQueue, type GroupChat } from "@shared/schema";

const createQueueSchema = insertGroupChatQueueSchema.extend({
  minPeople: z.coerce.number().min(2, "Minimum 2 people").max(12, "Maximum 12 people"),
  maxPeople: z.coerce.number().min(4, "Minimum 4 people").max(12, "Maximum 12 people"),
});

type CreateQueueForm = z.infer<typeof createQueueSchema>;

const intentionOptions = [
  { value: "prayer", label: "Prayer", icon: Heart, color: "bg-red-500" },
  { value: "bible_study", label: "Bible Study", icon: BookOpen, color: "bg-blue-500" },
  { value: "evangelizing", label: "Evangelizing", icon: MessageCircle, color: "bg-green-500" },
  { value: "fellowship", label: "Fellowship", icon: Users, color: "bg-purple-500" },
  { value: "worship", label: "Worship", icon: Calendar, color: "bg-[#D4AF37]" },
];

export default function ConnectPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<CreateQueueForm>({
    resolver: zodResolver(createQueueSchema),
    defaultValues: {
      title: "",
      description: "",
      intention: "",
      minPeople: 4,
      maxPeople: 8,
    },
  });

  // Fetch active queues
  const { data: queues = [] } = useQuery<GroupChatQueue[]>({
    queryKey: ["/api/group-chat-queues"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch active chats
  const { data: activeChats = [] } = useQuery<GroupChat[]>({
    queryKey: ["/api/group-chats/active"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Create queue mutation
  const createQueueMutation = useMutation({
    mutationFn: async (data: CreateQueueForm) => {
      return apiRequest("/api/group-chat-queues", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      setCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Queue created!",
        description: "People can now join your group chat queue.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join queue mutation
  const joinQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/group-chat-queues/${queueId}/join`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      toast({
        title: "Joined queue!",
        description: "You'll be notified when the chat starts.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel queue mutation
  const cancelQueueMutation = useMutation({
    mutationFn: async (queueId: number) => {
      return apiRequest(`/api/group-chat-queues/${queueId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/group-chat-queues"] });
      toast({
        title: "Queue cancelled",
        description: "Your queue has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel queue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const getIntentionInfo = (intention: string) => {
    return intentionOptions.find(opt => opt.value === intention) || intentionOptions[0];
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-gray-400">You need to be signed in to access the Connect page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Helmet>
        <title>Connect - Christ Collective</title>
        <meta name="description" content="Join group chats for prayer, Bible study, evangelizing, and fellowship with other believers" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Create Queue Dialog */}
        <div className="hidden">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Start Chat Queue
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border border-[#D4AF37]/20 shadow-2xl max-w-2xl">
              <DialogHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                      Create Group Chat Queue
                    </DialogTitle>
                    <p className="text-sm text-gray-400 mt-1">Bring believers together for meaningful connection</p>
                  </div>
                </div>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => createQueueMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Queue Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Evening Prayer Circle"
                            className="bg-black/50 border border-gray-600 text-white placeholder-gray-500 h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Share what your group will discuss, pray about, or study together..."
                            className="bg-black/50 border border-gray-600 text-white placeholder-gray-500 rounded-lg resize-none transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-black/70"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="intention"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#D4AF37] font-medium text-sm">Purpose</FormLabel>
                        <div className="grid grid-cols-5 gap-3 mt-2">
                          {intentionOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = field.value === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => field.onChange(option.value)}
                                className={`
                                  flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 group hover:scale-105
                                  ${isSelected 
                                    ? `${option.color} border-white shadow-lg shadow-${option.color}/30` 
                                    : 'bg-black/30 border-gray-600 hover:border-gray-500 hover:bg-black/50'
                                  }
                                `}
                              >
                                <Icon className={`w-6 h-6 mb-2 transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                                <span className={`text-xs font-medium transition-all duration-300 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                  {option.label}
                                </span>
                                {isSelected && (
                                  <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                    <h4 className="text-[#D4AF37] font-medium text-sm mb-4 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Group Size
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="minPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Minimum People</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number"
                                  min={2}
                                  max={12}
                                  className="bg-black/50 border border-gray-600 text-white h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 pl-4 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  min
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxPeople"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Maximum People</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type="number"
                                  min={4}
                                  max={12}
                                  className="bg-black/50 border border-gray-600 text-white h-12 rounded-lg transition-all duration-200 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 pl-4 pr-8"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  max
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-blue-300 flex items-center">
                        <MessageCircle className="w-3 h-3 mr-2" />
                        Chat starts automatically when minimum people join
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 h-12"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createQueueMutation.isPending}
                      className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black hover:from-[#B8941F] hover:to-[#D4AF37] font-semibold px-8 h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      {createQueueMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Queue
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Queues Horizontal Slider */}
        {queues.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Join a Queue</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Queue
                </Button>
                <Button variant="outline" size="sm" onClick={scrollLeft} className="border-gray-600">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={scrollRight} className="border-gray-600">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {queues.map((queue) => {
                const intentionInfo = getIntentionInfo(queue.intention);
                const Icon = intentionInfo.icon;
                const isOwner = queue.creatorId === user.id;
                const progressPercent = (queue.currentCount / queue.maxPeople) * 100;
                const isNearFull = progressPercent >= 80;
                
                return (
                  <Card key={queue.id} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 flex-shrink-0 w-80 hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 hover:scale-105 group relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardHeader className="pb-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-xl ${intentionInfo.color} shadow-lg group-hover:shadow-xl transition-all duration-300 relative`}>
                            <Icon className="w-5 h-5 text-white" />
                            {isNearFull && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg font-bold group-hover:text-[#D4AF37] transition-colors duration-200">
                              {queue.title}
                            </CardTitle>
                            <Badge 
                              className={`mt-1 ${intentionInfo.color} text-white border-none shadow-sm`}
                            >
                              {intentionInfo.label}
                            </Badge>
                          </div>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelQueueMutation.mutate(queue.id)}
                            disabled={cancelQueueMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-all duration-200 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4 relative z-10">
                      {queue.description && (
                        <div className="bg-black/20 rounded-lg p-3 border border-gray-700/50">
                          <p className="text-sm text-gray-300 line-clamp-2">{queue.description}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2 text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{queue.currentCount}/{queue.maxPeople}</span>
                          </div>
                          <span className="text-gray-600">•</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(queue.createdAt!)}</span>
                          </div>
                        </div>
                        
                        {isNearFull && (
                          <Badge variant="outline" className="bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37] text-xs animate-pulse">
                            Almost Full!
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Progress</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ease-out ${
                              isNearFull 
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700] shadow-lg animate-pulse' 
                                : 'bg-gradient-to-r from-[#D4AF37] to-[#B8941F]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {queue.minPeople - queue.currentCount > 0 
                            ? `${queue.minPeople - queue.currentCount} more needed to start chat`
                            : 'Ready to chat!'
                          }
                        </div>
                      </div>
                      
                      {!isOwner && (
                        <Button
                          onClick={() => joinQueueMutation.mutate(queue.id)}
                          disabled={joinQueueMutation.isPending || queue.currentCount >= queue.maxPeople}
                          className="w-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black hover:from-[#B8941F] hover:to-[#D4AF37] font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {joinQueueMutation.isPending ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                              Joining...
                            </div>
                          ) : queue.currentCount >= queue.maxPeople ? (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Queue Full
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserPlus className="w-4 h-4 mr-2" />
                              Join Queue
                            </div>
                          )}
                        </Button>
                      )}
                      
                      {isOwner && (
                        <div className="text-center p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg">
                          <div className="flex items-center justify-center space-x-2 text-[#D4AF37]">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">You created this queue</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Chats Vertical List */}
        {activeChats.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Active Chats</h2>
                <p className="text-gray-400 mt-1">Join ongoing conversations with fellow believers</p>
              </div>
              <div className="flex items-center space-x-3">
                {queues.length === 0 && (
                  <Button 
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-[#D4AF37] text-black hover:bg-[#B8941F] font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Start Queue
                  </Button>
                )}
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
                  {activeChats.length} Active
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              {activeChats.map((chat) => {
                const intentionInfo = getIntentionInfo(chat.intention);
                const Icon = intentionInfo.icon;
                
                return (
                  <Card key={chat.id} className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#D4AF37]/5 group relative overflow-hidden">
                    {/* Live indicator */}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-medium">LIVE</span>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-4 rounded-xl ${intentionInfo.color} shadow-lg group-hover:shadow-xl transition-all duration-300 relative`}>
                            <Icon className="w-6 h-6 text-white" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-gray-900"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors duration-200">{chat.title}</h3>
                              <Badge className={`${intentionInfo.color} text-white border-none`}>
                                {intentionInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span className="font-medium">{chat.memberCount} members active</span>
                              </div>
                              <span className="text-gray-600">•</span>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Started {formatTimeAgo(chat.createdAt!)}</span>
                              </div>
                            </div>
                            {chat.description && (
                              <div className="bg-black/20 rounded-lg p-3 border border-gray-700/50 mb-4">
                                <p className="text-sm text-gray-300">{chat.description}</p>
                              </div>
                            )}
                            
                            {/* Activity indicators */}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Messages active</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                                <span>Members online</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                          <Button
                            className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Join Chat
                          </Button>
                          <div className="text-center text-xs text-gray-500">
                            Free to join
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty States */}
        {queues.length === 0 && activeChats.length === 0 && (
          <div className="text-center py-20">
            <div className="relative max-w-md mx-auto mb-8">
              {/* Animated background circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-[#D4AF37]/10 rounded-full animate-pulse"></div>
                <div className="absolute w-20 h-20 bg-[#D4AF37]/20 rounded-full animate-ping"></div>
              </div>
              
              {/* Icon group */}
              <div className="relative z-10 flex items-center justify-center space-x-2 mb-6">
                {intentionOptions.slice(0, 5).map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <div 
                      key={option.value}
                      className={`p-3 rounded-full ${option.color} shadow-lg animate-bounce`}
                      style={{ 
                        animationDelay: `${index * 0.2}s`,
                        animationDuration: '2s'
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  Welcome to 
                  <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent"> Connect</span>
                </h3>
                <p className="text-xl text-gray-300 mb-2">
                  Where believers gather for meaningful conversations
                </p>
                <p className="text-gray-400">
                  Start a group chat queue and connect with fellow Christians for prayer, Bible study, evangelizing, fellowship, or worship
                </p>
              </div>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Bible Study Groups</h4>
                  <p className="text-sm text-gray-400">Deep dive into Scripture with fellow believers</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Prayer Circles</h4>
                  <p className="text-sm text-gray-400">Join others in powerful group prayer</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-[#D4AF37]/30 transition-all duration-300 group">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Fellowship</h4>
                  <p className="text-sm text-gray-400">Build lasting friendships in faith</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black hover:from-[#B8941F] hover:to-[#D4AF37] font-bold text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Start the First Queue
                </Button>
                <div className="text-center sm:text-left">
                  <p className="text-sm text-gray-500">It's free and takes less than a minute</p>
                  <div className="flex items-center justify-center sm:justify-start mt-1 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                    <span>Safe, moderated environment</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-gradient-to-r from-[#D4AF37]/10 to-[#FFD700]/10 border border-[#D4AF37]/20 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-[#D4AF37] mr-2" />
                  <span className="text-[#D4AF37] font-semibold">How it works</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center font-bold mx-auto mb-2">1</div>
                    <p className="text-gray-300">Create a queue with your intention</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center font-bold mx-auto mb-2">2</div>
                    <p className="text-gray-300">Others join your queue</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center font-bold mx-auto mb-2">3</div>
                    <p className="text-gray-300">Chat starts automatically!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}