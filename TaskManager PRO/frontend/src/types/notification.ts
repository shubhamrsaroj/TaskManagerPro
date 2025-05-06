export interface Notification {
  _id: string;
  user: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'system';
  read: boolean;
  taskId?: string;
  createdAt: string;
}

export interface NotificationPayload {
  userId: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'system';
  taskId?: string;
} 