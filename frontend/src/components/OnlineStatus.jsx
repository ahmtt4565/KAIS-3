import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";

export default function OnlineStatus({ userId, showLabel = false, size = "sm" }) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API}/users/${userId}/status`);
        setIsOnline(response.data.is_online);
        setLastSeen(response.data.last_seen);
      } catch (error) {
        console.error("Error fetching user status:", error);
      }
    };

    fetchStatus();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const getLastSeenText = () => {
    if (!lastSeen) return "Hiç görülmedi";
    
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffMs = now - seen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        {isOnline && (
          <div
            className={`${sizeClasses[size]} rounded-full bg-green-500 absolute top-0 left-0 animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600">
          {isOnline ? "Çevrimiçi" : getLastSeenText()}
        </span>
      )}
    </div>
  );
}
