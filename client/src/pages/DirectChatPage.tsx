import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical
} from "lucide-react";
import { Helmet } from "react-helmet";

interface DirectMessage {
  id: number;
  chatId: number;
  senderId: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    username: string;
    profileImageUrl: string | null;
  };
}

interface DirectChat {
  id: number;
  user1Id: string;
  user2Id: string;
  lastMessageAt: Date;
  createdAt: Date;
  otherUser: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    username: string;
    profileImageUrl: string | null;
  };
}

export default function DirectChatPage() {
  const { user } = useAuth();
  const { chatId } = useParams<{ chatId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch chat details
  const { data: chat } = useQuery<DirectChat>({
    queryKey: ['/api/direct-chats', chatId],
    enabled: !!chatId,
  });

  // Fetch messages
  const { data: messages = [], error, isLoading } = useQuery<DirectMessage[]>({
    queryKey: ['/api/direct-chats', chatId, 'messages'],
    enabled: !!chatId,
    refetchInterval: 3000, // Refresh every 3 seconds
  });



  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest(`/api/direct-chats/${chatId}/messages`, {
        method: "POST",
        data: { message: messageText },
      });
      return await response.json();
    },
    onSuccess: () => {
      setMessage("");
      // Force refetch of messages
      queryClient.invalidateQueries({ queryKey: ['/api/direct-chats', chatId, 'messages'] });
      queryClient.refetchQueries({ queryKey: ['/api/direct-chats', chatId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/direct-chats'] });
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!user || !chatId) {
    navigate("/connect");
    return null;
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
    }
  };

  const otherUser = chat?.otherUser;
  const otherUserName = otherUser?.displayName || otherUser?.firstName || otherUser?.username || "User";

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <Helmet>
        <title>Direct Message - {otherUserName} | Christ Collective</title>
      </Helmet>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/connect")}
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {otherUser && (
            <>
              <Avatar className="w-8 h-8">
                <AvatarImage src={otherUser.profileImageUrl || ""} />
                <AvatarFallback className="bg-[#D4AF37] text-black">
                  {otherUserName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-base font-semibold">{otherUserName}</h1>
                <p className="text-xs text-gray-400">@{otherUser.username}</p>
              </div>
            </>
          )}
          
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No messages yet</div>
              <p className="text-sm text-gray-500">Start the conversation with {otherUserName}!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.senderId === user.id;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(msg.createdAt);
              
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-4">
                      {formatDate(msg.createdAt)}
                    </div>
                  )}
                  
                  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
                    <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                      {!isOwn && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.sender.profileImageUrl || ""} />
                          <AvatarFallback className="bg-[#D4AF37] text-black text-xs">
                            {(msg.sender.displayName || msg.sender.firstName || msg.sender.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`${isOwn ? "bg-[#D4AF37] text-black" : "bg-gray-800 text-white"} rounded-lg px-4 py-2`}>
                        <p className="text-sm break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? "text-black/70" : "text-gray-400"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 bg-black border-t border-gray-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message ${otherUserName}...`}
              className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-[#D4AF37] text-black hover:bg-[#B8941F] px-6"
            >
              {sendMessageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}