# TaskManager PRO

A comprehensive task management application with robust user authentication, real-time notifications, and role-based access control.

## Features

- **Authentication System**: Secure login and registration with session management
- **Task Management**: Create, read, update, and delete tasks
- **Role-Based Access Control**: Admin, Manager, and User roles with different permissions
- **Real-time Notifications**: Socket.io based notification system
- **Dashboard**: Visual overview of tasks and statistics
- **User Management**: Admin interface for managing users
- **Reports & Analytics**: Task completion statistics and charts
- **Dark Mode UI**: Modern, accessible dark-themed interface

## Tech Stack

### Frontend
- Next.js (React)
- Chakra UI
- React Query
- Socket.io Client
- TypeScript

### Backend
- Node.js
- Express
- MongoDB
- Socket.io
- JWT Authentication

## Project Structure

```
TaskManager PRO/
├── frontend/             # Next.js frontend application
├── backend/              # Node.js API server
```

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB

### Installation

1. Clone the repository
```
git clone https://github.com/shubhamrsaroj/TaskManagerPro.git
```

2. Install Backend Dependencies
```
cd TaskManager\ PRO/backend
npm install
```

3. Install Frontend Dependencies
```
cd ../frontend
npm install
```

4. Set up environment variables
   - Create a `.env` file in the backend directory

5. Start the backend server
```
cd ../backend
npm start
```

6. Start the frontend development server
```
cd ../frontend
npm run dev
```

## License

MIT 