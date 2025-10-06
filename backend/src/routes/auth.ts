import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { createError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        password: true,
        role: true,
        status: true,
        studentId: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw createError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.role 
      },
      process.env.JWT_SECRET ?? '',
      { expiresIn: '8h' }
    );

    // Create system log
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        level: 'INFO',
        message: 'User logged in',
        context: {
          email: user.email,
          timestamp: new Date().toISOString(),
          ip: req.ip
        }
      }
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          studentId: user.studentId
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Logout endpoint (mainly for logging purposes)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Log logout event
    if (req.user) {
      await prisma.systemLog.create({
        data: {
          userId: req.user.id,
          level: 'INFO',
          message: 'User logged out',
          context: { 
            email: req.user.email,
            timestamp: new Date().toISOString(),
            ip: req.ip
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        studentId: true,
        createdAt: true
      }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Register student (for demo purposes - in production this might be admin-only)
router.post('/register/student', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, studentId } = req.body;

    if (!email || !password || !firstName || !lastName || !studentId) {
      throw createError('All fields are required', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { studentId }
        ]
      }
    });

    if (existingUser) {
      throw createError('User with this email or student ID already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        studentId,
        role: 'STUDENT',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentId: true
      }
    });

    // Log registration event
    await prisma.systemLog.create({
      data: {
        userId: user.id,
        level: 'INFO',
        message: 'User registered',
        context: { 
          email: user.email, 
          role: user.role,
          timestamp: new Date().toISOString(),
          ip: req.ip
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

export default router;



// TODO: Implement password reset with email verification
// TODO: Add rate limiting for login attempts
// TODO: Implement account lockout after failed attempts
// TODO: Add social authentication (Google, Facebook)
// TODO: Implement email verification for new registrations