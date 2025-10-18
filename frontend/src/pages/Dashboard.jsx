import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, MessageSquare, LogOut, User, DollarSign, MapPin, Star, Search, X, Instagram, Menu, Headphones, ChevronUp, Sparkles, ArrowRight, RefreshCw, Share2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import OnlineStatus from "@/components/OnlineStatus";
import BottomNav from "@/components/BottomNav";
import GiveawayCard from "@/components/GiveawayCard";
import KaisLogo from "@/components/KaisLogo";
import OnboardingTutorial from "@/components/OnboardingTutorial";

import { CURRENCIES, COUNTRIES } from "../data/countries-currencies";
import { getCountryShortName } from "../data/countries-currencies";

export default function Dashboard({ user, logout, unreadCount = 0, setUser }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [giveaway, setGiveaway] = useState(null);
  const [myParticipation, setMyParticipation] = useState(null);
  const [filters, setFilters] = useState({
    country: "",
    from_currency: "",
    to_currency: "",
    search: ""
  });
  const [loading, setLoading] = useState(true);
  const [processingGoogleAuth, setProcessingGoogleAuth] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Pull-to-refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  
  // Scroll behavior states
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Google OAuth - Check for session_id in URL hash or query params
  useEffect(() => {
    const processGoogleSession = async () => {
      // Check both hash fragment and query parameters
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(hash.substring(1));
      
      // Try to get session_id from either source
      let session_id = hashParams.get('session_id') || searchParams.get('session_id');
      
      console.log('🔍 Google OAuth Debug:', {
        hash,
        search: window.location.search,
        session_id,
        fullUrl: window.location.href
      });
      
      if (session_id) {
        console.log('✅ Session ID found, processing...', session_id);
        setProcessingGoogleAuth(true);
        try {
          const response = await axios.post(`${API}/auth/google/session`, { session_id });
          
          console.log('✅ Backend response:', response.data);
          
          // Store JWT token
          localStorage.setItem('token', response.data.jwt_token);
          
          console.log('✅ Token stored');
          
          // Get user data
          const userResponse = await axios.get(`${API}/auth/me`);
          console.log('✅ User data fetched:', userResponse.data);
          
          // Set user in parent component
          if (setUser) {
            setUser(userResponse.data);
          }
          
          // Clean URL and redirect to dashboard
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('❌ Google auth error:', error.response?.data || error.message);
          setProcessingGoogleAuth(false);
          alert('Google login failed. Please try again.');
          // Redirect to landing page on error
          navigate('/');
        }
      } else {
        console.log('⚠️ No session_id found in URL');
        // If no session_id and no user, redirect to home
        if (!user) {
          navigate('/');
        }
      }
    };
    
    processGoogleSession();
  }, [navigate, setUser, user]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px
        setShowHeader(false);
      } else {
        // Scrolling up
        setShowHeader(true);
      }
      
      // Show/hide scroll to top button
      setShowScrollTop(currentScrollY > 300);
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pull-to-refresh functions
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && pullStartY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - pullStartY;
      
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      await fetchData();
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setPullStartY(0);
      }, 1000);
    } else {
      setPullDistance(0);
      setPullStartY(0);
    }
  };

  useEffect(() => {
    fetchData();
    requestNotificationPermission();
    checkTutorial();
  }, []);

  // Check if user should see tutorial
  const checkTutorial = () => {
    if (user && !user.has_seen_tutorial) {
      setShowTutorial(true);
    }
  };

  // Share listing functions
  const [copiedId, setCopiedId] = useState(null);

  const shareToWhatsApp = (listing, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/listing/${listing.id}`;
    const text = `Check out this currency exchange on KAIS!\n\n💱 ${listing.from_amount} ${listing.from_currency} → ${listing.to_amount || 'Negotiable'} ${listing.to_currency}\n📍 ${listing.city}, ${listing.country}\n\n`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyListingLink = async (listing, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/listing/${listing.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(listing.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, listings]);

  // Polling is now handled in App.js, so we can remove this interval
  // Just keep the notification permission request
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Request notification permission only
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
        console.log("Notification permission requested");
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }
  };

  const fetchData = async () => {
    try {
      const [listingsRes, notificationsRes, giveawayRes, participationRes] = await Promise.all([
        axios.get(`${API}/listings`),
        axios.get(`${API}/notifications`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API}/giveaway/active`).catch(() => ({ data: null })),
        axios.get(`${API}/giveaway/my-participation`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).catch(() => ({ data: null }))
      ]);
      setListings(listingsRes.data);
      setFilteredListings(listingsRes.data);
      setNotifications(notificationsRes.data);
      setGiveaway(giveawayRes.data);
      setMyParticipation(participationRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Instagram link handler
  const handleInstagramClick = () => {
    window.open('https://instagram.com/kaissocial', '_blank');
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (filters.country) {
      filtered = filtered.filter(l => l.country === filters.country);
    }
    if (filters.from_currency) {
      filtered = filtered.filter(l => l.from_currency === filters.from_currency);
    }
    if (filters.to_currency) {
      filtered = filtered.filter(l => l.to_currency === filters.to_currency);
    }
    if (filters.search) {
      filtered = filtered.filter(l => 
        l.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        l.city?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  };

  const clearFilters = () => {
    setFilters({ country: "", from_currency: "", to_currency: "", search: "" });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.country !== "" || filters.from_currency !== "" || filters.to_currency !== "" || filters.search !== "";

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API}/notifications/${notificationId}`);
      // Remove from local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await axios.post(`${API}/notifications/${notification.id}/read`);
        setNotifications(notifications.map(n => 
          n.id === notification.id ? {...n, read: true} : n
        ));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    if (notification.type === 'message') {
      navigate('/chat');
    } else if (notification.type === 'listing') {
      navigate('/listings');
    } else if (notification.type === 'giveaway') {
      // Stay on dashboard (giveaway section)
      setShowNotifications(false);
    } else {
      // Default: close dropdown
      setShowNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter(n => !n.read).map(n => 
          axios.post(`${API}/notifications/${n.id}/read`)
        )
      );
      setNotifications(notifications.map(n => ({...n, read: true})));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Show loading screen while processing Google auth
  if (processingGoogleAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 via-orange-400 to-orange-500 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Completing Google Sign In...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center bg-gradient-to-r from-teal-500 to-orange-500 text-white transition-all duration-300"
          style={{ 
            height: `${pullDistance}px`,
            opacity: pullDistance / 60
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              <span className="text-sm font-medium">Yenileniyor...</span>
            </div>
          ) : (
            <span className="text-sm font-medium">
              {pullDistance > 60 ? '↓ Bırakın' : '↓ Yenilemek için çekin'}
            </span>
          )}
        </div>
      )}

      {/* Onboarding Tutorial - Sadece ilk giriş */}
      {showTutorial && (
        <OnboardingTutorial 
          onComplete={() => {
            setShowTutorial(false);
            // Update user object
            if (user) {
              setUser({ ...user, has_seen_tutorial: true });
            }
          }} 
        />
      )}

      {/* Modern Header with Glass Effect - Hide on scroll down */}
      <header className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
              onClick={() => navigate('/dashboard')}
              style={{ cursor: 'pointer' }}
            >
              <KaisLogo className="h-14 w-auto cursor-pointer" />
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Desktop Navigation - Ultra Modern with Colors */}
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/about')}
                  data-testid="about-nav-btn"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  About
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/listings')}
                  data-testid="listings-nav-btn"
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  Listings
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/30 hover:text-pink-600 dark:hover:text-pink-400 transition-all"
                  onClick={() => navigate('/chat')}
                  data-testid="chat-nav-btn"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/support')}
                  data-testid="support-nav-btn"
                  title="Destek"
                  className="rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all"
                >
                  <Headphones className="w-5 h-5" />
                </Button>
              </div>

              {/* Notifications + Profile */}
              <div className="flex items-center gap-2">
                {/* Notifications Bell - Ultra Modern */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                    data-testid="notifications-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </Button>
                
                {/* Dropdown */}
                {showNotifications && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40 bg-black/20" 
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    
                    {/* Dropdown Content - Mobile Full Screen / Desktop Dropdown */}
                    <div className="fixed sm:absolute inset-x-4 top-20 sm:right-0 sm:left-auto sm:top-auto sm:inset-x-auto bottom-auto sm:mt-2 sm:w-96 sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {notifications.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="text-xs text-teal-600"
                              >
                                Mark All
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNotifications(false)}
                              className="sm:hidden"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-[calc(100vh-12rem)] sm:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!notification.read ? 'bg-teal-50 dark:bg-teal-900/20' : ''}`}
                                data-testid={`notification-${notification.id}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} break-words`}>
                                      {notification.content}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {format(new Date(notification.created_at), 'dd MMM HH:mm')}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="shrink-0 h-8 w-8 p-0"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Support Button - Ultra Modern */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/support')}
                  data-testid="support-nav-btn-header"
                  title="Support"
                  className="rounded-full hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all md:hidden"
                >
                  <Headphones className="w-5 h-5" />
                </Button>
            </div>

            {/* Desktop Only: Profile & Admin - Ultra Modern */}
            <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/profile/${user.id}`)}
                  data-testid="profile-nav-btn"
                  className="rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <User className="w-5 h-5" />
                </Button>

                {user?.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin')}
                    data-testid="admin-panel-btn"
                    className="rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={logout}
                  data-testid="logout-btn"
                  className="rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 md:py-6">
        {/* Instagram Card - Modern & Compact */}
        <div className="mb-4">
          <Card className="relative overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 group">
            {/* Subtle gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>
            
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left Side - Instagram Info */}
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Instagram Logo - Compact */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                      <Instagram className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                  </div>
                  
                  {/* Text Content - Compact */}
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Follow us</p>
                    <a 
                      href="https://instagram.com/kaissocial" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group/link block"
                    >
                      <h3 className="text-lg md:text-xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent group-hover/link:from-purple-700 group-hover/link:via-pink-700 group-hover/link:to-orange-700 transition-all flex items-center gap-1.5">
                        @kaissocial
                        <ArrowRight className="w-4 h-4 text-pink-500 opacity-0 group-hover/link:opacity-100 transform -translate-x-1 group-hover/link:translate-x-0 transition-all" />
                      </h3>
                    </a>
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-pink-500" />
                      Updates & giveaways
                    </p>
                  </div>
                </div>

                {/* Right Side - CTA Button - Compact */}
                <a 
                  href="https://instagram.com/kaissocial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-full md:w-auto"
                >
                  <button className="group/btn w-full md:w-auto px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                    <Instagram className="w-4 h-4" />
                    <span>Follow</span>
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Giveaway Card */}
        <div className="mb-4">
          <GiveawayCard 
            giveaway={giveaway} 
            myParticipation={myParticipation} 
            user={user}
            onParticipated={fetchData}
          />
        </div>

        {/* Filter Card */}
        <div className="mb-4">
          <Card className="border-2 border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 overflow-hidden shadow-md">
            <CardContent className="p-3 md:p-4">
              <div className="space-y-4">
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-orange-800 dark:text-orange-400">Smart Filter</h3>
                      <p className="text-xs text-orange-700 dark:text-orange-500 font-medium">
                        {filteredListings.length} listings found
                      </p>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="text-orange-600 border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-semibold"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className="w-4 h-4 text-orange-600" />
                  </div>
                  <Input
                    placeholder="Search listing, city or user..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="h-10 pl-10 text-sm bg-white dark:bg-gray-700 border-2 border-orange-300 dark:border-orange-600 rounded-lg"
                  />
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                    className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">All Countries</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>
                        {getCountryShortName(country)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.from_currency}
                    onChange={(e) => setFilters({...filters, from_currency: e.target.value})}
                    className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Sending Currency</option>
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>

                  <select
                    value={filters.to_currency}
                    onChange={(e) => setFilters({...filters, to_currency: e.target.value})}
                    className="h-10 px-3 text-sm border-2 border-orange-300 dark:border-orange-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Receiving Currency</option>
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              Featured Listings
            </h3>
            <Button
              onClick={() => navigate('/listings')}
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900"
            >
              View All Listings ({filteredListings.length})
            </Button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-4">No listings found matching your filters</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {filteredListings.slice(0, 6).map(listing => (
                  <div
                    key={listing.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    data-testid={`listing-card-${listing.id}`}
                  >
                    <div className="flex items-stretch">
                      {/* Left colored stripe */}
                      <div className="w-1 bg-gradient-to-b from-yellow-400 to-orange-500 group-hover:w-2 transition-all"></div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          {/* Main Info */}
                          <div className="flex-1 min-w-0">
                            {/* Title Row */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {listing.country}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(listing.created_at), "dd MMM yyyy")}
                              </span>
                            </div>

                            {/* Exchange Info */}
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Sending:</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {listing.from_amount.toLocaleString()} {listing.from_currency}
                                </span>
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Receiving:</span>
                                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                  {listing.to_amount ? `${listing.to_amount.toLocaleString()} ${listing.to_currency}` : "Negotiable"}
                                </span>
                              </div>
                            </div>

                            {/* Location & Description */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{listing.city}</span>
                              </div>
                              <span className="text-gray-500 dark:text-gray-500">•</span>
                              <p className="text-gray-600 dark:text-gray-400 truncate flex-1">
                                {listing.description}
                              </p>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                @{listing.username}
                              </span>
                            </div>
                          </div>

                          {/* Right Action */}
                          <div className="flex flex-col items-end justify-between gap-2">
                            <Button
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/listing/${listing.id}`);
                              }}
                            >
                              Detail
                            </Button>
                            
                            {/* Share Buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={(e) => shareToWhatsApp(listing, e)}
                                title="Share on WhatsApp"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={(e) => copyListingLink(listing, e)}
                                title="Copy link"
                              >
                                {copiedId === listing.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredListings.length > 6 && (
                <div className="text-center mt-6">
                  <Button
                    onClick={() => navigate('/listings')}
                    size="lg"
                  >
                    View All {filteredListings.length} Listings
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Scroll to Top Button - Teal Theme */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40 p-3 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-2xl hover:shadow-teal-500/50 hover:scale-110 transition-all duration-300 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          aria-label="Scroll to Top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav user={user} unreadCount={unreadCount} />
      
      {/* Bottom padding for mobile to prevent content hiding behind bottom nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  );
}