export type PaymentChannel = 'alipay' | 'wechat_pay';
export type PaymentScene = 'deposit' | 'full' | 'balance';
export type PaymentCurrency = 'CNY';
export type PaymentStatus =
  | 'created'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'closed'
  | 'refunded'
  | 'partial_refunded';

export interface PaymentRecord {
  id: string;
  orderId: string;
  channel: PaymentChannel;
  scene: PaymentScene;
  amountFen: number;
  currency: PaymentCurrency;
  status: PaymentStatus;
  outTradeNo: string;
  providerTradeNo?: string;
  rawNotify?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  orderId: string;
  refundAmountFen: number;
  status: 'pending' | 'success' | 'failed';
  providerRefundNo?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}
