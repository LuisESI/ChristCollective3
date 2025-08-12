import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Video,
  MoreVertical
} from "lucide-react";
import { Link } from "wouter";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'prayer_request' | 'system';
}

interface ChatMember {
  id: string;
  username: string;
  role: 'member' | 'leader' | 'prayer_warrior';
  isOnline: boolean;
}

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "user1",
      username: "Sarah M.",
      message: "Good evening everyone! Ready for our Bible study session?",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'message'
    },
    {
      id: "2", 
      userId: "user2",
      username: "David L.",
      message: "Yes! I've been looking forward to discussing Romans 8 today.",
      timestamp: new Date(Date.now() - 240000).toISOString(),
      type: 'message'
    },
    {
      id: "3",
      userId: "user3", 
      username: "Mary K.",
      message: "🙏 Can we please pray for my grandmother? She's been ill lately.",
      timestamp: new Date(Date.now() - 180000).toISOString(),
      type: 'prayer_request'
    },
    {
      id: "4",
      userId: "user1",
      username: "Sarah M.",
      message: "Of course Mary! Lord, we lift up Mary's grandmother to You...",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      type: 'message'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chat } = useQuery({
    queryKey: ['/api/group-chats', id],
    enabled: !!id
  }) as { data?: { id: number; title: string; memberCount: number; intention: string; createdAt: string } };

  const { data: members } = useQuery({
    queryKey: ['/api/group-chats', id, 'members'],
    enabled: !!id
  });

  const mockMembers: ChatMember[] = [
    { id: "user1", username: "Sarah M.", role: "leader", isOnline: true },
    { id: "user2", username: "David L.", role: "member", isOnline: true },
    { id: "user3", username: "Mary K.", role: "prayer_warrior", isOnline: true },
    { id: "user4", username: "John R.", role: "member", isOnline: false },
  ];

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'leader': return 'bg-[#D4AF37] text-black';
      case 'prayer_warrior': return 'bg-purple-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  const getMessageTypeStyle = (type: string) => {
    if (type === 'prayer_request') {
      return 'border-l-4 border-purple-500 bg-purple-500/10 pl-4';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/connect">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {chat?.title || "Bible Study Circle"}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{mockMembers.filter(m => m.isOnline).length} online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start space-x-3 ${getMessageTypeStyle(msg.type)}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-700 text-white text-xs">
                      {msg.username.split(' ').map(n => n[0]).join('')}
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
              ))}
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
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                onClick={handleSendMessage}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
              >
                🙏 Prayer Request
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
              >
                📖 Share Verse
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                ✨ Testimony
              </Button>
            </div>
          </div>
        </div>

        {/* Members Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-64 bg-black border-l border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Members ({mockMembers.length})
            </h3>
            
            <div className="space-y-3">
              {mockMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gray-700 text-white text-xs">
                          {member.username.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {member.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {member.username}
                      </p>
                      <Badge 
                        className={`text-xs ${getRoleColor(member.role)}`}
                      >
                        {member.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}