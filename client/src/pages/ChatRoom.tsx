import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { getUserDisplayName as sharedGetUserDisplayName, getUserInitials } from "@/lib/user-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/api-config";
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
    return sharedGetUserDisplayName(user);
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
    username: sharedGetUserDisplayName(member),
    initials: getUserInitials(member),
    color: member.id === currentUser?.id ? "bg-[#D4AF37]" : "bg-gray-700",
    profileImage: member.profileImageUrl
  }));

  return (
    <div
      className="fixed inset-x-0 bg-black flex flex-col z-40"
      style={{
        top: 'calc(60px + env(safe-area-inset-top, 0px))',
        bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-black border-b border-gray-800 p-3">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Link href="/connect">
                <button className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[#D4AF37] hover:bg-gray-700 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <div className="p-2 bg-[#D4AF37] rounded-lg">
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide px-4 pt-3 pb-2">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-[#D4AF37]/20 rounded-full w-fit mx-auto mb-4">
                <Icon className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to {chat?.title || "Bible Study Circle"}</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">Start the conversation with your fellow believers.</p>
              <div className="mt-3 text-xs text-gray-500">{members.length} members in this chat</div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, index) => {
                const prevMsg = messages[index - 1];
                const isConsecutive = prevMsg && prevMsg.userId === msg.userId;
                return (
                  <div key={msg.id} className={`flex items-start gap-3 px-1 py-0.5 rounded-lg hover:bg-gray-900/30 transition-colors ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
                    <Avatar className={`w-8 h-8 flex-shrink-0 mt-0.5 ${isConsecutive ? 'invisible' : ''}`}>
                      <AvatarImage src={getProfileImageUrl(msg.user?.profileImageUrl, 64)} alt={getUserDisplayName(msg.user)} />
                      <AvatarFallback className="bg-gray-700 text-white text-xs font-semibold">
                        {msg.user ? getUserDisplayName(msg.user).slice(0, 2).toUpperCase() : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {!isConsecutive && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white">
                            {msg.user ? getUserDisplayName(msg.user) : "Unknown User"}
                          </span>
                          <span className="text-[10px] text-gray-500">{formatTime(msg.createdAt)}</span>
                          {msg.type === 'prayer_request' && (
                            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-xs">Prayer</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-sm text-gray-200 leading-snug break-words">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 bg-black border-t border-gray-800 px-4 py-2">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400 rounded-full px-4 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-[#D4AF37] hover:bg-[#B8941F] text-black rounded-full w-9 h-9 p-0 flex-shrink-0"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}