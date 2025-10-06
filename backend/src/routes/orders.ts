import express from 'express';
import { prisma, io } from '../index';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PaymentStatus } from '@prisma/client';
import { OrderStatus } from '@prisma/client';
import { UserRole} from '../types/user';
const router = express.Router();

// Get orders (with role-based filtering)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, limit, offset, date } = req.query;
    const user = req.user!;
    
    let where: any = {};
    
    // Students can only see their own orders
    if (user.role === UserRole.STUDENT) {
      where.userId = user.id;
    }
    
    // Filter by status if provided
    if (status) {
      where.status = status as OrderStatus;
    }
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.createdAt = {
        gte: startDate,
        lt: endDate
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentId: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                imageUrl: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
            transactionId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    let where: any = { id };
    
    // Students can only view their own orders
    if (user.role === UserRole.STUDENT) {
      where.userId = user.id;
    }

    const order = await prisma.order.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentId: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
                imageUrl: true,
                preparationTime: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
});

// Create new order
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { items, specialInstructions } = req.body;
    const user = req.user!;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError('Order items are required', 400);
    }

    // Validate all items exist and are available
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        status: 'AVAILABLE'
      }
    });

    if (menuItems.length !== menuItemIds.length) {
      throw createError('Some menu items are not available', 400);
    }

    // Check stock availability
    for (const item of items) {
      const menuItem = menuItems.find((mi: { id: any; }) => mi.id === item.menuItemId);
      if (!menuItem?.status || menuItem.status !== 'AVAILABLE') {
        throw createError(`${menuItem?.name || 'Item'} is currently unavailable`, 400);
      }

      if (!menuItem || (menuItem.stockQuantity ?? 0) < item.quantity) {
        throw createError(`Insufficient stock for ${menuItem?.name ?? 'Unknown item'}`, 400);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const menuItem = menuItems.find((mi: { id: any; }) => mi.id === item.menuItemId)!;
      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;
      
      return {
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions,
        menuItem: {
          connect: { id: item.menuItemId }
        }
      };
    });

    // Calculate estimated preparation time
    const maxPrepTime = Math.max(
      ...menuItems.map((item: { preparationTime: any; }) => item.preparationTime || 0)
    );
    const estimatedTime = new Date();
    estimatedTime.setMinutes(estimatedTime.getMinutes() + maxPrepTime);

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING,
          totalAmount,
          specialInstructions,
          estimatedReadyTime: estimatedTime,
          orderNumber: `ORD-${Date.now()}`,
          items: {
            create: orderItems
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true
            }
          },
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true
                }
              }
            }
          }
        }
      });

      // Update stock levels
      for (const item of items) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            },
            updatedAt: new Date()
          }
        });
      }

      return newOrder;
    });

    // Log order creation
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'ORDER_CREATED',
        userId: user.id,
        context: {
          orderId: order.id,
          itemCount: items.length,
          totalAmount: order.totalAmount
        }
      }
    });

    // Broadcast new order to kitchen and staff
    io.to('role:KITCHEN').to('role:STAFF').to('role:ADMIN').emit('new-order', {
      order: {
        ...order,
        items: order.items
      }
    });

    // Send order confirmation to customer
    io.to(`order:${order.id}`).emit('order-created', { order });

    res.status(201).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
});

// Update order status
router.patch('/:id/status',
  authenticateToken,
  requirePermission('update_order_status'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const user = req.user!;

      if (!Object.values(OrderStatus).includes(status)) {
        throw createError('Invalid order status', 400);
      }

      // Get current order
      const currentOrder = await prisma.order.findUnique({
        where: { id },
        include: { user: true }
      });

      if (!currentOrder) {
        throw createError('Order not found', 404);
      }

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: status as OrderStatus,
          updatedAt: new Date(),
          ...(status === OrderStatus.COMPLETED && {
            completedAt: new Date()
          })
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true
            }
          },
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      // Log status update
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'ORDER_STATUS_UPDATED',
          userId: user.id,
          context: {
            orderId: id,
            previousStatus: currentOrder.status,
            newStatus: status,
            notes
          }
        }
      });

      // Broadcast status update
      io.to(`order:${id}`).emit('order-status-updated', {
        orderId: id,
        status,
        order: updatedOrder
      });

      // Broadcast to staff/kitchen dashboard
      io.to('role:KITCHEN').to('role:STAFF').to('role:ADMIN').emit('order-updated', {
        orderId: id,
        status,
        order: updatedOrder
      });

      res.json({
        success: true,
        data: { order: updatedOrder }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Cancel order (students can cancel their own pending orders)
router.patch('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Check permissions
    if (user.role === UserRole.STUDENT && order.userId !== user.id) {
      throw createError('You can only cancel your own orders', 403);
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["PENDING", "CONFIRMED"];
    if (!cancellableStatuses.includes(order.status)) {
      throw createError('Order cannot be cancelled at this stage', 400);
    }

    // Cancel order and restore stock
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      // Restore stock levels
      for (const item of order.items) {
        await tx.menuItem.update({
          where: { id: item.menuItemId },
          data: {
            stockQuantity: {
              increment: item.quantity
            },
            updatedAt: new Date()
          }
        });
      }
    });

    // Log cancellation
    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        message: 'ORDER_CANCELLED',
        userId: user.id,
        context: { orderId: id, reason }
      }
    });

    // Broadcast cancellation
    io.to(`order:${id}`).emit('order-cancelled', { orderId: id, reason });
    io.to('role:KITCHEN').to('role:STAFF').to('role:ADMIN').emit('order-cancelled', {
      orderId: id,
      reason
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get order analytics (staff/admin only)
router.get('/analytics/summary',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          createdAt: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        };
      }

      const [
        totalOrders,
        completedOrders,
        cancelledOrders,
        pendingOrders,
        totalRevenue,
        avgOrderValue
      ] = await Promise.all([
        prisma.order.count({ where: dateFilter }),
        prisma.order.count({ where: { status: OrderStatus.COMPLETED, ...dateFilter } }),
        prisma.order.count({ where: { status: OrderStatus.CANCELLED, ...dateFilter } }),
        prisma.order.count({ where: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] } } }),
        prisma.order.aggregate({
          where: { status: OrderStatus.COMPLETED, ...dateFilter },
          _sum: { totalAmount: true }
        }),
        prisma.order.aggregate({
          where: { status: OrderStatus.COMPLETED, ...dateFilter },
          _avg: { totalAmount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          pendingOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          avgOrderValue: avgOrderValue._avg.totalAmount || 0,
          completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

// TODO: Implement order scheduling for future pickup/delivery
// TODO: Add order modification functionality (before preparation)
// TODO: Implement order priority system (VIP customers, rush orders)
// TODO: Add order batch processing for kitchen efficiency
// TODO: Implement customer feedback and rating system