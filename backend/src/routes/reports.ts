import express from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PaymentStatus, OrderStatus } from '@prisma/client';

const router = express.Router();

// Get daily sales report
router.get('/sales/daily',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { date } = req.query;
      
      let reportDate = new Date();
      if (date) {
        reportDate = new Date(date as string);
      }
      
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [
        dailySales,
        ordersByStatus,
        topItems,
        hourlyBreakdown,
        paymentMethods
      ] = await Promise.all([
        getDailySalesMetrics(startOfDay, endOfDay),
        getOrdersByStatus(startOfDay, endOfDay),
        getTopSellingItems(startOfDay, endOfDay),
        getHourlyOrderBreakdown(startOfDay, endOfDay),
        getPaymentMethodBreakdown(startOfDay, endOfDay)
      ]);

      res.json({
        success: true,
        data: {
          reportDate: reportDate.toISOString().split('T')[0],
          summary: dailySales,
          orderBreakdown: ordersByStatus,
          topSellingItems: topItems,
          hourlyBreakdown,
          paymentMethods
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get monthly sales report
router.get('/sales/monthly',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { month, year } = req.query;
      
      const currentDate = new Date();
      const reportMonth = month ? parseInt(month as string) - 1 : currentDate.getMonth();
      const reportYear = year ? parseInt(year as string) : currentDate.getFullYear();
      
      const startOfMonth = new Date(reportYear, reportMonth, 1);
      const endOfMonth = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);

      const [
        monthlySales,
        dailyTrends,
        categoryPerformance,
        customerMetrics
      ] = await Promise.all([
        getMonthlySalesMetrics(startOfMonth, endOfMonth),
        getDailyTrends(startOfMonth, endOfMonth),
        getCategoryPerformance(startOfMonth, endOfMonth),
        getCustomerMetrics(startOfMonth, endOfMonth)
      ]);

      res.json({
        success: true,
        data: {
          reportPeriod: {
            month: reportMonth + 1,
            year: reportYear,
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
          },
          summary: monthlySales,
          dailyTrends,
          categoryPerformance,
          customerMetrics
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get inventory report
router.get('/inventory',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [
        lowStockItems,
        inventoryValue,
        categoryStockLevel,
        recentStockUpdates
      ] = await Promise.all([
        getLowStockItems(),
        getInventoryValue(),
        getCategoryStockLevels(),
        getRecentStockUpdates()
      ]);

      res.json({
        success: true,
        data: {
          lowStockItems,
          totalInventoryValue: inventoryValue,
          categoryStockLevels: categoryStockLevel,
          recentUpdates: recentStockUpdates
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get customer insights report
router.get('/customers',
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
        topCustomers,
        customerAcquisition,
        orderFrequency,
        avgOrderValues
      ] = await Promise.all([
        getTopCustomers(dateFilter),
        getCustomerAcquisition(dateFilter),
        getCustomerOrderFrequency(dateFilter),
        getCustomerAvgOrderValues(dateFilter)
      ]);

      res.json({
        success: true,
        data: {
          topCustomers,
          customerAcquisition,
          orderFrequency,
          avgOrderValues
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate custom report
router.post('/custom',
  authenticateToken,
  requirePermission('view_reports'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const {
        startDate,
        endDate,
        metrics,
        groupBy,
        filters
      } = req.body;

      if (!startDate || !endDate) {
        throw createError('Start date and end date are required', 400);
      }

      const dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      const reportData: any = {};

      // Build custom report based on requested metrics
      if (metrics.includes('sales')) {
        reportData.salesMetrics = await getDailySalesMetrics(
          new Date(startDate),
          new Date(endDate)
        );
      }

      if (metrics.includes('orders')) {
        reportData.orderMetrics = await getOrdersByStatus(
          new Date(startDate),
          new Date(endDate)
        );
      }

      if (metrics.includes('items')) {
        reportData.itemMetrics = await getTopSellingItems(
          new Date(startDate),
          new Date(endDate),
          filters?.limit || 10
        );
      }

      if (metrics.includes('customers')) {
        reportData.customerMetrics = await getTopCustomers(
          dateFilter,
          filters?.customerLimit || 10
        );
      }

      res.json({
        success: true,
        data: {
          reportPeriod: { startDate, endDate },
          metrics: reportData
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions for report calculations
async function getDailySalesMetrics(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.COMPLETED,
      actualReadyTime: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const totalRevenue = orders.reduce((sum: any, order: { totalAmount: any; }) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue
  };
}

async function getOrdersByStatus(startDate: Date, endDate: Date) {
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      status: true
    }
  });

  return statusCounts.map((item: { status: any; _count: { status: any; }; }) => ({
    status: item.status,
    count: item._count.status
  }));
}

async function getTopSellingItems(startDate: Date, endDate: Date, limit: number = 10) {
  const topItems = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: {
        status: OrderStatus.COMPLETED,
        actualReadyTime: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    _sum: {
      quantity: true,
      price: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  });

  // Get menu item details
  const menuItemIds = topItems.map((item: { menuItemId: any; }) => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds }
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true
    }
  });

  return topItems.map((item, _count ) => {
    const menuItem = menuItems.find((mi: { id: any; }) => mi.id === item.menuItemId);
    return {
      ...menuItem,
      totalQuantitySold: item._sum.quantity || 0,
      totalRevenue: item._sum.price || 0,
      orderCount: item._count.id
    };
  });
}

async function getHourlyOrderBreakdown(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      createdAt: true,
      totalAmount: true
    }
  });

  const hourlyData: { [hour: number]: { count: number; revenue: number } } = {};

  orders.forEach((order: { createdAt: { getHours: () => any; }; totalAmount: number; }) => {
    const hour = order.createdAt.getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { count: 0, revenue: 0 };
    }
    hourlyData[hour].count++;
    hourlyData[hour].revenue += order.totalAmount;
  });

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    orderCount: data.count,
    revenue: data.revenue
  }));
}

async function getPaymentMethodBreakdown(startDate: Date, endDate: Date) {
  const paymentBreakdown = await prisma.payment.groupBy({
    by: ['method'],
    where: {
      status: PaymentStatus.COMPLETED,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  });

  return paymentBreakdown.map((item: { method: any; _sum: { amount: any; }; _count: { id: any; }; }) => ({
    method: item.method,
    totalAmount: item._sum.amount || 0,
    transactionCount: item._count.id
  }));
}

async function getMonthlySalesMetrics(startDate: Date, endDate: Date) {
  return getDailySalesMetrics(startDate, endDate);
}

async function getDailyTrends(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.COMPLETED,
      actualReadyTime: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      actualReadyTime: true,
      totalAmount: true
    }
  });

  const dailyData: { [date: string]: { count: number; revenue: number } } = {};

  orders.forEach((order) => {
    if (order.actualReadyTime) {
      const dateStr = order.actualReadyTime.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { count: 0, revenue: 0 };
      }
      dailyData[dateStr].count++;
      dailyData[dateStr].revenue += order.totalAmount;
    }
  });

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    orderCount: data.count,
    revenue: data.revenue
  }));
}

