import { IUser } from '../models/User';

// Define permission types
export type Permission = 
  // Task permissions
  | 'tasks:create'
  | 'tasks:read'
  | 'tasks:update'
  | 'tasks:delete'
  | 'tasks:assign'
  | 'tasks:read-all'    // View all tasks regardless of owner
  | 'tasks:update-all'  // Update any task regardless of owner
  | 'tasks:delete-all'  // Delete any task regardless of owner
  
  // User permissions
  | 'users:read'       // View user details
  | 'users:update'     // Update user details
  | 'users:create'     // Create new users
  | 'users:delete'     // Delete users
  | 'users:manage-roles' // Change user roles
  
  // Reporting permissions
  | 'reports:view'     // View reports and analytics
  | 'reports:export'   // Export reports
  
  // System permissions
  | 'system:settings'  // Manage system settings

// Define role permissions
export const rolePermissions: Record<string, Permission[]> = {
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
export const hasPermission = (user: IUser, permission: Permission): boolean => {
  if (!user || !user.role) return false;
  
  const permissions = rolePermissions[user.role];
  return permissions?.includes(permission) || false;
};

// Middleware to check for specific permissions
export const requirePermission = (permission: Permission) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Middleware to check for multiple permissions (ANY of them)
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.user, permission)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

// Middleware to check for multiple permissions (ALL of them)
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const hasAllPermissions = permissions.every(permission => 
      hasPermission(req.user, permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}; 