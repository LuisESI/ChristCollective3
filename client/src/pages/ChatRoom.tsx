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
      return apiRequest(`/api/group-chats/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          type: 'message'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/group-chats', id, 'messages'] });
      setMessage("");
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Show actual chat members only
  const chatMembers = members.map((member) => ({
    id: member.id,
    username: member.displayName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.username || "User"),
    initials: (member.displayName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName || member.username || "U")).slice(0, 2).toUpperCase(),
    color: member.id === currentUser?.id ? "bg-[#D4AF37]" : "bg-blue-500",
    profileImage: member.profileImageUrl
  }));

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-gray-800 p-3">
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

      {/* Messages Area */}
      <ScrollArea className="flex-1 bg-black">
        <div className="px-4 py-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-blue-600/20 rounded-full w-fit mx-auto mb-4">
                <Icon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Welcome to {chat?.title || "Bible Study Circle"}</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">Start the conversation with your fellow believers. Share thoughts, prayers, or questions.</p>
            </div>
          ) : (
            messages.map((msg) => (
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
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-800 bg-black">
        <div className="max-w-4xl mx-auto">
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