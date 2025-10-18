import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageSquare, Plus, User, Shield, Headphones, List, DollarSign } from "lucide-react";

export default function BottomNav({ user, unreadCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/listings", icon: List, label: "Listings" },
    { path: "/exchange", icon: DollarSign, label: "Exchange", color: "teal" },
  ];

  const rightNavItems = [
    { path: "/chat", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { path: user ? `/profile/${user.id}` : "/profile", icon: User, label: "Profile" },
  ];
  
  // Add admin nav item if user is admin
  if (user?.role === "admin") {
    rightNavItems.unshift({ path: "/admin", icon: Shield, label: "Admin", color: "purple" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-xl z-40 md:hidden">
      <div className="flex items-center justify-between px-2 py-2 relative">
        {/* Left Navigation Items */}
        <div className="flex items-center justify-around flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isTeal = item.color === "teal";
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all relative ${
                  active
                    ? isTeal
                      ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 shadow-sm"
                      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-xs mt-1 ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Center: Yeni İlan Button - Ultra Modern with Glow */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-50"></div>
            <button
              onClick={() => navigate('/create')}
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Right Navigation Items */}
        <div className="flex items-center justify-around flex-1">
          {rightNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isAdmin = item.color === "purple";
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all relative ${
                  active
                    ? isAdmin 
                      ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 shadow-sm"
                      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-6 h-6 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-xs mt-1 ${active ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
