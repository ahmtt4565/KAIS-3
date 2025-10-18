import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, user }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const audioRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasPermission(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setHasPermission(permission === 'granted');
        });
      }
    }
  }, []);

  // Initialize audio element for notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTcIGWm98OScTgwOUKvm8LhoHwU7k9r0yXksBSh+zPLaizsKGGS58OKhUhELTKXh8LdnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7lNv0yHcrBSh+zPDajDsLGGS58OGhUhEKTKXh8LhnHwU7');
    audioRef.current.volume = 0.5;
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Audio error:', err);
    }
  };

  // Show browser notification
  const showBrowserNotification = (title, body, icon) => {
    if (hasPermission && 'Notification' in window) {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'admin-message',
          requireInteraction: true,
        });
      } catch (err) {
        console.log('Notification error:', err);
      }
    }
  };

  // Check for new admin messages
  const checkForAdminMessages = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      // Check support conversation for new admin replies
      const response = await axios.get(`${API}/support/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const conversation = response.data;
      
      if (!conversation || !conversation.messages) return;
      
      // Check if there are any new messages from admin since last check
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (!lastMessage) return;
      
      const messageTime = new Date(lastMessage.timestamp).getTime();
      const isFromAdmin = lastMessage.from_admin === true;
      const isNew = messageTime > lastChecked;
      
      if (isFromAdmin && isNew) {
        // Play sound and show notification
        playNotificationSound();
        showBrowserNotification(
          '🔔 Yeni Destek Mesajı',
          lastMessage.message || 'Destek ekibinden size yeni bir mesaj geldi!',
          '/favicon.ico'
        );
        
        setLastChecked(Date.now());
      }
    } catch (error) {
      console.log('Error checking admin messages:', error);
    }
  };

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!user) return;

    // Initial check
    checkForAdminMessages();

    // Set up polling interval
    const interval = setInterval(() => {
      checkForAdminMessages();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user, lastChecked]);

  const value = {
    hasPermission,
    playNotificationSound,
    showBrowserNotification,
    checkForAdminMessages,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
