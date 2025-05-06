// Define permission types - this should match the backend
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
const rolePermissions: Record<string, Permission[]> = {
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

// Get user role from localStorage
export const getUserRole = (): string | null => {
  try {
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const { state } = JSON.parse(authData);
      if (state?.user?.role) {
        return state.user.role;
      }
    }
    return null;
  } catch (err) {
    console.error('Error getting user role:', err);
    return null;
  }
};

// Check if user has permission
export const hasPermission = (permission: Permission): boolean => {
  const role = getUserRole();
  
  if (!role) return false;
  
  const permissions = rolePermissions[role];
  return permissions?.includes(permission) || false;
};

// Check if user has any of the permissions
export const hasAnyPermission = (permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(permission));
};

// Check if user has all of the permissions
export const hasAllPermissions = (permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(permission));
};

// Function for conditional rendering based on permissions
export const checkPermission = (
  permission: Permission | Permission[],
  hasPermissionFn: () => React.ReactNode,
  noPermissionFn?: () => React.ReactNode
): React.ReactNode => {
  // Check for single permission
  if (typeof permission === 'string') {
    return hasPermission(permission) ? hasPermissionFn() : (noPermissionFn ? noPermissionFn() : null);
  }
  
  // Check for multiple permissions (any of them)
  return hasAnyPermission(permission) ? hasPermissionFn() : (noPermissionFn ? noPermissionFn() : null);
};

// Export role checking helpers
export const isAdmin = (): boolean => getUserRole() === 'admin';
export const isManager = (): boolean => getUserRole() === 'manager';
export const isUser = (): boolean => getUserRole() === 'user'; 