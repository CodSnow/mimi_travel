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
  outTradeNo: string;
  providerTradeNo?: string;
  rawPayload?: Record<string, unknown>;
}

export interface RefundCreateRequest {
  operatorUserId: string;
  reason?: string;
  refundAmountFen?: number;
}

export type RefundResponse = RefundRecord;

export interface RefundCreateResponse {
  payment: PaymentResponse;
  refund: RefundResponse;
}
