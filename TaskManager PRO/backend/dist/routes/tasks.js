"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Task_1 = require("../models/Task");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("../index");
const recurringTaskService_1 = require("../services/recurringTaskService");
const router = express_1.default.Router();
// All task routes require authentication
router.use(auth_1.authenticateToken);
// Create task - requires tasks:create permission
router.post('/', (0, auth_1.checkPermission)('tasks:create'), [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Title is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('dueDate').isISO8601().withMessage('Valid due date is required'),
    (0, express_validator_1.body)('priority')
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    (0, express_validator_1.body)('assignedTo').notEmpty().withMessage('Assignee is required'),
    // Recurring task validation
    (0, express_validator_1.body)('isRecurring').optional().isBoolean(),
    (0, express_validator_1.body)('recurringType')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'custom'])
        .withMessage('Recurring type must be daily, weekly, monthly, or custom'),
    (0, express_validator_1.body)('recurringInterval')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Recurring interval must be a positive integer'),
    (0, express_validator_1.body)('recurringDays')
        .optional()
        .isArray()
        .withMessage('Recurring days must be an array'),
    (0, express_validator_1.body)('recurringDays.*')
        .optional()
        .isInt({ min: 0, max: 6 })
        .withMessage('Recurring days must be between 0 and 6'),
    (0, express_validator_1.body)('recurringDate')
        .optional()
        .isInt({ min: 1, max: 31 })
        .withMessage('Recurring date must be between 1 and 31'),
    (0, express_validator_1.body)('recurringEndDate')
        .optional()
        .isISO8601()
        .withMessage('Valid recurring end date is required'),
], async (req, res) => {
    var _a, _b;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { title, description, dueDate, priority, assignedTo, isRecurring, recurringType, recurringInterval, recurringDays, recurringDate, recurringEndDate } = req.body;
        // Check if assigned user exists
        const assignedUser = await User_1.User.findById(assignedTo);
        if (!assignedUser) {
            return res.status(404).json({ message: 'Assigned user not found' });
        }
        // Validate recurring task fields
        if (isRecurring && !recurringType) {
            return res.status(400).json({ message: 'Recurring type is required for recurring tasks' });
        }
        // Create the task
        const task = new Task_1.Task({
            title,
            description,
            dueDate,
            priority,
            assignedTo,
            createdBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            isRecurring,
            recurringType,
            recurringInterval,
            recurringDays,
            recurringDate,
            recurringEndDate
        });
        await task.save();
        // If this is a recurring task, generate the first instance
        if (isRecurring) {
            await (0, recurringTaskService_1.createRecurringTaskInstance)(task);
        }
        // Send notification to assigned user if it's not the creator
        if (assignedTo !== ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id.toString())) {
            await (0, index_1.createNotification)(assignedTo, `You have been assigned a new task: ${title}`, 'task_assigned', task._id.toString());
        }
        res.status(201).json({
            message: 'Task created successfully',
            task,
        });
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get all tasks (with filters)
// Different behavior based on role:
// - Admin/Manager - Can see all tasks with optional filters
// - Regular user - Can only see tasks assigned to them or created by them
router.get('/', async (req, res) => {
    try {
        const { status, priority, search, assignedTo, createdBy, isRecurring, recurringType, sortBy = 'dueDate', sortOrder = 'asc', limit, } = req.query;
        const query = {};
        // Apply filters
        if (status)
            query.status = status;
        if (priority)
            query.priority = priority;
        if (isRecurring !== undefined)
            query.isRecurring = isRecurring === 'true';
        if (recurringType)
            query.recurringType = recurringType;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }
        // Role-based access control for task visibility
        const user = req.user;
        const canSeeAllTasks = user.role === 'admin' || user.role === 'manager';
        if (!canSeeAllTasks) {
            // Regular users can only see tasks assigned to them or created by them
            query.$or = [
                { assignedTo: user._id },
                { createdBy: user._id }
            ];
        }
        else {
            // Admin/manager can filter by specific assignee or creator if requested
            if (assignedTo)
                query.assignedTo = assignedTo;
            if (createdBy)
                query.createdBy = createdBy;
        }
        // Create sort object with proper type
        const sortField = sortBy;
        const sortObj = {};
        sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;
        let tasksQuery = Task_1.Task.find(query)
            .sort(sortObj)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        // Apply limit if provided
        if (limit) {
            const limitNum = parseInt(limit, 10);
            tasksQuery = tasksQuery.limit(limitNum);
        }
        const tasks = await tasksQuery;
        res.json(tasks);
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get task statistics
router.get('/stats', async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userId = req.user._id;
        const isAdmin = req.user.role === 'admin';
        const isManager = req.user.role === 'manager';
        // Base query object
        let baseQuery = {};
        // Role-based filtering
        if (!isAdmin && !isManager) {
            // Regular users only see stats for their tasks
            baseQuery.$or = [
                { assignedTo: userId },
                { createdBy: userId }
            ];
        }
        // Get counts for each status
        const statusCounts = await Task_1.Task.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        // Get counts for each priority
        const priorityCounts = await Task_1.Task.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        // Get counts for tasks due today, this week, and overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        // Overdue tasks (due date before today and not completed)
        const overdueCount = await Task_1.Task.countDocuments({
            ...baseQuery,
            dueDate: { $lt: today },
            status: { $ne: 'completed' }
        });
        // Due today
        const dueTodayCount = await Task_1.Task.countDocuments({
            ...baseQuery,
            dueDate: {
                $gte: today,
                $lt: tomorrow
            }
        });
        // Due this week
        const dueThisWeekCount = await Task_1.Task.countDocuments({
            ...baseQuery,
            dueDate: {
                $gte: today,
                $lt: nextWeek
            }
        });
        // Format status counts into an object
        const formattedStatusCounts = statusCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        // Format priority counts into an object
        const formattedPriorityCounts = priorityCounts.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        res.json({
            statusCounts: formattedStatusCounts,
            priorityCounts: formattedPriorityCounts,
            dueTodayCount,
            dueThisWeekCount,
            overdueCount
        });
    }
    catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get task by ID
// Users can access tasks they created or are assigned to
// Admins/Managers can access any task
router.get('/:id', async (req, res) => {
    var _a, _b;
    try {
        const taskId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }
        const task = await Task_1.Task.findById(taskId)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // Check if user has permission to view this task
        const user = req.user;
        const isCreator = ((_a = task.createdBy) === null || _a === void 0 ? void 0 : _a._id.toString()) === user._id.toString();
        const isAssignee = ((_b = task.assignedTo) === null || _b === void 0 ? void 0 : _b._id.toString()) === user._id.toString();
        const canViewAllTasks = user.role === 'admin' || user.role === 'manager';
        if (!isCreator && !isAssignee && !canViewAllTasks) {
            return res.status(403).json({ message: 'You do not have permission to view this task' });
        }
        res.json(task);
    }
    catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Update task
router.put('/:id', [
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Title cannot be empty'),
    (0, express_validator_1.body)('description')
        .optional()
        .notEmpty()
        .withMessage('Description cannot be empty'),
    (0, express_validator_1.body)('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Valid due date is required'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['todo', 'in-progress', 'completed'])
        .withMessage('Invalid status'),
    // Recurring task validation
    (0, express_validator_1.body)('isRecurring').optional().isBoolean(),
    (0, express_validator_1.body)('recurringType')
        .optional()
        .isIn(['daily', 'weekly', 'monthly', 'custom'])
        .withMessage('Recurring type must be daily, weekly, monthly, or custom'),
    (0, express_validator_1.body)('recurringInterval')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Recurring interval must be a positive integer'),
    (0, express_validator_1.body)('recurringDays')
        .optional()
        .isArray()
        .withMessage('Recurring days must be an array'),
    (0, express_validator_1.body)('recurringDays.*')
        .optional()
        .isInt({ min: 0, max: 6 })
        .withMessage('Recurring days must be between 0 and 6'),
    (0, express_validator_1.body)('recurringDate')
        .optional()
        .isInt({ min: 1, max: 31 })
        .withMessage('Recurring date must be between 1 and 31'),
    (0, express_validator_1.body)('recurringEndDate')
        .optional()
        .isISO8601()
        .withMessage('Valid recurring end date is required'),
], async (req, res) => {
    var _a, _b;
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        // Validate if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }
        const task = await Task_1.Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // RBAC: Check permissions based on role and ownership
        const user = req.user;
        const isTaskCreator = task.createdBy.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';
        const isManager = user.role === 'manager';
        // Admin & Manager can update any task
        // Regular user can update only their own tasks
        if (!isTaskCreator && !isAdmin && !isManager) {
            return res.status(403).json({
                message: 'You do not have permission to update this task',
            });
        }
        // Check if this is a child task of a recurring series
        if (task.parentTaskId && req.body.isRecurring) {
            return res.status(400).json({
                message: 'Cannot make a recurring task instance into a recurring task',
            });
        }
        // Save original values for notification logic
        const originalAssignee = task.assignedTo.toString();
        const originalStatus = task.status;
        const wasRecurring = task.isRecurring;
        const originalRecurringType = task.recurringType;
        // Update the task
        const updatedTask = await Task_1.Task.findByIdAndUpdate(id, { $set: req.body }, { new: true })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        // Create new recurring instance if task was completed
        const isNowCompleted = req.body.status === 'completed' && originalStatus !== 'completed';
        if (isNowCompleted && (updatedTask === null || updatedTask === void 0 ? void 0 : updatedTask.isRecurring)) {
            await (0, recurringTaskService_1.createRecurringTaskInstance)(updatedTask);
        }
        // Check if recurring settings changed and need to re-schedule
        const recurringChanged = wasRecurring !== req.body.isRecurring ||
            originalRecurringType !== req.body.recurringType;
        if (recurringChanged && (updatedTask === null || updatedTask === void 0 ? void 0 : updatedTask.isRecurring)) {
            // Re-create next instance with new settings
            await Task_1.Task.deleteMany({ parentTaskId: updatedTask._id });
            await (0, recurringTaskService_1.createRecurringTaskInstance)(updatedTask);
        }
        // Handle notifications
        // Check if assignee changed
        if (req.body.assignedTo && req.body.assignedTo !== originalAssignee) {
            // Notify new assignee
            await (0, index_1.createNotification)(req.body.assignedTo, `You have been assigned to task: ${task.title}`, 'task_assigned', task._id.toString());
        }
        // Check if status changed to 'completed'
        if (req.body.status === 'completed' && originalStatus !== 'completed') {
            // Notify task creator if they're not the one updating it
            if (task.createdBy.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
                await (0, index_1.createNotification)(task.createdBy.toString(), `Task completed: ${task.title}`, 'task_completed', task._id.toString());
            }
        }
        // If task was updated by someone other than assignee, notify assignee
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b._id.toString()) !== originalAssignee &&
            (req.body.assignedTo === undefined || req.body.assignedTo === originalAssignee)) {
            await (0, index_1.createNotification)(originalAssignee, `Task updated: ${task.title}`, 'task_updated', task._id.toString());
        }
        res.json({
            message: 'Task updated successfully',
            task: updatedTask,
        });
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete task
router.delete('/:id', async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // Validate if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid task ID format' });
        }
        const task = await Task_1.Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        // RBAC: Check permissions based on role and ownership
        const user = req.user;
        const isTaskCreator = task.createdBy.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';
        const isManager = user.role === 'manager';
        // Admin can delete any task
        // Manager can delete own tasks only
        // Regular user can delete own tasks only
        if (!isTaskCreator && !isAdmin) {
            return res.status(403).json({
                message: 'You do not have permission to delete this task',
            });
        }
        // Notify assignee if they're not the one deleting it
        if (task.assignedTo.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            await (0, index_1.createNotification)(task.assignedTo.toString(), `Task deleted: ${task.title}`, 'system', undefined);
        }
        await task.deleteOne();
        res.json({ message: 'Task deleted successfully' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
