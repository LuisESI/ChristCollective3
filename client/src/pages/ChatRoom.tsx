import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'prayer_request';
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chat } = useQuery({
    queryKey: ['/api/group-chats', id],
    enabled: !!id
  }) as { data?: { id: number; title: string; memberCount: number; intention: string; createdAt: string } };

  const { data: members } = useQuery({
    queryKey: ['/api/group-chats', id, 'members'],
    enabled: !!id
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: "current_user",
      username: "You",
      message: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'message'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getIntentionIcon = () => {
    switch (chat?.intention) {
      case 'prayer': return Heart;
      case 'bible_study': return Heart;
      default: return Heart;
    }
  };

  const Icon = getIntentionIcon();
  const onlineCount = members?.length || 3;

  // Mock member profile pictures for display
  const mockMembers = [
    { id: "1", username: "Sarah", initials: "SA", color: "bg-blue-500" },
    { id: "2", username: "John", initials: "JN", color: "bg-green-500" },
    { id: "3", username: "Mary", initials: "MY", color: "bg-purple-500" },
    { id: "4", username: "David", initials: "DV", color: "bg-orange-500" },
    { id: "5", username: "Admin", initials: "AD", color: "bg-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/connect">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
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
          </div>
          
          <div className="flex items-center space-x-2">
            {/* User Profile Pictures */}
            <div className="flex items-center -space-x-2 mr-2">
              {mockMembers.slice(0, 4).map((member, index) => (
                <Avatar key={member.id} className="w-8 h-8 border-2 border-black">
                  <AvatarFallback className={`${member.color} text-white text-xs font-semibold`}>
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
              {mockMembers.length > 4 && (
                <Avatar className="w-8 h-8 border-2 border-black">
                  <AvatarFallback className="bg-gray-600 text-white text-xs">
                    +{mockMembers.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
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
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-black">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-3 bg-blue-600/20 rounded-full w-fit mx-auto mb-3">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-gray-400 text-sm">Start the conversation with your fellow believers</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-700 text-white text-xs">
                    {msg.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold text-white">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.type === 'prayer_request' && (
                      <Badge className="bg-purple-600 text-white text-xs">
                        Prayer Request
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
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
      <div className="p-4 border-t border-gray-700 bg-black">
        <div className="flex items-center space-x-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts, prayers, or questions..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-[#D4AF37] hover:bg-[#B8941F] text-black p-2"
            disabled={!message.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}