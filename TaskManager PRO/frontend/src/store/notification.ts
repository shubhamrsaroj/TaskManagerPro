'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '@/types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      
      addNotification: (notification: Notification) => 
        set((state: NotificationState) => {
          // Check if notification already exists
          const exists = state.notifications.some((n: Notification) => n._id === notification._id);
          if (exists) return state;
          
          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter((n: Notification) => !n.read).length;
          
          return { 
            notifications: newNotifications,
            unreadCount
          };
        }),
      
      markAsRead: (notificationId: string) => 
        set((state: NotificationState) => {
          const updatedNotifications = state.notifications.map((notification: Notification) => 
            notification._id === notificationId 
              ? { ...notification, read: true } 
              : notification
          );
          
          const unreadCount = updatedNotifications.filter((n: Notification) => !n.read).length;
          
          return { 
            notifications: updatedNotifications,
            unreadCount
          };
        }),
      
      markAllAsRead: () => 
        set((state: NotificationState) => ({
          notifications: state.notifications.map((notification: Notification) => ({ 
            ...notification, 
            read: true 
          })),
          unreadCount: 0
        })),
      
      clearNotifications: () => 
        set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'notifications-storage',
    }
  )
); 