import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, MessageSquare, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import OnlineStatus from "@/components/OnlineStatus";
import BottomNav from "@/components/BottomNav";

export default function Chat({ user, logout }) {
  const { listingId, userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (listingId && userId) {
      loadChatFromParams();
    }
  }, [listingId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages and listing status every 3 seconds
  useEffect(() => {
    if (selectedChat) {
      const interval = setInterval(async () => {
        await fetchMessages(selectedChat.listing_id, selectedChat.other_user.id);
        
        // Also check listing status
        try {
          const listingResponse = await axios.get(`${API}/listings/${selectedChat.listing_id}`);
          const listing = listingResponse.data;
          
          // Update listing status if changed
          if (listing.status !== selectedChat.listing_status) {
            setSelectedChat(prev => ({
              ...prev,
              listing_status: listing.status
            }));
          }
        } catch (error) {
          console.error("Error checking listing status:", error);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API}/chats`);
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatFromParams = async () => {
    try {
      // Fetch the listing to get user info
      const listingResponse = await axios.get(`${API}/listings/${listingId}`);
      const listing = listingResponse.data;
      
      // Check if listing is active
      if (listing.status !== 'active') {
        toast({
          title: "İlan Kapalı",
          description: "Bu ilan artık aktif değil, mesaj gönderemezsiniz.",
          variant: "destructive",
        });
      }
      
      // Create a chat object
      const chat = {
        listing_id: listingId,
        listing_status: listing.status,
        other_user: {
          id: userId,
          username: listing.username
        }
      };
      
      setSelectedChat(chat);
      await fetchMessages(listingId, userId);
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  const fetchMessages = async (listingId, otherUserId) => {
    try {
      const response = await axios.get(`${API}/messages/${listingId}/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleChatSelect = async (chat) => {
    try {
      // Fetch the listing to check status
      const listingResponse = await axios.get(`${API}/listings/${chat.listing_id}`);
      const listing = listingResponse.data;
      
      // Add listing status to chat object
      const updatedChat = {
        ...chat,
        listing_status: listing.status
      };
      
      setSelectedChat(updatedChat);
      await fetchMessages(chat.listing_id, chat.other_user.id);
    } catch (error) {
      console.error("Error loading chat:", error);
      setSelectedChat(chat);
      await fetchMessages(chat.listing_id, chat.other_user.id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    // Check if listing is still active
    if (selectedChat.listing_status && selectedChat.listing_status !== 'active') {
      toast({
        title: "İlan Kapalı",
        description: "Bu ilan artık aktif değil, mesaj gönderemezsiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        listing_id: selectedChat.listing_id,
        recipient_id: selectedChat.other_user.id,
        content: newMessage
      };

      const response = await axios.post(`${API}/messages`, payload);
      setMessages([...messages, response.data]);
      setNewMessage("");
      
      // Refresh chats list
      fetchChats();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Hata",
        description: "Mesaj gönderilemedi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <DollarSign className="w-8 h-8 text-teal-600" onClick={() => navigate('/dashboard')} />
              <h1 
                className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent cursor-pointer"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer' }}
              >
                KAIS
              </h1>
            </div>
            <span className="text-xl font-semibold text-gray-700 ml-4">Messages</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Chat List */}
          <Card className="md:col-span-1 border-2 border-teal-100 overflow-hidden flex flex-col">
            <CardHeader className="bg-teal-50">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-600">Loading chats...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-600">
                  <p className="mb-2">No conversations yet</p>
                  <Button size="sm" onClick={() => navigate('/dashboard')} variant="outline">
                    Browse Listings
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {chats.map((chat, index) => (
                    <div
                      key={index}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 cursor-pointer hover:bg-teal-50 transition-colors ${
                        selectedChat?.other_user?.id === chat.other_user?.id && 
                        selectedChat?.listing_id === chat.listing_id
                          ? 'bg-teal-50 border-l-4 border-teal-600'
                          : ''
                      }`}
                      data-testid={`chat-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-teal-600">
                            {chat.other_user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{chat.other_user?.username}</p>
                            {chat.unread_count > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.last_message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="md:col-span-2 border-2 border-teal-100 overflow-hidden flex flex-col">
            {selectedChat ? (
              <>
                <CardHeader className="bg-teal-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-teal-600">
                        {selectedChat.other_user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{selectedChat.other_user?.username}</CardTitle>
                        <OnlineStatus userId={selectedChat.other_user?.id} size="sm" showLabel={false} />
                      </div>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => navigate(`/listing/${selectedChat.listing_id}`)}
                      >
                        View Listing
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-600 mt-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.sender_id === user.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-teal-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-teal-100' : 'text-gray-500'
                              }`}
                            >
                              {format(new Date(message.timestamp), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
                <div className="border-t p-4">
                  {selectedChat?.listing_status === 'active' ? (
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Mesaj yazın..."
                        className="flex-1"
                        data-testid="message-input"
                      />
                      <Button
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={!newMessage.trim()}
                        data-testid="send-message-btn"
                      >
                        <Send className="w-5 h-5" />
                      </Button>
                    </form>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                      <p className="text-orange-800 font-medium">
                        Bu ilan kapatılmıştır. Artık mesaj gönderemezsiniz.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} />
      <div className="h-20 md:hidden"></div>
    </div>
  );
}