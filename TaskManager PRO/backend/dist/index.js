"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_cron_1 = __importDefault(require("node-cron"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const users_1 = __importDefault(require("./routes/users"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Middleware
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
// Models
const User_1 = require("./models/User");
const Notification_1 = require("./models/Notification");
// Services 
const recurringTaskService_1 = require("./services/recurringTaskService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database connection with improved options
mongoose_1.default
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task-manager-pro', {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return next(new Error('User not found'));
        }
        // Save user to socket object for later use
        socket.data.user = user;
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Invalid token'));
    }
});
// Store connected sockets by user ID
const connectedUsers = new Map();
// Socket.io connection handling
io.on('connection', (socket) => {
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
const createNotification = async (userId, message, type, taskId) => {
    try {
        // Create notification in database
        const notification = new Notification_1.Notification({
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
    }
    catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};
exports.createNotification = createNotification;
// Setup cron jobs for recurring tasks
// Run every day at midnight
node_cron_1.default.schedule('0 0 * * *', async () => {
    console.log('Running scheduled task: Processing recurring tasks');
    try {
        // Process tasks that were completed and need new instances
        await (0, recurringTaskService_1.processCompletedRecurringTasks)();
        // Generate upcoming recurring tasks
        await (0, recurringTaskService_1.generateUpcomingRecurringTasks)();
    }
    catch (error) {
        console.error('Error in recurring tasks cron job:', error);
    }
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/tasks', auth_2.authenticateToken, tasks_1.default);
app.use('/api/users', auth_2.authenticateToken, users_1.default);
app.use('/api/notifications', auth_2.authenticateToken, notifications_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
