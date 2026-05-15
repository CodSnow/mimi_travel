import type { PaymentRecord, RefundRecord } from '@mimi/shared';

export interface PaymentCreateRequest {
  orderId: string;
  operatorUserId: string;
  channel: PaymentRecord['channel'];
  scene: PaymentRecord['scene'];
  amountFen?: number;
  idempotencyKey?: string;
}

export type PaymentResponse = PaymentRecord & {
  idempotencyKey?: string;
  queryCount: number;
  eventSummary?: Record<string, unknown>;
  channelPayload?: Record<string, unknown>;
};

export interface PaymentCreateResponse {
  payment: PaymentResponse;
  channelPayload: Record<string, unknown>;
}

export interface PaymentQueryRequest {
  operatorUserId: string;
  markPaid?: boolean;
  providerTradeNo?: string;
  rawPayload?: Record<string, unknown>;
}

export interface PaymentCloseRequest {
  operatorUserId: string;
}

export interface PaymentNotifyRequest {
  provider?: 'local' | 'alipay' | 'wechat_pay';
  outTradeNo: string;
  providerTradeNo?: string;
  headers?: Record<string, string>;
  rawPayload?: Record<string, unknown>;
}

export interface RefundCreateRequest {
  operatorUserId: string;
  reason?: string;
  refundAmountFen?: number;
}

export interface RefundQueryRequest {
  operatorUserId: string;
  providerRefundNo: string;
}

export type RefundResponse = RefundRecord;

export interface RefundCreateResponse {
  payment: PaymentResponse;
  refund: RefundResponse;
}
