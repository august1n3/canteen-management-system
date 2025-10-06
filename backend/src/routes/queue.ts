import express from 'express';
import { prisma, io } from '../index';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { OrderStatus, UserRole } from '@prisma/client';


const router = express.Router();

// Get current queue status (public endpoint for display screens)
router.get('/status', async (req, res, next) => {
  try {
    const { limit } = req.query;

    // Get active orders in queue (confirmed, preparing, ready)
    const queueOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "READY"]
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                preparationTime: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // CONFIRMED first, then PREPARING, then READY
        { createdAt: 'asc' } // Older orders first within same status
      ],
      take: limit ? parseInt(limit as string) : 50
    });

    // Calculate queue statistics
    const queueStats = {
      totalOrders: queueOrders.length,
      confirmedOrders: queueOrders.filter((o) => o.status === "CONFIRMED").length,
      preparingOrders: queueOrders.filter((o) => o.status === "PREPARING").length,
      readyOrders: queueOrders.filter((o) => o.status === "READY").length,
      avgWaitTime: calculateAverageWaitTime(queueOrders),
      estimatedWaitTime: calculateEstimatedWaitTime(queueOrders)
    };

    // Format orders for queue display

    const formattedQueue = queueOrders.map((order, index: number) => ({
      id: order.id,
      queuePosition: index + 1,
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      studentId: order.user.studentId,
      status: order.status,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        category: item.menuItem.category
      })),
      orderTime: order.createdAt,
      estimatedCompletionTime: (order as any).estimatedCompletionTime ?? null,
      totalAmount: (order as any).totalAmount ?? null,
      waitTime: Math.floor((new Date().getTime() - order.createdAt.getTime()) / (1000 * 60)) // in minutes
    }));

    res.json({
      success: true,
      data: {
        queue: formattedQueue,
        statistics: queueStats,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get queue position for specific order
router.get('/position/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        estimatedReadyTime: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true
          }
        }
      }
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    if (![
      "CONFIRMED",
      "PREPARING",
      "READY"
    ].includes(order.status)) {
      return res.json({
        success: true,
        data: {
          inQueue: false,
          status: order.status,
          message: `Order is ${order.status.toLowerCase()}`
        }
      });
    }

    // Calculate position in queue
    const ordersAhead = await prisma.order.count({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "READY"]
        },
        OR: [
          // Orders with higher priority status (lower index in statusPriority array)
          { 
            status: {
              in: getStatusesAhead(order.status)
            }
          },
          { 
            status: order.status,
            createdAt: { lt: order.createdAt } // Orders with same status but created earlier
          }
        ]
      }
    });

    const estimatedWaitMinutes = Math.max(0, Math.floor(
      (order.estimatedReadyTime?.getTime() || 0 - new Date().getTime()) / (1000 * 60)
    ));

    res.json({
      success: true,
      data: {
        inQueue: true,
        position: ordersAhead + 1,
        status: order.status,
        customerName: order.user.firstName + ' ' + order.user.lastName,
        studentId: order.user.studentId,
        estimatedWaitTime: estimatedWaitMinutes,
        estimatedCompletionTime: order.estimatedReadyTime
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update order priority (staff/admin only)
router.patch('/priority/:orderId',
  authenticateToken,
  requirePermission('manage_queue'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { orderId } = req.params;
      const { priority, reason } = req.body;
      const user = req.user!;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true
            }
          }
        }
      });

      if (!order) {
        throw createError('Order not found', 404);
      }

      if (!["CONFIRMED", "PREPARING"].includes(order.status)) {
        throw createError('Order priority can only be changed for confirmed or preparing orders', 400);
      }

      // Update order priority (this could be implemented as a separate field)
      // For now, we'll log it and use it for future queue management
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'ORDER_PRIORITY_UPDATED',
          userId: user.id,
          context: {
            orderId: order.id,
            customerName: order.user.firstName + ' ' + order.user.lastName,
            priority: priority,
            reason: reason,
            previousStatus: order.status
          }
        }
      });

      // Broadcast priority update
      io.emit('queue-priority-updated', {
        orderId: order.id,
        priority,
        reason,
        updatedBy: user.name
      });

      res.json({
        success: true,
        message: 'Order priority updated successfully',
        data: {
          orderId: order.id,
          priority,
          reason
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get queue analytics (staff/admin only)
router.get('/analytics',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { date } = req.query;
      
      let dateFilter = {};
      if (date) {
        const startDate = new Date(date as string);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        dateFilter = {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        };
      } else {
        // Default to today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        dateFilter = {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        };
      }

      const [
        totalOrdersToday,
        completedOrdersToday,
        currentQueueLength,
        avgProcessingTime,
        peakHours
      ] = await Promise.all([
        prisma.order.count({ where: dateFilter }),
        prisma.order.count({ 
          where: { 
            status: OrderStatus.COMPLETED,
            ...(dateFilter && (dateFilter as any).createdAt ? { createdAt: (dateFilter as any).createdAt } : {})
          }
        }),
        prisma.order.count({
          where: {
            status: {
              in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]
            }
          }
        }),
        prisma.order.count({
          where: {
            ...(dateFilter && (dateFilter as any).createdAt ? { actualReadyTime: (dateFilter as any).createdAt } : {})
          }
        }),
        prisma.order.count({
          where: {
            status: {
              in: [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]
            }
          }
        }),
        calculateAverageProcessingTime(dateFilter),
        getPeakHours(dateFilter)
      ]);

      res.json({
        success: true,
        data: {
          totalOrdersToday,
          completedOrdersToday,
          currentQueueLength,
          avgProcessingTime,
          peakHours,
          efficiency: totalOrdersToday > 0 ? (completedOrdersToday / totalOrdersToday) * 100 : 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Clear completed orders from queue (staff only)
router.post('/cleanup',
  authenticateToken,
  requirePermission('manage_queue'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;

      // Get completed orders that are still showing as ready
      const completedOrders = await prisma.order.findMany({
        where: {
          status: "READY",
          actualReadyTime: {
            lt: new Date(Date.now() - 30 * 60 * 1000) // Ready for more than 30 minutes
          }
        }
      });

      if (completedOrders.length === 0) {
        return res.json({
          success: true,
          message: 'No orders to cleanup',
          data: { cleanedOrders: 0 }
        });
      }

      // Update orders to completed
      await prisma.order.updateMany({
        where: {
          id: { in: completedOrders.map((o: { id: any; }) => o.id) }
        },
        data: {
          status: "COMPLETED",
          updatedAt: new Date()
        }
      });

      // Log cleanup action
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'ORDER_UPDATED',
          userId: req.user!.id,
          context: { 
            orderIds: completedOrders.map(o => o.id), 
            queuePositions: completedOrders.map(o => o.queuePosition),
            type: 'QUEUE_UPDATE'
          }
        }
      });

      // Broadcast queue update
      io.emit('queue-updated', {
        action: 'cleanup',
        cleanedOrders: completedOrders.length
      });

      res.json({
        success: true,
        message: `Successfully cleaned ${completedOrders.length} completed orders from queue`,
        data: { cleanedOrders: completedOrders.length }
      });
    } catch (error){

    }
  });




// Helper functions

function getStatusesAhead(currentStatus: OrderStatus): OrderStatus[] {
  // Define status priority order
  const statusPriority = ["CONFIRMED", "PREPARING", "READY"];
  const currentIndex = statusPriority.indexOf(currentStatus);
  if (currentIndex === -1) return [];
  return statusPriority.slice(0, currentIndex) as OrderStatus[];
}



// Helper functions
function calculateAverageWaitTime(orders: any[]): number {
  if (orders.length === 0) return 0;
  
  const now = new Date();
  const totalWaitTime = orders.reduce((total, order) => {
    return total + (now.getTime() - order.createdAt.getTime());
  }, 0);
  
  return Math.floor(totalWaitTime / orders.length / (1000 * 60)); // in minutes
}

function calculateEstimatedWaitTime(orders: any[]): number {
  // Simple estimation: average 5 minutes per order ahead in queue
  const confirmedCount = orders.filter(o => o.status === OrderStatus.CONFIRMED).length;
  const preparingCount = orders.filter(o => o.status === OrderStatus.PREPARING).length;
  
  return (confirmedCount * 5) + (preparingCount * 2); // Preparing orders take less time to complete
}

async function calculateAverageProcessingTime(dateFilter: any): Promise<number> {
  const completedOrders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      ...(dateFilter.createdAt ? { completedAt: dateFilter.createdAt, createdAt: dateFilter.createdAt } : {})
    },
    select: {
      createdAt: true,
      actualReadyTime: true
    }
  });

  if (completedOrders.length === 0) return 0;

  const totalProcessingTime = completedOrders.reduce((total , order, createdAt) => {
    if (order.actualReadyTime) {
      return total + (order.actualReadyTime.getTime() - order.createdAt.getTime());
    }
    return total;
  }, 0);

  return Math.floor(totalProcessingTime / completedOrders.length / (1000 * 60)); // in minutes
}

async function getPeakHours(dateFilter: any): Promise<any[]> {
  const orders = await prisma.order.findMany({
    where: dateFilter,
    select: {
      createdAt: true
    }
  });

  // Group by hour
  const hourlyCount: { [hour: number]: number } = {};
  
  orders.forEach((order: { createdAt: { getHours: () => any; }; }) => {
    const hour = order.createdAt.getHours();
    hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
  });

  // Convert to array and sort by count
  return Object.entries(hourlyCount)
    .map(([hour, count]) => ({
      hour: parseInt(hour),
      orderCount: count
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 3); // Top 3 peak hours
}

export default router;

// TODO: Implement smart queue optimization algorithms
// TODO: Add queue time predictions based on historical data
// TODO: Implement customer notification system for queue updates
// TODO: Add queue capacity management and overflow handling
// TODO: Implement queue analytics dashboard with real-time metrics