import express from 'express';
import { prisma, io } from '../index';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { PaymentMethod, PaymentStatus, OrderStatus} from '@prisma/client';
import { UserRole} from '../types/user';
const router = express.Router();

// Get payment history (role-based filtering)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { status, method, limit, offset } = req.query;
    const user = req.user!;

    let where: any = {};

    // Students can only see their own payments
    if (user.role === UserRole.STUDENT) {
      where.order = { userId: user.id };
    }

    if (status) {
      where.status = status as PaymentStatus;
    }

    if (method) {
      where.method = method as PaymentMethod;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        order: {
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
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : undefined,
      skip: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
});

// Get single payment
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    let where: any = { id };

    // Students can only view their own payments
    if (user.role === UserRole.STUDENT) {
      where.order = { userId: user.id };
    }

    const payment = await prisma.payment.findFirst({
      where,
      include: {
        order: {
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
                    name: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw createError('Payment not found', 404);
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
});

// Process cash payment (staff only)
router.post('/cash', 
  authenticateToken,
  requirePermission('process_payments'),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { orderId, amountReceived, notes } = req.body;
      const staff = req.user!;

      if (!orderId || !amountReceived) {
        throw createError('Order ID and amount received are required', 400);
      }

      // Get the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true
            }
          }
        }
      });

      if (!order) {
        throw createError('Order not found', 404);
      }

      if (order.paymentId) {
        throw createError('Payment already exists for this order', 400);
      }

      const amountReceivedFloat = parseFloat(amountReceived);
      const changeAmount = amountReceivedFloat - order.totalAmount;

      if (changeAmount < 0) {
        throw createError('Insufficient payment amount', 400);
      }

      // Create payment record and update order
      const payment = await prisma.$transaction(async (tx) => {
        // Create payment
        const newPayment = await tx.payment.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            method: PaymentMethod.CASH,
            status: PaymentStatus.COMPLETED,
            amount: order.totalAmount,
            transactionId: `CASH-${Date.now()}-${order.id.slice(-8)}`
          },
          include: {
            order: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentId: true
                  }
                }
              }
            }
          }
        });

        // Update order status to confirmed
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CONFIRMED,
            updatedAt: new Date()
          }
        });

        return newPayment;
      });

      // Log payment processing
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          message: 'PAYMENT_PROCESSED',
          userId: req.user?.id,
          context: {
            paymentId: payment.id,
            orderId: order.id,
            amount: payment.amount,
            method: payment.method,
            status: payment.status
          }
        }
      });

      // Broadcast payment confirmation
      io.to(`order:${orderId}`).emit('payment-completed', {
        orderId,
        payment,
        order: { ...order, status: OrderStatus.CONFIRMED }
      });

      // Notify kitchen of confirmed order
      io.to('role:KITCHEN').emit('order-confirmed', {
        orderId,
        customerName: order.user.firstName + ' ' + order.user.lastName,
        studentId: order.user.studentId
      });

      res.json({
        success: true,
        data: { payment }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Initiate mobile money payment
router.post('/mobile-money',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { orderId, phoneNumber, provider } = req.body;
      const user = req.user!;

      if (!orderId || !phoneNumber || !provider) {
        throw createError('Order ID, phone number, and provider are required', 400);
      }

      // Get the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true }
      });

      if (!order) {
        throw createError('Order not found', 404);
      }

      // Check if user owns the order (for students)
      if (user.role === UserRole.STUDENT && order.userId !== user.id) {
        throw createError('You can only pay for your own orders', 403);
      }

      if (order.payments) {
        throw createError('Payment already exists for this order', 400);
      }

      // Create pending payment record
      const payment = await prisma.payment.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          method: PaymentMethod.MOBILE_MONEY,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount,
          phoneNumber,
          mobileMoneyProvider: provider,
          transactionId: `MM-${Date.now()}-${order.id.slice(-8)}`,
    
        }
      });

      // Simulate mobile money API call
      const mockMobileMoneyResponse = await simulateMobileMoneyRequest({
        phoneNumber,
        amount: order.totalAmount,
        provider,
        transactionId: payment?.transactionId ?? ''
      });

      if (mockMobileMoneyResponse.status === 'success') {
        // Update payment as completed
        const updatedPayment = await prisma.$transaction(async (tx: { payment: { update: (arg0: { where: { id: any; }; data: { status: PaymentStatus; externalTransactionId: string | undefined; completedAt: Date; }; }) => any; }; order: { update: (arg0: { where: { id: any; }; data: { status: OrderStatus; updatedAt: Date; }; }) => any; }; }) => {
          const completedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.COMPLETED,
              externalTransactionId: mockMobileMoneyResponse.externalId,
              completedAt: new Date()
            }
          });

          // Update order status
          await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.CONFIRMED,
              updatedAt: new Date()
            }
          });

          return completedPayment;
        });

        // Log successful payment
        await prisma.systemLog.create({
          data: {
            level: 'INFO',
            message: 'MOBILE_PAYMENT_COMPLETED',
            userId: user.id,
            context: {
              paymentId: payment.id,
              orderId: order.id,
              provider,
              amount: order.totalAmount
            }
          }
        });

        // Broadcast payment completion
        io.to(`order:${orderId}`).emit('payment-completed', {
          orderId,
          payment: updatedPayment,
          order: { ...order, status: OrderStatus.CONFIRMED }
        });

        // Notify kitchen
        io.to('role:KITCHEN').emit('order-confirmed', {
          orderId,
          customerName: user.name
        });

        res.json({
          success: true,
          data: { 
            payment: updatedPayment,
            message: 'Payment completed successfully'
          }
        });
      } else {
        // Update payment as failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: mockMobileMoneyResponse.error
          }
        });

        throw createError(`Payment failed: ${mockMobileMoneyResponse.error}`, 400);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Verify mobile money payment status
