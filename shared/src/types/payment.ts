export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash',
  CARD = 'card',
  STUDENT_CARD = 'student_card',
  WALLET = 'wallet'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum MobileMoneyProvider {
  MTN = 'mtn',
  AIRTEL = 'airtel',
  VODAFONE = 'vodafone',
  TIGO = 'tigo'
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  mobileMoneyDetails?: MobileMoneyDetails;
  cardDetails?: CardDetails;
  description?: string;
}

export interface MobileMoneyDetails {
  provider: MobileMoneyProvider;
  phoneNumber: string;
}

export interface CardDetails {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  cardholderName: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  gatewayResponse?: any;
  mobileMoneyDetails?: MobileMoneyDetails;
  failureReason?: string;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentStatusUpdate {
  paymentId: string;
  status: PaymentStatus;
  transactionId?: string;
  failureReason?: string;
  gatewayResponse?: any;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageTransactionValue: number;
  paymentMethodStats: Record<PaymentMethod, {
    count: number;
    totalAmount: number;
  }>;
  mobileMoneyProviderStats: Record<MobileMoneyProvider, {
    count: number;
    totalAmount: number;
  }>;
}