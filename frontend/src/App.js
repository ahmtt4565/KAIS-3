import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AllListings from "./pages/AllListings";
import CreateListing from "./pages/CreateListing";
import ListingDetail from "./pages/ListingDetail";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import About from "./pages/About";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import LogoPreview from "./pages/LogoPreview";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import KVKKPolicy from "./pages/KVKKPolicy";
import Support from "./pages/Support";
import ExchangeCalculator from "./pages/ExchangeCalculator";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminListings from "./pages/AdminListings";
import AdminSupport from "./pages/AdminSupport";
import AdminMessages from "./pages/AdminMessages";
import AdminGiveaway from "./pages/AdminGiveaway";
import AdminLayout from "./components/AdminLayout";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import KaisLogo from "./components/KaisLogo";
import { MessageSquare } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Set up axios interceptor for auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnreadChat, setLatestUnreadChat] = useState(null);

  useEffect(() => {
    checkAuth();

    // Prevent right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent copy, cut, and paste
    const handleCopy = (e) => {
      e.preventDefault();
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts for copy/cut
    const handleKeyDown = (e) => {
      // Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+U (view source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
      // F12, Ctrl+Shift+I (developer tools)
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    // Minimum splash screen display time (2 seconds)
    const minDisplayTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`);
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    
    // Wait for minimum display time
    await minDisplayTime;
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Notification permission error:', error);
      }
    }
  };

  // Show notification when new message arrives
  const showMessageNotification = (chatInfo) => {
    // Determine chat URL
    const chatUrl = chatInfo 
      ? `/chat/${chatInfo.listing_id}/${chatInfo.sender_id}`
      : '/chat';

    // Show in-app toast notification (works with dark mode)
    toast('New Message', {
      description: 'You have received a new message',
      icon: <MessageSquare className="w-5 h-5 text-teal-600" />,
      action: {
        label: 'View',
        onClick: () => {
          window.location.href = chatUrl;
        }
      },
      duration: 5000,
      className: 'cursor-pointer',
      onClick: () => {
        window.location.href = chatUrl;
      }
    });

    // Also show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('New Message', {
        body: 'You have received a new message',
        icon: '/assets/kais-logo.png',
        badge: '/assets/kais-logo.png',
        tag: 'new-message',
        requireInteraction: false,
        silent: false
      });

      // Navigate to chat when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = chatUrl;
      };
    }
  };

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(`${API}/chats/unread-count`);
      const newCount = response.data.unread_count || 0;
      const latestUnread = response.data.latest_unread || null;
      
      // If count increased, show notification
      setUnreadCount(prevCount => {
        if (newCount > prevCount && prevCount >= 0) {
          // New message received
          console.log('New message received!', latestUnread);
          showMessageNotification(latestUnread);
        }
        return newCount;
      });
      
      setLatestUnreadChat(latestUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (user) {
      requestNotificationPermission();
    }
  }, [user]);

  // Poll for unread messages every 10 seconds
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Set up polling interval
    const interval = setInterval(fetchUnreadCount, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [user]); // Remove unreadCount from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Modern Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 animate-gradient"></div>
        
        {/* Floating Animated Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large floating circles with blur */}
          <div className="absolute w-96 h-96 bg-teal-400/20 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
          <div className="absolute w-96 h-96 bg-pink-400/20 rounded-full blur-3xl -bottom-48 -right-48 animate-float-delayed"></div>
          <div className="absolute w-80 h-80 bg-purple-400/20 rounded-full blur-3xl top-1/4 right-1/4 animate-float-slow"></div>
          
          {/* Glassmorphism cards floating */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 backdrop-blur-lg rounded-2xl rotate-12 animate-float-reverse"></div>
          <div className="absolute bottom-32 right-32 w-24 h-24 bg-white/10 backdrop-blur-lg rounded-2xl -rotate-12 animate-float"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center gap-12 px-4">
          {/* KAIS Text with Modern Animation */}
          <div className="text-center space-y-6">
            {/* Main KAIS Title */}
            <div className="relative">
              {/* Glow effect behind text */}
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-teal-400 to-orange-400 opacity-50 animate-pulse"></div>
              
              {/* Main text */}
              <h1 className="relative text-8xl md:text-9xl lg:text-[12rem] font-black bg-gradient-to-r from-teal-600 via-teal-500 to-orange-500 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in-up tracking-tight">
                KAIS
              </h1>
            </div>

            {/* Subtitle with glassmorphism */}
            <div className="relative px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-xl md:text-2xl text-white font-semibold tracking-wide">
                Peer-to-Peer Currency Exchange
              </p>
            </div>
          </div>

          {/* Modern Loading Indicator */}
          <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Spinner */}
            <div className="relative w-16 h-16">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
              {/* Spinning gradient ring */}
              <div className="absolute inset-0 border-4 border-transparent border-t-white border-r-white rounded-full animate-spin"></div>
              {/* Inner glow */}
              <div className="absolute inset-2 bg-gradient-to-br from-teal-400 to-orange-400 rounded-full blur-md animate-pulse"></div>
            </div>
            
            {/* Loading text */}
            <p className="text-white/80 text-sm font-medium tracking-wider">Loading...</p>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-float-particle"></div>
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/30 rounded-full animate-float-particle-delayed"></div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-float-particle-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-white/50 rounded-full animate-float-particle"></div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-30px); }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-15px) translateX(15px); }
          }
          @keyframes float-reverse {
            0%, 100% { transform: translateY(0px) rotate(12deg); }
            50% { transform: translateY(20px) rotate(12deg); }
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float-particle {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
            50% { transform: translateY(-100px) translateX(50px); opacity: 0; }
          }
          @keyframes float-particle-delayed {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
            50% { transform: translateY(-80px) translateX(-40px); opacity: 0; }
          }
          @keyframes float-particle-slow {
            0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
            50% { transform: translateY(-120px) translateX(-60px); opacity: 0; }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 8s ease-in-out infinite;
          }
          .animate-float-slow {
            animation: float-slow 10s ease-in-out infinite;
          }
          .animate-float-reverse {
            animation: float-reverse 7s ease-in-out infinite;
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }
          .animate-float-particle {
            animation: float-particle 6s ease-in-out infinite;
          }
          .animate-float-particle-delayed {
            animation: float-particle-delayed 8s ease-in-out infinite 2s;
          }
          .animate-float-particle-slow {
            animation: float-particle-slow 10s ease-in-out infinite 4s;
          }
        `}</style>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider user={user}>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage setUser={setUser} />} />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    user={user} 
                    logout={logout} 
                    unreadCount={unreadCount} 
                    setUser={setUser}
                  />
                } 
              />
              <Route path="/listings" element={user ? <AllListings user={user} logout={logout} unreadCount={unreadCount} /> : <Navigate to="/" />} />
              <Route path="/create" element={user ? <CreateListing user={user} logout={logout} /> : <Navigate to="/" />} />
              <Route path="/listing/:id" element={user ? <ListingDetail user={user} logout={logout} /> : <Navigate to="/" />} />
              <Route path="/chat" element={user ? <Chat user={user} logout={logout} unreadCount={unreadCount} /> : <Navigate to="/" />} />
              <Route path="/chat/:listingId/:userId" element={user ? <Chat user={user} logout={logout} unreadCount={unreadCount} /> : <Navigate to="/" />} />
              <Route path="/support" element={user ? <Support user={user} logout={logout} /> : <Navigate to="/" />} />
              <Route path="/profile/:userId" element={user ? <Profile user={user} logout={logout} unreadCount={unreadCount} /> : <Navigate to="/" />} />
            <Route path="/about" element={<About user={user} logout={logout} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/kvkk-policy" element={<KVKKPolicy />} />
            <Route path="/logo-preview" element={<LogoPreview />} />
            <Route path="/admin" element={<AdminLayout user={user} logout={logout}><AdminDashboard user={user} logout={logout} /></AdminLayout>} />
            <Route path="/admin/dashboard" element={<AdminLayout user={user} logout={logout}><AdminDashboard user={user} logout={logout} /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout user={user} logout={logout}><AdminUsers user={user} /></AdminLayout>} />
            <Route path="/admin/listings" element={<AdminLayout user={user} logout={logout}><AdminListings user={user} /></AdminLayout>} />
            <Route path="/admin/messages" element={<AdminLayout user={user} logout={logout}><AdminMessages user={user} /></AdminLayout>} />
            <Route path="/admin/support" element={<AdminLayout user={user} logout={logout}><AdminSupport user={user} /></AdminLayout>} />
            <Route path="/admin/giveaway" element={<AdminLayout user={user} logout={logout}><AdminGiveaway user={user} /></AdminLayout>} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
