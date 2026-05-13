import type { ServiceOrder } from '@mimi/shared';
import type { PaymentResponse, RefundResponse } from './payments.js';

export interface PolicyFavoriteResponse {
  id: string;
  userId: string;
  policyId: string;
  title: string;
  district?: string;
  createdAt: string;
}

export interface PolicyFavoriteListResponse {
  items: PolicyFavoriteResponse[];
}

export interface ComplaintResponse {
  id: string;
  orderId?: string;
  complainantUserId: string;
  targetUserId?: string;
  category: string;
  content: string;
  evidenceUrls: string[];
  status: string;
  resolution?: string;
  handledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeResponse {
  id: string;
  orderId: string;
  openerUserId: string;
  respondentUserId?: string;
  reason: string;
  description: string;
  requestedRefundFen?: number;
  evidenceUrls: string[];
  status: string;
  resolution?: string;
  handledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLogResponse {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface ProviderApplicationResponse {
  id: string;
  userId: string;
  services: string[];
  baseDistrict?: string;
  intro?: string;
  experience?: string;
  credentialUrls: string[];
  status: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardResponse {
  providerApplications: ProviderApplicationResponse[];
  complaints: ComplaintResponse[];
  disputes: DisputeResponse[];
  orders: ServiceOrder[];
  refunds: RefundResponse[];
  auditLogs: AdminAuditLogResponse[];
}