router.get('/mobile-money/:transactionId/verify',
  authenticateToken,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { transactionId } = req.params;
      const user = req.user!;

      const payment = await prisma.payment.findFirst({
        where: {
          transactionId,
          method: PaymentMethod.MOBILE_MONEY
        },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentId: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw createError('Payment not found', 404);
      }

      // Check permissions
      if (user.role === UserRole.STUDENT && payment.userId !== user.id) {
        throw createError('You can only verify your own payments', 403);
      }

      // Simulate checking with mobile money provider
      const verificationResult = await simulatePaymentVerification(transactionId);

      res.json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            transactionId: payment.transactionId,
            externalTransactionId: ''
          },
          verification: verificationResult
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get payment statistics (staff/admin only)
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
        totalPayments,
        completedPayments,
        failedPayments,
        pendingPayments,
        totalRevenue,
        cashPayments,
        mobileMoneyPayments,
        avgPaymentAmount
      ] = await Promise.all([
        prisma.payment.count({ where: dateFilter }),
        prisma.payment.count({ where: { status: PaymentStatus.COMPLETED, ...dateFilter } }),
        prisma.payment.count({ where: { status: PaymentStatus.FAILED, ...dateFilter } }),
        prisma.payment.count({ where: { status: PaymentStatus.PENDING, ...dateFilter } }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED, ...dateFilter },
          _sum: { amount: true }
        }),
        prisma.payment.count({ where: { method: PaymentMethod.CASH, ...dateFilter } }),
        prisma.payment.count({ where: { method: PaymentMethod.MOBILE_MONEY, ...dateFilter } }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.COMPLETED, ...dateFilter },
          _avg: { amount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalPayments,
          completedPayments,
          failedPayments,
          pendingPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
          paymentMethods: {
            cash: cashPayments,
            mobileMoney: mobileMoneyPayments
          },
          avgPaymentAmount: avgPaymentAmount._avg.amount || 0
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Simulate mobile money API request
async function simulateMobileMoneyRequest(data: {
  phoneNumber: string;
  amount: number;
  provider: string;
  transactionId: string;
}) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock success/failure based on phone number (for testing)
  const shouldSucceed = !data.phoneNumber.includes('fail');
  
  if (shouldSucceed) {
    return {
      status: 'success',
      externalId: `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message: 'Payment processed successfully'
    };
  } else {
    return {
      status: 'failed',
      error: 'Insufficient funds or invalid phone number'
    };
  }
}

// Simulate payment verification
async function simulatePaymentVerification(transactionId: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    status: 'verified',
    timestamp: new Date().toISOString(),
    provider_reference: `REF-${Math.random().toString(36).substr(2, 12)}`
  };
}

export default router;

// TODO: Integrate with real mobile money APIs (MTN, Airtel, etc.)
// TODO: Implement payment webhooks for real-time status updates
// TODO: Add payment retry mechanism for failed transactions
// TODO: Implement payment refund functionality
// TODO: Add support for payment plans and installments
// TODO: Implement payment fraud detection and prevention