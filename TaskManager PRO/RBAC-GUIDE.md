# Role-Based Access Control (RBAC) Guide for TaskManager PRO

This guide explains how to use and manage the role-based access control system in TaskManager PRO.

## Roles Overview

TaskManager PRO has three distinct user roles:

### 1. Administrator (Admin)
- Full system access
- Can manage all users, tasks, and settings
- Can create, view, update, and delete any data in the system

### 2. Manager
- Can manage tasks for the entire team
- Can view all users but cannot modify user roles
- Limited access to system settings

### 3. Employee (User)
- Can manage only their own tasks
- Limited access to team data
- No access to user management or system settings

## Permissions Matrix

| Action                  | Admin | Manager | Employee |
|-------------------------|-------|---------|----------|
| **Task Management**     |       |         |          |
| Create Task             | ✅    | ✅      | ✅       |
| View All Tasks          | ✅    | ✅      | ❌       |
| View Own Tasks          | ✅    | ✅      | ✅       |
| Update Any Task         | ✅    | ✅      | ❌       |
| Update Own Task         | ✅    | ✅      | ✅       |
| Delete Any Task         | ✅    | ❌      | ❌       |
| Delete Own Task         | ✅    | ✅      | ✅       |
| **User Management**     |       |         |          |
| View All Users          | ✅    | ✅      | ❌       |
| Create New Users        | ✅    | ❌      | ❌       |
| Update User Profiles    | ✅    | ❌      | ❌       |
| Delete Users            | ✅    | ❌      | ❌       |
| Manage User Roles       | ✅    | ❌      | ❌       |
| **Reports & Analytics** |       |         |          |
| View Reports            | ✅    | ✅      | ❌       |
| Export Reports          | ✅    | ✅      | ❌       |
| **System Settings**     |       |         |          |
| Configure System        | ✅    | ❌      | ❌       |

## User Registration and Role Assignment

### How to Register with a Specific Role:

1. Navigate to the registration page `/auth/register`
2. Fill in your personal information (name, email, password)
3. Select your role from the dropdown menu:
   - Administrator
   - Manager
   - Employee

### Role Restrictions:

In a production environment, you might want to restrict who can register as an admin or manager. Consider:
- Requiring approval for admin/manager registrations
- Using invitation links with pre-defined roles
- Having a super admin manually assign higher-level roles

## Managing User Roles

As an administrator, you can manage user roles:

1. Navigate to User Management in the dashboard
2. Find the user you want to modify
3. Use the "Change Role" option to update their role
4. The changes take effect immediately

## RBAC Implementation Details

### Backend Implementation

The RBAC system uses several key components:

1. **Permission Definitions**: Defined in `middleware/rbac.ts`
2. **Role Mappings**: Each role has a set of assigned permissions
3. **Middleware Functions**:
   - `requirePermission(permission)`: Checks if user has specific permission
   - `requireAnyPermission([permissions])`: Checks if user has any of the permissions
   - `requireAllPermissions([permissions])`: Checks if user has all permissions
   - `isResourceOwnerOrHasPermission(fn, permission)`: Checks if user is resource owner or has permission

### Frontend Implementation

The frontend implements permission checking with:

1. **Permission Helpers**: Functions in `lib/permissions.ts`
   - `hasPermission(permission)`: Check if current user has permission
   - `isAdmin()`, `isManager()`, `isUser()`: Role helper functions
   - `checkPermission(permission, fn1, fn2)`: Conditional rendering based on permissions

2. **Conditional UI Rendering**: Elements are shown/hidden based on permissions

## Example Usage

### Backend Example:

```typescript
// Route that any authenticated user can access
router.get('/tasks/mine', authenticateToken, async (req, res) => {
  // Get user's tasks
});

// Route that requires specific permission
router.get('/users', checkPermission('users:read'), async (req, res) => {
  // Only users with 'users:read' permission can see all users
});

// Route with owner-based access control
router.put('/tasks/:id', isResourceOwnerOrHasPermission(
  req => req.params.id, // Get task ID
  'tasks:update-all'    // Permission needed if not owner
), async (req, res) => {
  // User can update if they own the task OR have 'tasks:update-all' permission
});
```

### Frontend Example:

```tsx
// Conditional rendering based on permission
{hasPermission('users:read') && (
  <UsersList />
)}

// Using the checkPermission helper
{checkPermission(
  'reports:view',
  () => <ReportsPanel />,
  () => <p>You don't have access to reports</p>
)}

// Simple role checks
{isAdmin() && <AdminOnlyFeature />}
{isManager() && <ManagerFeature />}
```

## Best Practices

1. **Always Apply Backend Checks**: Even if you hide UI elements, always verify permissions on the server
2. **Use Specific Permissions**: Create granular permissions instead of broad ones
3. **Provide Helpful Messages**: When access is denied, explain why instead of just hiding elements
4. **Check Path Permissions**: Verify users can't access restricted routes by directly entering URLs
5. **Review Role Assignments**: Regularly audit who has administrator and manager roles

## Troubleshooting

**Problem**: User can't access a feature they should have permission for
**Solution**: 
- Check the user's role in their profile
- Verify the permission mappings in `middleware/rbac.ts`
- Ensure the route is using the correct permission check

**Problem**: Users can see UI elements but get "Unauthorized" errors
**Solution**: Ensure your frontend and backend permission checks are aligned

## Additional Resources

- [RBAC Best Practices](https://owasp.org/www-project-proactive-controls/v3/en/c7-enforce-access-controls)
- [JWT Authentication Guide](https://jwt.io/introduction)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html) 