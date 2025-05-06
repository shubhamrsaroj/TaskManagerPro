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
    origin: function(origin, callback) {
      if(!origin) return callback(null, true);
      
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'https://taskmanagerpr.netlify.app'
      ];
      
      if(allowedOrigins.indexOf(normalizedOrigin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
    
    // Remove any trailing slash from the origin
    const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const allowedOrigins = [
      'http://localhost:3000',
      'https://taskmanagerpr.netlify.app'
    ];
    
    if(allowedOrigins.indexOf(normalizedOrigin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Database connection with improved options and retry logic
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager-pro', {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      console.log('Retrying MongoDB connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

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

// Debug routes
app.get('/api/debug/cors', (req, res) => {
  res.json({ 
    message: 'CORS is working correctly',
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/debug/db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      state: states[dbState],
      connected: dbState === 1,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Add debug endpoint for task-related issues
app.get('/api/debug/tasks', authenticateToken, async (req: any, res) => {
  try {
    const { Task } = await import('./models/Task');
    
    // Get counts of tasks by status and assignee
    const tasks = await Task.find({}).select('_id title status assignedTo').lean();
    const totalCount = tasks.length;
    
    // Count by status
    const statusCounts = tasks.reduce((acc: any, task: any) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});
    
    // Count by assignee
    const assigneeCounts = tasks.reduce((acc: any, task: any) => {
      const assigneeId = task.assignedTo ? task.assignedTo.toString() : 'unassigned';
      acc[assigneeId] = (acc[assigneeId] || 0) + 1;
      return acc;
    }, {});
    
    // Get current user's tasks
    const currentUserTasks = tasks.filter((task: any) => 
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString()
    );
    
    res.json({
      totalTasks: totalCount,
      statusCounts,
      assigneeCounts,
      userTaskCount: currentUserTasks.length,
      userRole: req.user.role,
      userId: req.user._id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: String(error),
      timestamp: new Date().toISOString() 
    });
  }
});

// Add debug endpoint for user roles and permissions
app.get('/api/debug/roles', authenticateToken, async (req: any, res) => {
  try {
    const { User } = await import('./models/User');
    const { getAllPermissions } = await import('./middleware/rbac');
    
    // Get basic user info
    const users = await User.find({})
      .select('_id name email role')
      .sort({ role: 1, name: 1 })
      .lean();
    
    // Get current user's permissions
    const currentUserPermissions = getAllPermissions(req.user.role);
    
    res.json({
      users: users.map(user => ({
        ...user,
        isCurrentUser: user._id.toString() === req.user._id.toString()
      })),
      userCount: users.length,
      roleCount: users.reduce((acc: any, user: any) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      currentUser: {
        _id: req.user._id,
        role: req.user.role,
        permissions: currentUserPermissions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: String(error),
      timestamp: new Date().toISOString() 
    });
  }
});

// Add health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 