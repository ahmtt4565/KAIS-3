import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageSquare, DollarSign, ChevronLeft, MapPin, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import OnlineStatus from "@/components/OnlineStatus";
import BottomNav from "@/components/BottomNav";
import KaisLogo from "@/components/KaisLogo";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function Chat({ user, logout }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const { listingId, userId } = useParams(); // Get URL params
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showChatList, setShowChatList] = useState(true); // For mobile
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [bothUsersLocation, setBothUsersLocation] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null); // For showing delete menu
  const [selectedChatForDelete, setSelectedChatForDelete] = useState(null); // For deleting entire chat
  
  // Typing indicator states
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchChats();
  }, [user, navigate]);

  // Auto-select chat if coming from listing detail with params
  useEffect(() => {
    if (listingId && userId) {
      console.log("Auto-selecting chat:", listingId, userId);
      
      // First check if chat already exists
      const targetChat = chats.find(
        chat => chat.listing_id === listingId && chat.other_user?.id === userId
      );
      
      if (targetChat) {
        console.log("Found existing chat, selecting");
        handleChatSelect(targetChat);
      } else {
        console.log("Creating new chat for listing:", listingId);
        // If chat doesn't exist, fetch user info and create chat
        fetchUserInfoAndCreateChat(listingId, userId);
      }
    }
  }, [listingId, userId, chats]);

  const fetchUserInfoAndCreateChat = async (listingId, userId) => {
    try {
      // Fetch listing to get owner info
      const listingResponse = await axios.get(`${API}/listings/${listingId}`);
      const listing = listingResponse.data;
      
      setSelectedChat({
        listing_id: listingId,
        other_user: {
          id: userId,
          username: listing.username || "User"
        }
      });
      setShowChatList(false);
      fetchMessages(listingId, userId);
    } catch (error) {
      console.error("Error fetching user info:", error);
      // Fallback: create chat with minimal info
      setSelectedChat({
        listing_id: listingId,
        other_user: { id: userId, username: "User" }
      });
      setShowChatList(false);
      fetchMessages(listingId, userId);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`${API}/chats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({ title: "Error", description: "Could not load conversations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (listingId, otherUserId) => {
    try {
      const response = await axios.get(`${API}/messages/${listingId}/${otherUserId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages(response.data);
      scrollToBottom();
      
      // Mark as read
      await axios.post(
        `${API}/messages/mark-read/${listingId}/${otherUserId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchChats(); // Refresh to update unread count
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowChatList(false); // Hide list on mobile
    fetchMessages(chat.listing_id, chat.other_user.id);
    
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      fetchMessages(chat.listing_id, chat.other_user.id);
    }, 3000);
    
    return () => clearInterval(interval);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    setIsTyping(false); // Stop typing indicator
    
    try {
      await axios.post(
        `${API}/messages`,
        {
          listing_id: selectedChat.listing_id,
          recipient_id: selectedChat.other_user.id,
          content: newMessage.trim(),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNewMessage("");
      await fetchMessages(selectedChat.listing_id, selectedChat.other_user.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Start typing
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  // Simulate other user typing (in a real app, this would come from WebSocket)
  useEffect(() => {
    if (selectedChat && Math.random() > 0.7) {
      // Randomly show typing indicator for demo
      const timeout = setTimeout(() => {
        setOtherUserTyping(true);
        setTimeout(() => setOtherUserTyping(false), 3000);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [messages, selectedChat]);

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      // Remove message from local state
      setMessages(messages.filter(msg => msg.id !== messageId));
      setSelectedMessage(null); // Close the menu
      
      toast({ 
        title: "Message deleted", 
        variant: "default" 
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Could not delete message", 
        variant: "destructive" 
      });
    }
  };

  const deleteEntireChat = async (listingId, otherUserId) => {
    try {
      await axios.delete(`${API}/chats/${listingId}/${otherUserId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      // Remove chat from local state
      setChats(chats.filter(chat => 
        !(chat.listing_id === listingId && chat.other_user.id === otherUserId)
      ));
      
      // If this was the selected chat, clear it
      if (selectedChat?.listing_id === listingId && selectedChat?.other_user.id === otherUserId) {
        setSelectedChat(null);
        setMessages([]);
        setShowChatList(true);
      }
      
      setSelectedChatForDelete(null);
      
      toast({ 
        title: "Chat deleted", 
        description: "All messages have been deleted",
        variant: "default" 
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Could not delete chat", 
        variant: "destructive" 
      });
    }
  };

  const handleMessageLongPress = (msg, e) => {
    if (e) e.stopPropagation();
    if (msg.sender_id === user.id) {
      setSelectedMessage(selectedMessage === msg.id ? null : msg.id);
    }
  };

  // Close delete menu when clicking anywhere
  useEffect(() => {
    if (!selectedMessage) return;
    
    const handleClickOutside = (e) => {
      setSelectedMessage(null);
    };
    
    // Add listener with a small delay to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, { capture: true });
      document.addEventListener('touchend', handleClickOutside, { capture: true });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, { capture: true });
      document.removeEventListener('touchend', handleClickOutside, { capture: true });
    };
  }, [selectedMessage]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchBothUsersLocation = async () => {
    try {
      if (!selectedChat) return;
      
      console.log("Fetching locations for users:", user.id, selectedChat.other_user.id);
      
      // Fetch both users' info
      const [currentUserRes, otherUserRes] = await Promise.all([
        axios.get(`${API}/user/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }),
        axios.get(`${API}/user/${selectedChat.other_user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
      ]);

      const currentUserData = currentUserRes.data;
      const otherUserData = otherUserRes.data;
      
      console.log("Current user data:", currentUserData);
      console.log("Other user data:", otherUserData);

      // Check if both have location sharing enabled
      if (currentUserData.location_sharing_enabled && otherUserData.location_sharing_enabled) {
        if (currentUserData.current_location && otherUserData.current_location) {
          console.log("Both users have location sharing enabled and locations set");
          setBothUsersLocation({
            currentUser: {
              name: currentUserData.username || currentUserData.name || "You",
              location: currentUserData.current_location,
              country: currentUserData.country
            },
            otherUser: {
              name: otherUserData.username || otherUserData.name || selectedChat.other_user.username,
              location: otherUserData.current_location,
              country: otherUserData.country
            }
          });
          setShowLocationModal(true);
        } else {
          console.log("Location data missing:", {
            currentLocation: currentUserData.current_location,
            otherLocation: otherUserData.current_location
          });
          toast({
            title: "Konum bilgisi eksik",
            description: "Bir veya her iki kullanıcı henüz konumunu paylaşmadı. Profile'dan konum paylaşımını aktif edin.",
            variant: "destructive"
          });
        }
      } else {
        console.log("Location sharing not enabled:", {
          currentUserEnabled: currentUserData.location_sharing_enabled,
          otherUserEnabled: otherUserData.location_sharing_enabled
        });
        toast({
          title: "Konum paylaşımı kapalı",
          description: "Her iki kullanıcının da Profile'dan konum paylaşımını aktif etmesi gerekiyor",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      toast({
        title: "Hata",
        description: "Konumlar yüklenemedi: " + (error.response?.data?.detail || error.message),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-purple-900 dark:via-gray-900 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center gap-3">
            {/* Top Row: Back Button and Logo */}
            <div className="w-full flex items-center justify-between">
              {selectedChat && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatList(true)}
                  className="md:hidden"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              
              {/* KaisLogo - Same as Dashboard */}
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => navigate('/dashboard')}
              >
                <KaisLogo className="h-14 w-auto cursor-pointer" />
              </div>
              
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>
            
            {/* Centered Page Title - Bold & Italic */}
            <div className="w-full text-center">
              <h1 className="text-2xl font-bold italic text-gray-800 dark:text-white">CHAT</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex">
        {/* Chat List - Instagram Style */}
        <div className={`${showChatList ? 'flex' : 'hidden'} md:flex w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-xl text-gray-900 dark:text-white">
              Messages
            </h2>
          </div>
          
          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="mb-2 font-semibold text-gray-900 dark:text-white">No messages</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start a conversation from listings</p>
                <Button size="sm" onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Explore Listings
                </Button>
              </div>
            ) : (
              chats.map((chat, index) => {
                const chatKey = `${chat.listing_id}_${chat.other_user?.id}`;
                const isSelected = selectedChatForDelete === chatKey;
                const isAdmin = chat.other_user?.role === 'admin';
                
                return (
                  <div
                    key={index}
                    className="relative"
                  >
                    <div
                      onClick={() => {
                        if (isSelected) {
                          setSelectedChatForDelete(null);
                        } else {
                          handleChatSelect(chat);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (!isAdmin) {
                          e.preventDefault();
                          setSelectedChatForDelete(chatKey);
                        }
                      }}
                      className={`p-3 cursor-pointer transition-all duration-200 ${
                        selectedChat?.other_user?.id === chat.other_user?.id && 
                        selectedChat?.listing_id === chat.listing_id
                          ? 'bg-gray-100 dark:bg-gray-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      } ${isSelected ? 'ring-2 ring-red-500 ring-inset' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar with Story Ring */}
                        <div className="relative flex-shrink-0">
                          <div className="p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                              <span className="font-bold text-white text-xl">
                                {chat.other_user?.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          {/* Online Indicator */}
                          <div className="absolute bottom-0 right-0">
                            <OnlineStatus userId={chat.other_user?.id} size="sm" />
                          </div>
                        </div>
                        
                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {chat.other_user?.username}
                              {isAdmin && <span className="ml-2 text-xs bg-teal-500 text-white px-2 py-0.5 rounded">Admin</span>}
                            </p>
                            {chat.last_message_time && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                                {format(new Date(chat.last_message_time), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          
                          {chat.last_message && (
                            <p className={`text-sm truncate ${
                              chat.unread_count > 0 
                                ? 'text-gray-900 dark:text-white font-medium' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {chat.last_message}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                            {chat.listing_from_currency} → {chat.listing_to_currency}
                          </p>
                        </div>
                        
                        {/* Unread Badge */}
                        {chat.unread_count > 0 && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                    
                    {/* Delete Menu - Instagram style */}
                    {isSelected && !isAdmin && (
                      <div 
                        className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border-t border-b border-red-200 dark:border-red-900/50 z-50 animate-in slide-in-from-top-2 duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => deleteEntireChat(chat.listing_id, chat.other_user?.id)}
                          className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area - Instagram Style */}
        <div className={`${showChatList ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white dark:bg-gray-900`}>
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-gray-900 dark:border-white flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Messages</h3>
                <p className="text-gray-500 dark:text-gray-400">Send private messages to your friends</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header - Instagram Style */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="font-bold text-white text-lg">
                          {selectedChat.other_user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <OnlineStatus userId={selectedChat.other_user?.id} size="sm" showLabel={false} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedChat.other_user?.username}</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700"
                        onClick={() => navigate(`/listing/${selectedChat.listing_id}`)}
                      >
                        View Listing
                      </Button>
                    </div>
                  </div>
                  
                  {/* Location Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchBothUsersLocation}
                    className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">Location</span>
                  </Button>
                </div>
              </div>

              {/* Messages - Instagram Style */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white dark:bg-gray-900">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                    <p>Send a message to start conversation</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isOwnMessage = msg.sender_id === user.id;
                    const isSelected = selectedMessage === msg.id;
                    
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                      >
                        <div className="relative">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isOwnMessage) {
                                handleMessageLongPress(msg);
                              }
                            }}
                            className={`max-w-[75%] md:max-w-[60%] rounded-3xl px-4 py-2.5 ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white cursor-pointer select-none active:scale-95 transition-transform'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                            } ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                          >
                            <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {format(new Date(msg.timestamp), 'HH:mm')}
                            </p>
                          </div>
                          
                          {/* Delete menu - Instagram style */}
                          {isOwnMessage && isSelected && (
                            <div 
                              data-delete-menu
                              className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-200"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMessage(msg.id);
                                }}
                                className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-3xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">yazıyor...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input - Instagram Style */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Send message..."
                    disabled={sending}
                    className="flex-1 border-2 border-gray-200 dark:border-gray-700 rounded-full px-4 py-2.5 focus:border-purple-500 dark:focus:border-purple-500 bg-gray-50 dark:bg-gray-800 dark:text-white transition-colors"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className={`rounded-full w-10 h-10 p-0 transition-all ${
                      newMessage.trim() 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav user={user} />
      <div className="h-20 md:hidden"></div>

      {/* Fullscreen Location Map Modal */}
      {showLocationModal && bothUsersLocation && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-teal-600" />
              Kullanıcı Konumları
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLocationModal(false)}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MapContainer
              center={[
                (bothUsersLocation.currentUser.location.latitude + bothUsersLocation.otherUser.location.latitude) / 2,
                (bothUsersLocation.currentUser.location.longitude + bothUsersLocation.otherUser.location.longitude) / 2
              ]}
              zoom={13}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Current User Marker (Blue) */}
              <Marker
                position={[
                  bothUsersLocation.currentUser.location.latitude,
                  bothUsersLocation.currentUser.location.longitude
                ]}
                icon={blueIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">Sen</p>
                    <p className="text-sm">{bothUsersLocation.currentUser.name}</p>
                    <p className="text-xs text-gray-600">{bothUsersLocation.currentUser.country}</p>
                  </div>
                </Popup>
              </Marker>

              {/* Other User Marker (Red) */}
              <Marker
                position={[
                  bothUsersLocation.otherUser.location.latitude,
                  bothUsersLocation.otherUser.location.longitude
                ]}
                icon={redIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-red-600">{bothUsersLocation.otherUser.name}</p>
                    <p className="text-xs text-gray-600">{bothUsersLocation.otherUser.country}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${bothUsersLocation.otherUser.location.latitude},${bothUsersLocation.otherUser.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 block"
                    >
                      Navigate to this location
                    </a>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Info Footer */}
          <div className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto grid grid-cols-2 gap-4">
              {/* Current User Info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Sen</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{bothUsersLocation.currentUser.name}</p>
                </div>
              </div>

              {/* Other User Info */}
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{bothUsersLocation.otherUser.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{bothUsersLocation.otherUser.country}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