async function getCategoryPerformance(startDate: Date, endDate: Date) {
  const categoryData = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: {
        status: OrderStatus.COMPLETED,
        actualReadyTime: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    _sum: {
      quantity: true,
      price: true
    }
  });

  // This would need to be enhanced to properly group by category
  return categoryData;
}

async function getCustomerMetrics(startDate: Date, endDate: Date) {
  const customerStats = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      status: OrderStatus.COMPLETED,
      actualReadyTime: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: {
      id: true
    },
    _sum: {
      totalAmount: true
    }
  });

  return {
    totalCustomers: customerStats.length,
    avgOrdersPerCustomer: customerStats.length > 0 ? 
      customerStats.reduce((sum: any, c: { _count: { id: any; }; }) => sum + c._count.id, 0) / customerStats.length : 0,
    avgSpendPerCustomer: customerStats.length > 0 ? 
      customerStats.reduce((sum: any, c: { _sum: { totalAmount: any; }; }) => sum + (c._sum.totalAmount || 0), 0) / customerStats.length : 0
  };
}

// Additional helper functions...
async function getLowStockItems(threshold: number = 10) {
  return prisma.menuItem.findMany({
    where: {
      stockQuantity: { lte: threshold }

    }
  });
}

async function getInventoryValue() {
  const items = await prisma.menuItem.findMany({
  });

  return items.reduce((total, item) => {
    if (item.stockQuantity) {
      return total + (item.price * item.stockQuantity);
    }
    return total;
  }, 0);
}

async function getCategoryStockLevels() {
  return prisma.menuItem.groupBy({
    by: ['category'],
    _sum: {
      stockQuantity: true
    }
  });
}

async function getRecentStockUpdates(limit: number = 20) {
  return prisma.menuItem.findMany({
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
          name: true,
          category: true
        }
      ,
    take: limit
  });
}

async function getTopCustomers(dateFilter: any, limit: number = 10) {
  const topCustomers = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      status: OrderStatus.COMPLETED,
      ...dateFilter
    },
    _count: {
      id: true
    },
    _sum: {
      totalAmount: true
    },
    orderBy: {
      _sum: {
        totalAmount: 'desc'
      }
    },
    take: limit
  });

  const userIds = topCustomers.map((c: { userId: any; }) => c.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true, studentId: true }
  });

  return topCustomers.map((customer: { userId: any; _count: { id: any; }; _sum: { totalAmount: any; }; }) => {
    const user = users.find((u: { id: any; }) => u.id === customer.userId);
    return {
      ...user,
      orderCount: customer._count.id,
      totalSpent: customer._sum.totalAmount || 0
    };
  });
}

async function getCustomerAcquisition(dateFilter: any) {
  return prisma.user.count({
    where: {
      role: 'STUDENT',
      ...dateFilter
    }
  });
}

async function getCustomerOrderFrequency(dateFilter: any) {
  const orderFrequency = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      status: OrderStatus.COMPLETED,
      ...dateFilter
    },
    _count: {
      id: true
    }
  });

  const frequencies = {
    '1': 0,
    '2-5': 0,
    '6-10': 0,
    '10+': 0
  };

  orderFrequency.forEach((customer: { _count: { id: any; }; }) => {
    const orderCount = customer._count.id;
    if (orderCount === 1) {
      frequencies['1']++;
    } else if (orderCount <= 5) {
      frequencies['2-5']++;
    } else if (orderCount <= 10) {
      frequencies['6-10']++;
    } else {
      frequencies['10+']++;
    }
  });

  return frequencies;
}

async function getCustomerAvgOrderValues(dateFilter: any) {
  const customerValues = await prisma.order.groupBy({
    by: ['userId'],
    where: {
      status: OrderStatus.COMPLETED,
      ...dateFilter
    },
    _avg: {
      totalAmount: true
    }
  });

  return {
    totalCustomers: customerValues.length,
    overallAvg: customerValues.reduce((sum: any, c: { _avg: { totalAmount: any; }; }) => sum + (c._avg.totalAmount || 0), 0) / customerValues.length
  };
}

export default router;

// TODO: Add export functionality for reports (PDF, Excel)
// TODO: Implement scheduled report generation and email delivery
// TODO: Add more advanced analytics and forecasting
// TODO: Implement report caching for better performance
// TODO: Add comparative analysis (month-over-month, year-over-year)