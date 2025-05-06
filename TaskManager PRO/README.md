# TaskManager PRO

A comprehensive task management system with full Role-Based Access Control (RBAC).

## Features

- 🔐 User Authentication
  - Secure registration and login
  - JWT-based authentication
  - Role-based access control (Admin, Manager, User)

- 📋 Task Management
  - Create, read, update, and delete tasks
  - Assign tasks to team members
  - Set priorities and due dates
  - Track task status

- 👥 Team Collaboration
  - Real-time notifications
  - Task assignment and tracking
  - User roles and permissions

- 📊 Dashboard
  - Task statistics and metrics
  - Recent tasks overview
  - Task filtering and search

## Role-Based Access Control (RBAC)

TaskManager PRO implements a robust RBAC system with three distinct roles, each with different permission levels:

### Roles

1. **Admin**
   - Has full access to all features of the application
   - Can manage users (create, update, delete)
   - Can assign and modify user roles
   - Can view, create, update, and delete all tasks
   - Has access to all reports and analytics
   - Can configure system settings

2. **Manager**
   - Can view, create, update, and delete all tasks
   - Can assign tasks to any user
   - Can view all users but cannot modify roles
   - Has access to reports and analytics
   - Cannot access system settings

3. **User (Regular)**
   - Can view, create, update, and delete their own tasks
   - Can see tasks assigned to them
   - Cannot see other users' tasks
   - Limited access to basic reports
   - Cannot access user management or system settings

### Permissions

The RBAC system is built around granular permissions:

| Permission          | Admin | Manager | User |
|---------------------|-------|---------|------|
| tasks:create        | ✅    | ✅      | ✅   |
| tasks:read          | ✅    | ✅      | ✅   |
| tasks:update        | ✅    | ✅      | ✅   |
| tasks:delete        | ✅    | ✅      | ✅   |
| tasks:assign        | ✅    | ✅      | ✅   |
| tasks:read-all      | ✅    | ✅      | ❌   |
| tasks:update-all    | ✅    | ✅      | ❌   |
| tasks:delete-all    | ✅    | ✅      | ❌   |
| users:read          | ✅    | ✅      | ❌   |
| users:update        | ✅    | ❌      | ❌   |
| users:create        | ✅    | ❌      | ❌   |
| users:delete        | ✅    | ❌      | ❌   |
| users:manage-roles  | ✅    | ❌      | ❌   |
| reports:view        | ✅    | ✅      | ❌   |
| reports:export      | ✅    | ✅      | ❌   |
| system:settings     | ✅    | ❌      | ❌   |

### Implementation

The RBAC system is implemented using:

1. **Backend Middleware**:
   - `requirePermission`: Checks if a user has a specific permission
   - `requireAnyPermission`: Checks if a user has any of the given permissions
   - `requireAllPermissions`: Checks if a user has all of the given permissions
   - `isResourceOwnerOrHasPermission`: Checks if the user is the owner of a resource or has a specific permission

2. **Frontend Utilities**:
   - Permission checking helpers for conditional rendering
   - Role-based UI components
   - Protected routes

## Tech Stack

### Frontend
- Next.js 13 (App Router)
- TypeScript
- Chakra UI
- React Query
- Zustand (State Management)
- Socket.io Client

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Socket.io
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/taskmanager-pro.git
cd taskmanager-pro
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager-pro
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:3000
```

5. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
taskmanager-pro/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── store/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/:id/role` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Chakra UI](https://chakra-ui.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/) 