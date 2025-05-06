"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isResourceOwnerOrHasPermission = exports.checkPermission = exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const rbac_1 = require("./rbac");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};
exports.authenticateToken = authenticateToken;
// Legacy authorization middleware - keeping this for backward compatibility
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action',
            });
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
// Permission-based authorization
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!(0, rbac_1.hasPermission)(req.user, permission)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action',
            });
        }
        next();
    };
};
exports.checkPermission = checkPermission;
// Check owner or admin/manager
const isResourceOwnerOrHasPermission = (getResourceOwnerId, permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const resourceOwnerId = getResourceOwnerId(req);
        // If user is the resource owner, allow access
        if (resourceOwnerId && resourceOwnerId === req.user._id.toString()) {
            return next();
        }
        // Otherwise, check if user has the required permission
        if ((0, rbac_1.hasPermission)(req.user, permission)) {
            return next();
        }
        return res.status(403).json({
            message: 'You do not have permission to perform this action',
        });
    };
};
exports.isResourceOwnerOrHasPermission = isResourceOwnerOrHasPermission;
