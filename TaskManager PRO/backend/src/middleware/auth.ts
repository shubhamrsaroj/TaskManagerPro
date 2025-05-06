import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { hasPermission, Permission } from './rbac';

// Extended Request interface with user property
export interface AuthRequest extends Request {
  user?: IUser;
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as JWTPayload;

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Legacy authorization middleware - keeping this for backward compatibility
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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

// Permission-based authorization
export const checkPermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
    }

    next();
  };
};

// Check owner or admin/manager
export const isResourceOwnerOrHasPermission = (
  getResourceOwnerId: (req: AuthRequest) => string | undefined,
  permission: Permission
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const resourceOwnerId = getResourceOwnerId(req);
    
    // If user is the resource owner, allow access
    if (resourceOwnerId && resourceOwnerId === req.user._id.toString()) {
      return next();
    }
    
    // Otherwise, check if user has the required permission
    if (hasPermission(req.user, permission)) {
      return next();
    }
    
    return res.status(403).json({
      message: 'You do not have permission to perform this action',
    });
  };
}; 