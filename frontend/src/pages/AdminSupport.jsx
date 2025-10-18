import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageCircle, CheckCircle2, User as UserIcon } from "lucide-react";
import { playNotificationSound } from "../utils/notificationSound";
import OnlineStatus from "@/components/OnlineStatus";

export default function AdminSupport({ user }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const lastConversationsRef = useRef([]);
  
  // Typing indicator
  const [isTyping, setIsTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchConversations();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/admin/support`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setConversations(response.data);
      
      // Check for new messages and play sound
      if (lastConversationsRef.current.length > 0) {
        const hasNewMessages = response.data.some((conv) => {
          const oldConv = lastConversationsRef.current.find((c) => c.id === conv.id);
          return oldConv && conv.unread_admin > (oldConv.unread_admin || 0);
        });
        if (hasNewMessages) {
          playNotificationSound();
        }
      }
      lastConversationsRef.current = response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // Mark as read
    if (conversation.unread_admin > 0) {
      try {
        await axios.post(
          `${API}/admin/support/${conversation.id}/mark-read`,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        await fetchConversations();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
    
    scrollToBottom();
  };

  const sendReply = async () => {
    if (!message.trim() || !selectedConversation) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/admin/support/${selectedConversation.id}/reply`,
        { message: message.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessage("");
      await fetchConversations();
      
      // Update selected conversation
      const updated = await axios.get(`${API}/admin/support`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const updatedConv = updated.data.find((c) => c.id === selectedConversation.id);
      if (updatedConv) {
        setSelectedConversation(updatedConv);
      }
      scrollToBottom();
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Mesaj gönderilirken hata oluştu");
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async (conversationId) => {
    try {
      await axios.post(
        `${API}/admin/support/${conversationId}/close`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      await fetchConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error closing conversation:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_admin || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
            <h1 className="text-3xl font-bold">Customer Service</h1>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {totalUnread} Yeni
              </Badge>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1 max-h-[calc(100vh-200px)] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">Konuşmalar ({conversations.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {conversations.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>Henüz destek talebi yok</p>
                </div>
              )}
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                      <p className="font-semibold text-sm">{conv.user_name}</p>
                      <OnlineStatus userId={conv.user_id} size="sm" showLabel={false} />
                    </div>
                    {conv.unread_admin > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_admin}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{conv.user_email}</p>
                  {conv.messages.length > 0 && (
                    <p className="text-sm text-gray-600 truncate">
                      {conv.messages[conv.messages.length - 1].message}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {new Date(conv.updated_at).toLocaleDateString("tr-TR")}
                    </p>
                    <Badge variant={conv.status === "open" ? "default" : "secondary"} className="text-xs">
                      {conv.status === "open" ? "Açık" : "Kapalı"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2">
            {!selectedConversation ? (
              <CardContent className="p-8 text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Bir konuşma seçin</p>
              </CardContent>
            ) : (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{selectedConversation.user_name}</CardTitle>
                        <OnlineStatus userId={selectedConversation.user_id} size="md" showLabel={true} />
                      </div>
                      <p className="text-sm text-gray-500">{selectedConversation.user_email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => closeConversation(selectedConversation.id)}
                      disabled={selectedConversation.status === "closed"}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {selectedConversation.status === "closed" ? "Kapalı" : "Kapat"}
                    </Button>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="p-4 h-[calc(100vh-400px)] overflow-y-auto">
                  <div className="space-y-3">
                    {selectedConversation.messages.map((msg, index) => {
                      // Debug: Log message to see if image_url exists
                      if (msg.image_url) {
                        console.log("Message with image:", msg);
                      }
                      
                      return (
                        <div
                          key={index}
                          className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender_type === "admin"
                                ? "bg-teal-600 text-white"
                                : "bg-white text-gray-800 border border-gray-200"
                            }`}
                          >
                            {msg.sender_type === "user" && (
                              <p className="text-xs font-semibold text-teal-600 mb-1">
                                {selectedConversation.user_name}
                              </p>
                            )}
                            
                            {/* Message text */}
                            {msg.message && <p className="text-sm">{msg.message}</p>}
                            
                            {/* Image if exists */}
                            {msg.image_url && (
                              <div className="mt-2">
                                <a 
                                  href={`${API}${msg.image_url}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={`${API}${msg.image_url}`}
                                    alt="Uploaded"
                                    className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ maxHeight: '300px' }}
                                    onError={(e) => {
                                      console.error("Image load error:", msg.image_url);
                                      console.error("Full URL attempted:", `${API}${msg.image_url}`);
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </a>
                                <p className="text-xs text-gray-500 mt-1">📎 Image attached</p>
                              </div>
                            )}
                          
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender_type === "admin" ? "text-teal-100" : "text-gray-400"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleString("tr-TR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>

                {/* Reply Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendReply()}
                      placeholder="Cevabınızı yazın..."
                      disabled={sending || selectedConversation.status === "closed"}
                    />
                    <Button
                      onClick={sendReply}
                      disabled={sending || !message.trim() || selectedConversation.status === "closed"}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
