import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { createError } from './errorHandler';
import { UserRole } from '../types/user';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Fetch user from database to ensure they still exist and get current role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    if (!user || !user.status || user.status !== 'ACTIVE') {
      throw createError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      name: `${user.firstName} ${user.lastName}`
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    const rolePermissions = {
      [UserRole.ADMIN]: [
        'manage_users', 'manage_menu', 'manage_orders', 'view_reports',
        'manage_inventory', 'manage_queue', 'manage_payments'
      ],
      [UserRole.CANTEEN_STAFF]: [
        'manage_orders', 'view_queue', 'process_payments', 'update_order_status'
      ],
      [UserRole.KITCHEN]: [
        'view_orders', 'update_order_status', 'view_queue'
      ],
      [UserRole.STUDENT]: [
        'place_order', 'view_own_orders', 'track_order'
      ]
    };

    const userPermissions = rolePermissions[req.user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

// TODO: Implement refresh token mechanism
// TODO: Add session management and user activity tracking
// TODO: Implement password reset functionality
// TODO: Add multi-factor authentication support