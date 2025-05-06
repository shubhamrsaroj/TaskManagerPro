"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.hasPermission = exports.rolePermissions = void 0;
// Define role permissions
exports.rolePermissions = {
    // Admin has all permissions
    admin: [
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:delete',
        'tasks:assign',
        'tasks:read-all',
        'tasks:update-all',
        'tasks:delete-all',
        'users:read',
        'users:update',
        'users:create',
        'users:delete',
        'users:manage-roles',
        'reports:view',
        'reports:export',
        'system:settings'
    ],
    // Manager has most permissions except user management and system settings
    manager: [
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:delete',
        'tasks:assign',
        'tasks:read-all',
        'tasks:update-all',
        'tasks:delete-all',
        'users:read',
        'reports:view',
        'reports:export'
    ],
    // Regular user has basic permissions
    user: [
        'tasks:create',
        'tasks:read',
        'tasks:update',
        'tasks:delete',
        'tasks:assign'
    ]
};
// Check if user has permission
const hasPermission = (user, permission) => {
    if (!user || !user.role)
        return false;
    const permissions = exports.rolePermissions[user.role];
    return (permissions === null || permissions === void 0 ? void 0 : permissions.includes(permission)) || false;
};
exports.hasPermission = hasPermission;
// Middleware to check for specific permissions
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!(0, exports.hasPermission)(req.user, permission)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
// Middleware to check for multiple permissions (ANY of them)
const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const hasAnyPermission = permissions.some(permission => (0, exports.hasPermission)(req.user, permission));
        if (!hasAnyPermission) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
exports.requireAnyPermission = requireAnyPermission;
// Middleware to check for multiple permissions (ALL of them)
const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const hasAllPermissions = permissions.every(permission => (0, exports.hasPermission)(req.user, permission));
        if (!hasAllPermissions) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
exports.requireAllPermissions = requireAllPermissions;
