import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';

// Routes
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import userRoutes from './routes/users';
import notificationRoutes from './routes/notifications';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Models
import { User } from './models/User';
import { Notification } from './models/Notification';

// Services 
import { processCompletedRecurringTasks, generateUpcomingRecurringTasks } from './services/recurringTaskService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection with improved options
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager-pro', {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }
    
    // Save user to socket object for later use
    socket.data.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Invalid token'));
  }
});

// Store connected sockets by user ID
const connectedUsers = new Map<string, Socket>();

// Socket.io connection handling
io.on('connection', (socket: Socket) => {
  // Store user connection 
  if (socket.data.user) {
    const userId = socket.data.user._id.toString();
    connectedUsers.set(userId, socket);
    console.log('User connected:', userId, socket.id);
  }

  socket.on('disconnect', () => {
    if (socket.data.user) {
      const userId = socket.data.user._id.toString();
      connectedUsers.delete(userId);
      console.log('User disconnected:', userId, socket.id);
    }
  });
});

// Create a notification and send to user through socket if connected
export const createNotification = async (
  userId: string,
  message: string,
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'system',
  taskId?: string,
) => {
  try {
    // Create notification in database
    const notification = new Notification({
      user: userId,
      message,
      type,
      taskId,
      read: false,
    });
    
    await notification.save();
    
    // Send to user if online
    const userSocket = connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Setup cron jobs for recurring tasks
// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled task: Processing recurring tasks');
  try {
    // Process tasks that were completed and need new instances
    await processCompletedRecurringTasks();
    
    // Generate upcoming recurring tasks
    await generateUpcomingRecurringTasks();
  } catch (error) {
    console.error('Error in recurring tasks cron job:', error);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 