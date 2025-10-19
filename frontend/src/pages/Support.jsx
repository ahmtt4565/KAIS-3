import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, MessageCircle, User as UserIcon, Shield, MessageSquare, Volume2, VolumeX, Loader2, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import BottomNav from "@/components/BottomNav";
import KaisLogo from "@/components/KaisLogo";

export default function Support({ user, logout }) {
  const navigate = useNavigate();
  const [conversation, setConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [isTypingAdmin, setIsTypingAdmin] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Modern notification sound using Web Audio API
  const createModernNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Modern notification: two-tone chime
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // E note
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // C note
      
      // Fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log("Web Audio API not supported:", e);
    }
  };
  
  useEffect(() => {
    // No need to initialize audio ref for Web Audio API
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Scroll handler for hiding/showing header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & past 80px
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      createModernNotificationSound();
    }
  };

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    const wsUrl = `${API.replace('http', 'ws')}/support/ws/${token}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
      setLoading(false);
      // Fetch conversation immediately to show any existing messages or welcome message
      fetchConversation();
    };
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "welcome") {
        // Play sound for welcome message
        playNotificationSound();
        fetchConversation();
      } else if (data.type === "message_sent") {
        fetchConversation();
      } else if (data.type === "new_admin_message") {
        // Play sound for admin message
        playNotificationSound();
        fetchConversation();
      } else if (data.type === "admin_typing") {
        setIsTypingAdmin(data.typing);
      } else if (data.type === "conversation_closed") {
        playNotificationSound();
        fetchConversation();
      } else if (data.type === "followup_message") {
        // Play sound for follow-up message
        playNotificationSound();
        fetchConversation();
      } else if (data.type === "messages_deleted") {
        // Messages were auto-deleted, refresh conversation
        console.log(`🗑️ ${data.deleted_count} messages auto-deleted`);
        fetchConversation();
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };
    
    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current.readyState === WebSocket.CLOSED) {
          connectWebSocket();
        }
      }, 3000);
    };
  };

  const fetchConversation = async () => {
    try {
      const response = await axios.get(`${API}/support/conversation`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setConversation(response.data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || !connected) return;

    setSending(true);
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage();
        if (!imageUrl && !message.trim()) {
          // If upload failed and no text, don't send
          setSending(false);
          return;
        }
      }
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "message",
          message: message.trim() || "(Image)",
          image_url: imageUrl
        }));
        setMessage("");
        handleRemoveImage();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "typing",
        typing: true
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "typing",
            typing: false
          }));
        }
      }, 2000);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('📷 Please select an image file\n\nSupported formats: JPG, PNG, GIF, WebP');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`📷 Image too large!\n\nYour image: ${sizeMB}MB\nMax allowed: 5MB\n\nPlease choose a smaller image.`);
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const response = await axios.post(`${API}/support/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      return response.data.image_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("❌ Failed to upload image\n\nPlease check your connection and try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
          <div className="text-xl text-gray-600 dark:text-gray-400">Connecting to support...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header with scroll behavior */}
      <header className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/dashboard')}
              >
                <KaisLogo className="h-12 w-auto" />
              </div>
            </div>
            
            {/* Centered Live Support Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold italic bg-gradient-to-r from-teal-600 to-orange-500 bg-clip-text text-transparent whitespace-nowrap">
                Live Support
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {connected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/about')}>
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/listings')}>
                Listings
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
                <MessageSquare className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${user?.id || ''}`)}>
                <UserIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area - Mobile Optimized */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 pb-24 md:pb-4">
        <Card className="border-2 border-teal-100 dark:border-gray-700 dark:bg-gray-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-500 to-orange-500 text-white border-b py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Support Chat
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              Real-time • 3-5 min response
            </p>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Messages - Better height for mobile */}
            <div className="h-[calc(100vh-20rem)] sm:h-[50vh] overflow-y-auto p-3 sm:p-4 space-y-2 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
              {conversation?.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="w-16 h-16 text-teal-300 dark:text-teal-600 mb-3 animate-bounce" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                    No messages yet
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Start a conversation with our support team
                  </p>
                </div>
              ) : (
                <>
                  {conversation?.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.sender_type === "user" ? "justify-end" : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] ${
                          msg.sender_id === "system"
                            ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 border-2 border-yellow-300"
                            : msg.sender_type === "user"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                        } rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 transform hover:scale-105 transition-transform`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {msg.sender_id === "system" ? (
                            <MessageCircle className="w-3.5 h-3.5 text-yellow-300" />
                          ) : msg.sender_type === "admin" ? (
                            <Shield className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <UserIcon className="w-3.5 h-3.5 text-white" />
                          )}
                          <span className="font-semibold text-xs text-white">
                            {msg.sender_id === "system" ? "KAIS 🤖" : msg.sender_type === "admin" ? "Support" : "You"}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-white">
                          {msg.message}
                        </p>
                        {msg.image_url && (
                          <div className="mt-2">
                            <img 
                              src={`${API}${msg.image_url}`}
                              alt="Attachment"
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity"
                              onClick={() => window.open(`${API}${msg.image_url}`, '_blank')}
                              style={{ maxHeight: '250px' }}
                            />
                          </div>
                        )}
                        <p className="text-[10px] mt-1 text-white/80">
                          {format(new Date(msg.timestamp), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTypingAdmin && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
                      <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white rounded-2xl px-3 py-2 shadow-lg shadow-orange-500/30">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-white" />
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                          <span className="text-xs text-white">typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area - Mobile Friendly */}
            <form onSubmit={sendMessage} className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4">
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-32 sm:h-24 rounded-lg border-2 border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 active:scale-95 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,image/heic,image/heif"
                  onChange={handleImageSelect}
                  className="hidden"
                  multiple={false}
                />
                
                {/* Image button */}
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploadingImage || !connected}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 h-12 sm:h-10 rounded-lg shrink-0"
                  title="Add Image/Photo"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                
                <Input
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type message..."
                  className="flex-1 border-2 border-teal-200 dark:border-gray-600 focus:border-teal-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg h-12 sm:h-10 text-base px-4"
                  disabled={sending || uploadingImage || !connected}
                />
                <Button
                  type="submit"
                  disabled={sending || uploadingImage || (!message.trim() && !selectedImage) || !connected}
                  className="bg-gradient-to-r from-teal-600 to-orange-500 hover:from-teal-700 hover:to-orange-600 text-white px-4 sm:px-5 h-12 sm:h-10 rounded-lg shadow-lg hover:shadow-xl transform active:scale-95 transition-all shrink-0"
                >
                  {sending || uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Info - Cleaner */}
        <div className="mt-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-teal-100 dark:border-gray-700 p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <MessageCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white block text-xs sm:text-sm">Response</span>
                <span className="text-gray-600 dark:text-gray-300 text-xs">3-5 min</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Shield className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white block text-xs sm:text-sm">Support</span>
                <span className="text-gray-600 dark:text-gray-300 text-xs">24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav user={user} />
    </div>
  );
}
