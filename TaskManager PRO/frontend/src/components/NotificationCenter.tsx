'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import socket from '@/lib/socket';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import type { Notification as NotificationType } from '@/types/notification';
import { FiBell } from 'react-icons/fi';

// Dark theme colors
const colors = {
  background: {
    primary: '#111827',    // Main background
    secondary: '#1F2937',  // Sidebar, cards background
    tertiary: '#374151',   // Hover states, borders
  },
  text: {
    primary: '#F9FAFB',    // Main text
    secondary: '#D1D5DB',  // Secondary text
    muted: '#9CA3AF',      // Muted text
    accent: '#60A5FA',     // Accent text (links, etc)
  },
  border: '#374151',
  accent: '#3B82F6',       // Primary accent color
  red: '#EF4444',
};

// Simple styling for the notification center
const styles = {
  notificationContainer: {
    position: 'relative' as const,
    display: 'inline-block',
  },
  bell: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    cursor: 'pointer',
    fontSize: '20px',
    color: colors.text.secondary,
    borderRadius: '50%',
    transition: 'background-color 0.2s ease',
  },
  badge: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    backgroundColor: colors.red,
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: 'bold' as const,
    boxShadow: '0 0 0 2px #1F2937',
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: '0',
    width: '320px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
    backgroundColor: colors.background.secondary,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    zIndex: 1000,
    border: `1px solid ${colors.border}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  title: {
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    color: colors.text.primary,
  },
  markAllBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: colors.text.accent,
    cursor: 'pointer',
    fontSize: '12px',
  },
  emptyList: {
    padding: '32px 16px',
    textAlign: 'center' as const,
    color: colors.text.muted,
  },
  notificationItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    backgroundColor: colors.background.secondary,
  },
  notificationItemUnread: {
    backgroundColor: colors.background.tertiary,
  },
  notificationTitle: {
    fontSize: '14px',
    margin: '0 0 4px 0',
    color: colors.text.primary,
  },
  notificationTime: {
    fontSize: '12px',
    color: colors.text.muted,
  },
  bellAnimated: {
    animation: 'bell-shake 0.5s ease',
  }
};

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [bellAnimated, setBellAnimated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const socketConnectedRef = useRef(false);
  const sessionKey = useRef<string | null>(null);
  
  // Get current user ID for notifications
  useEffect(() => {
    const user = getUser();
    if (user) {
      // Store the session key to ensure notifications are associated with this session
      sessionKey.current = sessionStorage.getItem('sessionId');
    }
  }, []);
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
      
      // Count unread notifications
      const unreadNotifications = response.data.filter((n: NotificationType) => !n.read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Create an in-memory audio element for notification sound
      const audio = new Audio();
      audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwNgAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD09PT09PUxMTExMWFhYWFhYZmZmZmZmdHR0dHR0goKCgoKCkJCQkJCQnp6enp6eq6urq6urubm5ubm5x8fHx8fH1dXV1dXV4+Pj4+Pj8fHx8fHx////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCQAAAAAAAAAA8c446O9oAAAAAAAAAAAAAAABN/////////8jMD+KY////////////j35yKq//////7qCFiDk5OMeJgWWZUVrP7FrOFZ97/nLHBQZEVF25jCQswjlUcKYW7bWh83XhGYnR///////////ugoRgTk5PjxKCvVRRhcZRJIlI2HfX9nd3GWLnLGCtX/dw0LWZZ0AJVtjIRuPQbfCIGgYAAgIAAAIAH5c2vb0gAAgIAAAIAHeuyrZFdDUACAaAKAAAADOPUOLfWQgIAAAIAHfUE7Z3tggGAAAMACAAAAIZB+0slLwIAAAIAHfTbtrS+mgIAAAIAHeXexL9cIBQKBQKSp0xHBCnyZe5Tjxci/n/7ox2/5AMaDbe5/sQDD/86P+RDP/bPobfSTTZa5Ee8b1D9vx1nL2ZgGaHlnmixGrWqnHb3IjJRuYmCrJ7lGpey3Pi44KAnAVBqII4jGvlGdOqHvWXpJh041TNAuCfBOu3vuxaX1fS1XQZXk6KPN7qlo0aVaRUVxLRrnGcXIzTWWY4QSopIqgMOiPo836A1n9l6Bn/IQn/5w39nvNXzA4BAKBQKAMHnfObHc4yCATisHAGFDNcBAdCgqIGIGwIE5gJgGBwmAsAwliSF4QZQcYjAWD4cJrZVA4BhiAQQAw1jQTFUJw4OwUYzAcEgFM/////////0QT/0QT/0RBP8BAMBgMBgE/rIZM1qUDAYDAYDAZgMBgMBgAIACfBQDA8EA8BgMBgMy1GAwGAwGADM21MBgMBgMBgMBgMBgMBgMA//ULQaCg/2DYHA0GAwMy5HrgYDAYDAf/7EGTvjSAUGAIDAYH/gYDAYP9g2D4PB8HgiD4Nhz//r+DQl/0ZoIGg/qggKAnAzFDLYe///+h9T/nD/8BAKBQKBWOGYEYOPRQKBQKBQKMRQKBQKABQe2FQoFAoFAoFAHGIjNoJTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
      audio.load();
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);
  
  // Initial load of notifications
  useEffect(() => {
    fetchNotifications();
    
    // Set up an interval to refresh notifications every 60 seconds
    const refreshInterval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications();
      }
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [isOpen]);

  // Function to add a new notification
  const addNotification = (notification: NotificationType) => {
    // Check if this notification belongs to the current user
    const user = getUser();
    if (!user || user._id !== notification.user) {
      return; // Not for this user
    }
    
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n._id === notification._id);
      if (exists) return prev;
      
      return [notification, ...prev];
    });
    
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
      
      // Animate bell
      setBellAnimated(true);
      setTimeout(() => setBellAnimated(false), 1000);
      
      // Play sound if available
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.log('Error playing sound:', err));
      }
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      
      setNotifications(prev => {
        return prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        );
      });
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      
      setNotifications(prev => {
        return prev.map(notification => ({ 
          ...notification, 
          read: true 
        }));
      });
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Set up socket connection for real-time notifications
  useEffect(() => {
    // Check if socket is connected, if not, don't set up listeners
    if (!socket.connected) {
      console.log('Socket not connected, waiting for connection...');
      
      const checkConnectionInterval = setInterval(() => {
        if (socket.connected && !socketConnectedRef.current) {
          console.log('Socket now connected, setting up notification listener');
          setupNotificationListener();
          socketConnectedRef.current = true;
          clearInterval(checkConnectionInterval);
        }
      }, 2000);
      
      return () => {
        clearInterval(checkConnectionInterval);
      };
    } else {
      socketConnectedRef.current = true;
      setupNotificationListener();
    }
    
    function setupNotificationListener() {
      // Listen for notifications from the server
      socket.on('notification', (newNotification: NotificationType) => {
        console.log('New notification received:', newNotification);
        
        // Only process notifications for current user session
        if (sessionKey.current) {
          addNotification(newNotification);
          
          // Show browser notification if enabled
          if (window.Notification && window.Notification.permission === 'granted') {
            new window.Notification('TaskManager PRO', {
              body: newNotification.message,
              icon: '/favicon.ico',
            });
          }
        }
      });
    }
    
    // Request notification permission
    if (window.Notification && window.Notification.permission !== 'granted' && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }
    
    return () => {
      socket.off('notification');
    };
  }, []);

  const handleNotificationClick = (notification: NotificationType) => {
    markAsRead(notification._id);
    setIsOpen(false);
    
    // Navigate to the related task if available
    if (notification.taskId) {
      router.push(`/dashboard/tasks/${notification.taskId}`);
      sessionStorage.setItem('currentPath', `/dashboard/tasks/${notification.taskId}`);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    // Refresh notifications when opening dropdown
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Check if it's today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getFullYear() === yesterday.getFullYear();
    
    if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If not today or yesterday, show full date
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.notificationContainer}>
      <div 
        style={{
          ...styles.bell,
          backgroundColor: isOpen ? colors.background.tertiary : 'transparent',
        }}
        className={bellAnimated ? 'bell-animated' : ''}
        onClick={toggleDropdown}
      >
        <FiBell />
        {unreadCount > 0 && (
          <div style={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>
      
      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={styles.title}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                style={styles.markAllBtn}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div style={styles.emptyList}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={styles.emptyList}>
              You don't have any notifications yet.
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.read ? {} : styles.notificationItemUnread),
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p style={styles.notificationTitle}>{notification.message}</p>
                  <p style={styles.notificationTime}>
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .bell-animated {
          animation: bell-shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        
        @keyframes bell-shake {
          0% { transform: rotate(0); }
          15% { transform: rotate(10deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(5deg); }
          60% { transform: rotate(-5deg); }
          75% { transform: rotate(2deg); }
          100% { transform: rotate(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter; 