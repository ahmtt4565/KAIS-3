import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Send, MessageCircle, Minimize2 } from "lucide-react";
import { playNotificationSound } from "../utils/notificationSound";

export default function SupportChat({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`${API}/support/conversation`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setConversation(response.data);
      setUnreadCount(response.data.unread_user || 0);
      
      // Play sound if new messages arrived
      if (response.data.messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
        const newMessages = response.data.messages.slice(lastMessageCountRef.current);
        const hasAdminMessage = newMessages.some(msg => msg.sender_type === "admin");
        if (hasAdminMessage) {
          playNotificationSound();
        }
      }
      lastMessageCountRef.current = response.data.messages.length;
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      await axios.post(
        `${API}/support/message`,
        { message: message.trim() },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setMessage("");
      await fetchConversation();
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Mesaj gönderilirken hata oluştu");
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async () => {
    if (unreadCount > 0) {
      try {
        await axios.post(
          `${API}/support/mark-read`,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );
        setUnreadCount(0);
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchConversation();
      markAsRead();
      scrollToBottom();
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchConversation, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Poll for unread count when chat is closed
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API}/support/conversation`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          const newUnreadCount = response.data.unread_user || 0;
          if (newUnreadCount > unreadCount) {
            playNotificationSound();
          }
          setUnreadCount(newUnreadCount);
        } catch (error) {
          console.error("Error checking unread:", error);
        }
      }, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, unreadCount]);

  if (!user) return null;

  return (
    <>
      {/* Floating Support Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 shadow-2xl rounded-lg overflow-hidden">
          <Card className="border-2 border-teal-100">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-teal-600 to-orange-500 text-white p-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Canlı Destek
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minimize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            {!isMinimized && (
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-3">
                  {conversation?.messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Merhaba! Size nasıl yardımcı olabiliriz?</p>
                    </div>
                  )}
                  
                  {conversation?.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_type === "user"
                            ? "bg-teal-600 text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        {msg.sender_type === "admin" && (
                          <p className="text-xs font-semibold text-teal-600 mb-1">Destek Ekibi</p>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender_type === "user" ? "text-teal-100" : "text-gray-400"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Mesajınızı yazın..."
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !message.trim()}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
