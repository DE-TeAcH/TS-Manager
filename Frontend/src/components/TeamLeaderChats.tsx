import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  MessageSquare,
  Search,
  Send,
  Users,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
  is_read: number;
}

interface ChatParticipant {
  id: string;
  name: string;
  role?: string;
}

interface Chat {
  id: number;
  type: 'private' | 'group';
  name: string | null;
  display_name: string;
  task_id: number | null;
  task_title: string | null;
  other_user_role?: string;
  last_message: string | null;
  last_message_time: string | null;
  last_message_sender: string | null;
  unread_count: number;
  participants: ChatParticipant[];
}

interface TeamLeaderChatsProps {
  userId: number;
  userName: string;
  teamId?: number;
}

export function TeamLeaderChats({ userId, userName, teamId }: TeamLeaderChatsProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [deptHeads, setDeptHeads] = useState<any[]>([]);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      // Auto-create required chats based on role
      await api.chats.init(userId);
      // Then fetch all chats
      const response = await api.chats.get(userId) as any;
      if (response.success && Array.isArray(response.data)) {
        // Fix: Ensure private chats show the OTHER person's name
        const mappedChats = response.data.map((chat: Chat) => {
          if (chat.type === 'private' && chat.participants) {
            const otherParticipant = chat.participants.find(p => String(p.id) !== String(userId));
            if (otherParticipant) {
              return { ...chat, display_name: otherParticipant.name };
            }
          }
          return chat;
        });
        setChats(mappedChats);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeptHeads = async () => {
    try {
      const response = await api.users.get({ role: 'dept-head', team_id: teamId }) as any;
      if (response.success && Array.isArray(response.data)) {
        setDeptHeads(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dept heads:', error);
    }
  };

  const fetchMessages = async (chatId: number) => {
    setIsMessagesLoading(true);
    try {
      const response = await api.messages.get(chatId, userId, true) as any;
      if (response.success && Array.isArray(response.data)) {
        setMessages(response.data);
        setChats(prev => prev.map(c =>
          c.id === chatId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    if (teamId) {
      fetchDeptHeads();
    }
  }, [userId, teamId]);

  const filteredChats = chats.filter(chat =>
    chat.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.task_title && chat.task_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenChat = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleStartChat = async (deptHead: any) => {
    try {
      const response = await api.chats.create('private', [userId, deptHead.id]) as any;
      if (response.success && response.data) {
        setShowNewChatDialog(false);
        fetchChats();
        // Find and open the new/existing chat
        const chatId = response.data.id;
        const chat: Chat = {
          id: chatId,
          type: 'private',
          name: null,
          display_name: deptHead.name,
          task_id: null,
          task_title: null,
          other_user_role: 'dept-head',
          last_message: null,
          last_message_time: null,
          last_message_sender: null,
          unread_count: 0,
          participants: [
            { id: userId.toString(), name: userName, role: 'team-leader' },
            { id: deptHead.id.toString(), name: deptHead.name, role: 'dept-head' }
          ]
        };
        handleOpenChat(chat);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await api.messages.send(selectedChat.id, userId, newMessage.trim()) as any;
      if (response.success && response.data) {
        setMessages(prev => [...prev, response.data]);
        setChats(prev => prev.map(c =>
          c.id === selectedChat.id
            ? {
              ...c,
              last_message: newMessage.trim(),
              last_message_time: new Date().toISOString(),
              last_message_sender: userName
            }
            : c
        ));
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleClearChat = async (chatToClear: Chat, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the chat dialog

    if (!confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
      return;
    }

    try {
      const response = await api.chats.clear(chatToClear.id, userId) as any;
      if (response.success) {
        if (selectedChat && selectedChat.id === chatToClear.id) {
          setMessages([]);
        }
        setChats(prev => prev.map(c =>
          c.id === chatToClear.id
            ? { ...c, last_message: null, last_message_time: null, last_message_sender: null }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  const formatMessageTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return formatMessageTime(timestamp);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Filter dept heads who don't have an existing chat
  const availableDeptHeads = deptHeads.filter(dh =>
    !chats.some(c => c.type === 'private' && c.participants.some(p => p.id === dh.id.toString()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
          <p className="text-muted-foreground mt-2">
            Chat with your department heads
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewChatDialog(true)} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            New Chat
          </Button>
          <Button variant="outline" size="sm" onClick={fetchChats} disabled={isLoading} className="w-full md:w-auto">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-brand-600" />
              <span>Conversations</span>
            </CardTitle>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-300" />
                <p>Loading conversations...</p>
              </div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-4 bg-card border hover:bg-muted/50 transition-colors cursor-pointer group rounded-xl"
                  onClick={() => handleOpenChat(chat)}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`text-white ${chat.type === 'group'
                          ? 'bg-gradient-to-br from-brand-200 to-brand-500'
                          : 'bg-gradient-to-br from-brand-500 to-brand-600'
                          }`}>
                          {chat.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(chat.display_name || 'Chat')}
                        </AvatarFallback>
                      </Avatar>
                      {chat.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {chat.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-foreground">{chat.display_name}</p>
                          {chat.other_user_role === 'dept-head' && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">Dept Head</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1 min-w-0">
                        <p className="text-sm text-muted-foreground truncate flex-1 mr-2 min-w-0">
                          {(() => {
                            const msg = chat.last_message || 'No messages yet';
                            return msg.length > 23 ? msg.substring(0, 23) + '...' : msg;
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{formatLastMessageTime(chat.last_message_time)}</p>
                      </div>
                    </div>
                  </div>
                  {chat.type === 'private' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleClearChat(chat, e)}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 transition-opacity"
                      title="Clear all messages"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start a new chat with a department head</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select a department head to message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
            {availableDeptHeads.length > 0 ? (
              availableDeptHeads.map((dh) => (
                <div
                  key={dh.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleStartChat(dh)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-white">
                        {getInitials(dh.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{dh.name}</p>
                      <p className="text-sm text-muted-foreground">Department Head</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                You already have chats with all department heads
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={selectedChat !== null} onOpenChange={() => setSelectedChat(null)}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] md:h-[600px] flex flex-col p-0">
          {selectedChat && (
            <>
              <DialogHeader className="p-6 pb-0">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-white bg-gradient-to-br from-blue-500 to-cyan-600">
                      {getInitials(selectedChat.display_name || 'Chat')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedChat.display_name}</DialogTitle>
                    <DialogDescription>Department Head</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Separator />

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {isMessagesLoading ? (
                    <div className="text-center text-muted-foreground mt-10">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin text-muted-foreground/50" />
                      <p className="mt-2">Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${message.sender_id === userId
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted text-foreground'
                            }`}
                        >
                          <div className="flex flex-wrap items-end gap-x-2">
                            <p className="text-sm line-clamp-4 break-words">{message.content}</p>
                            <span className={`text-[11px] ml-auto ${message.sender_id === userId ? 'text-blue-100' : 'text-muted-foreground'
                              }`}>
                              {formatMessageTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground mt-10">
                      <p>No messages in this conversation.</p>
                      <p className="text-sm">Start chatting!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}