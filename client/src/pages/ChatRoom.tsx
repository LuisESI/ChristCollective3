import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Users, 
  Heart, 
  ArrowLeft,
  Settings,
  Phone,
  Video
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: number;
  chatId: number;
  userId: string;
  message: string;
  type: 'message' | 'prayer_request' | 'system';
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    profileImageUrl?: string;
    username?: string;
  };
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: chat } = useQuery({
    queryKey: ['/api/group-chats', id],
    enabled: !!id
  }) as { data?: { id: number; title: string; memberCount: number; intention: string; createdAt: string } };

  const { data: members = [] } = useQuery({
    queryKey: ['/api/group-chats', id, 'members'],
    enabled: !!id
  }) as { data?: Array<{ id: string; firstName?: string; lastName?: string; displayName?: string; username?: string; profileImageUrl?: string }> };

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/group-chats', id, 'messages'],
    enabled: !!id
  }) as { data?: ChatMessage[] };



  const { data: currentUser } = useQuery({
    queryKey: ['/api/user']
  }) as { data?: { id: string; username: string; firstName?: string; lastName?: string; profileImageUrl?: string } };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest(`/api/group-chats/${id}/messages`, {
        method: 'POST',
        data: {
          message: messageText,
          type: 'message'
        }
      });
      
      // Check if the response was successful
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Failed to send message. Please try again.');
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-chats', id, 'messages'] });
      setMessage("");
    },
    onError: (error: Error) => {
      console.error('Error sending message:', error);
      toast({
        title: "Message Failed",
        description: error.message || "Could not send your message. Please try again.",
        variant: "destructive",
      });
      
      // If it's an auth error, redirect to login
      if (error.message.includes('Session expired')) {
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 10 seconds to catch new messages from other users
  useEffect(() => {
    if (!id) return;
    
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-chats', id, 'messages'] });
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [id, queryClient]);

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(message.trim());
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (user?: ChatMessage['user']) => {
    if (!user) return "Unknown User";
    if (user.displayName) return user.displayName;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.username || "Unknown User";
  };

  const getIntentionIcon = () => {
    switch (chat?.intention) {
      case 'prayer': return Heart;
      case 'bible_study': return Heart;
      default: return Heart;
    }
  };

  const Icon = getIntentionIcon();
  const onlineCount = members?.length || 0;

  // Show actual chat members only - with null check
  const chatMembers = (members || []).map((member) => ({
    id: member.id,
    username: member.displayName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.username || "User"),
    initials: (member.displayName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.username || "U")).slice(0, 2).toUpperCase(),
    color: member.id === currentUser?.id ? "bg-[#D4AF37]" : "bg-blue-500",
    profileImage: member.profileImageUrl
  }));

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-black border-b border-gray-800 p-3">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Link href="/connect">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {chat?.title || "Bible Study Circle"}
                </h1>
                <div className="flex items-center space-x-1 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{onlineCount} online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Member Profile Pictures Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">Members:</span>
              <div className="flex items-center -space-x-2">
                {chatMembers.map((member, index) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-black hover:z-10 transition-all">
                    {member.profileImage && (
                      <AvatarImage src={member.profileImage} alt={member.username} />
                    )}
                    <AvatarFallback className={`${member.color} text-white text-xs font-semibold`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              Active Chat
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed height with scroll */}
      <div className="flex-1 bg-black flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-4 pb-1 pt-6 min-h-full flex flex-col justify-end">
              <div className="max-w-2xl mx-auto w-full space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-blue-600/20 rounded-full w-fit mx-auto mb-4">
                      <Icon className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Welcome to {chat?.title || "Bible Study Circle"}</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">Start the conversation with your fellow believers. Share thoughts, prayers, or questions.</p>
                    <div className="mt-4 text-xs text-gray-500">
                      {members.length} members in this chat
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex items-start space-x-3 group hover:bg-gray-900/30 p-2 rounded-lg transition-colors">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          {msg.user?.profileImageUrl && (
                            <AvatarImage src={msg.user.profileImageUrl} alt={getUserDisplayName(msg.user)} />
                          )}
                          <AvatarFallback className="bg-gray-700 text-white text-sm font-semibold">
                            {msg.user ? getUserDisplayName(msg.user).slice(0, 2).toUpperCase() : "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-semibold text-white">
                              {msg.user ? getUserDisplayName(msg.user) : "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(msg.createdAt)}
                            </span>
                            {msg.type === 'prayer_request' && (
                              <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">
                                Prayer Request
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-200 leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-4 py-2 bg-black">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, prayers, or questions..."
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 text-sm min-h-[44px] rounded-xl px-4 py-3 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>
            <Button 
              onClick={handleSendMessage}
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-black px-4 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 min-w-[50px]"
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}