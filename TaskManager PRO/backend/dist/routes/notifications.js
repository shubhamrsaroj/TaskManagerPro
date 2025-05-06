"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Notification_1 = require("../models/Notification");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
// Get user's notifications
router.get('/', async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const notifications = await Notification_1.Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Mark notification as read
router.put('/:id/read', async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // Validate if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid notification ID format' });
        }
        const notification = await Notification_1.Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        // Ensure user owns this notification
        if (notification.user.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to update this notification' });
        }
        notification.read = true;
        await notification.save();
        res.json({ message: 'Notification marked as read', notification });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Mark all notifications as read
router.put('/read-all', async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        await Notification_1.Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Get unread notification count
router.get('/unread-count', async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a._id)) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const count = await Notification_1.Notification.countDocuments({
            user: req.user._id,
            read: false,
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Get unread notification count error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// Delete a notification
router.delete('/:id', async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        // Validate if id is a valid ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid notification ID format' });
        }
        const notification = await Notification_1.Notification.findById(id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        // Ensure user owns this notification
        if (notification.user.toString() !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to delete this notification' });
        }
        await notification.deleteOne();
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
