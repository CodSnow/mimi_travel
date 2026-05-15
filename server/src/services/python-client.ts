import type {
  CaregiverMatchRequest,
  CaregiverMatchResponse,
  DriverMatchRequest,
  DriverMatchResponse,
} from '../internal-dto/matching.js';
import type {
  AcceptOfferRequest,
  AcceptOfferResponse,
  DemandCancelRequest,
  DemandCreateRequest,
  DemandListResponse,
  DemandResponse,
  OfferCreateRequest,
  OfferListResponse,
  OfferResponse,
  OrderDetailResponse,
  OrderListResponse,
  OrderResponse,
  OrderTransitionRequest,
} from '../internal-dto/marketplace.js';
import type { OrderSnapshotRequest, OrderSnapshotResponse } from '../internal-dto/orders.js';
import type {
  LocationListResponse,
  LocationReportRequest,
  LocationReportResponse,
} from '../internal-dto/locations.js';
import type { PricingQuoteRequest, PricingQuoteResponse } from '../internal-dto/pricing.js';
import type {
  PaymentCloseRequest,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentNotifyRequest,
  PaymentQueryRequest,
  PaymentResponse,
  RefundCreateRequest,
  RefundCreateResponse,
} from '../internal-dto/payments.js';
import type {
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationResponse,
  EnsureOrderConversationRequest,
  MarkReadRequest,
  MessageReadResponse,
  MessageResponse,
  SendMessageRequest,
} from '../internal-dto/messages.js';
import type {
  AdminDashboardResponse,
  ComplaintResponse,
  DisputeResponse,
  PolicyFavoriteListResponse,
  PolicyFavoriteResponse,
  ProviderApplicationResponse,
} from '../internal-dto/governance.js';
import type {
  ProviderReviewSummaryRequest,
  ProviderReviewSummaryResponse,
} from '../internal-dto/reviews.js';
import type {
  PrepayRiskCheckRequest,
  PrepayRiskCheckResponse,
} from '../internal-dto/risk.js';
import type {
  AddressRecord,
  PetRecord,
  PythonReviewRecord,
  PythonServiceFeedbackRecord,
} from '../internal-dto/profile.js';

export interface PythonLoginResponse {
  user: {
    id: string;
    phone: string;
    nickname: string;
    avatar?: string | null;
    role: string;
    verified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  session: {
    token: string;
    expiresAt: string;
  };
}

export interface PythonProviderProfile {
  userId: string;
  nickname: string;
  phone: string;
  avatar?: string | null;
  role: string;
  verified: boolean;
  status: string;
  services: string[];
  intro?: string | null;
  serviceRadiusKm: number;
  baseDistrict?: string | null;
  score?: number | null;
  completedOrderCount: number;
  catCareScore?: number | null;
  communicationScore?: number | null;
  punctualityScore?: number | null;
  emergencyHandlingScore?: number | null;
  petFriendlyScore?: number | null;
  drivingStabilityScore?: number | null;
  cleanlinessScore?: number | null;
  supportsHomeVisit?: boolean | null;
  supportsMedication?: boolean | null;
  supportsMultiDayCare?: boolean | null;
  supportsEmergencyOrder?: boolean | null;
  catCareTags: string[];
}

export interface PythonVehicleProfile {
  id: string;
  userId: string;
  vehicleType: string;
  plateMasked: string;
  seats: number;
  trunkLevel?: string | null;
  supportsCatBag: boolean;
  supportsCrate: boolean;
  supportsStroller: boolean;
  supportsMultiPet: boolean;
  petFriendly: boolean;
  petFriendlyTags: string[];
}

export interface PythonProviderBundle {
  user: PythonLoginResponse['user'];
  provider: PythonProviderProfile;
  vehicles: PythonVehicleProfile[];
}

export class PythonClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export class PythonClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async login(payload: { phone: string; nickname: string; avatar?: string }): Promise<PythonLoginResponse> {
    return this.post('/internal/identity/login', payload);
  }

  async listProviders(query: Record<string, string | undefined>): Promise<{ items: PythonProviderProfile[] }> {
    return this.get('/internal/profiles/providers', query);
  }

  async getProvider(userId: string): Promise<PythonProviderBundle> {
    return this.get(`/internal/profiles/providers/${userId}`);
  }

  async listPets(userId: string): Promise<PetRecord[]> {
    return this.get('/internal/profiles/pets', { userId });
  }

  async createPet(payload: Record<string, unknown>): Promise<PetRecord> {
    return this.post('/internal/profiles/pets', payload);
  }

  async listAddresses(userId: string): Promise<AddressRecord[]> {
    return this.get('/internal/profiles/addresses', { userId });
  }

  async createAddress(payload: Record<string, unknown>): Promise<AddressRecord> {
    return this.post('/internal/profiles/addresses', payload);
  }

  async createProviderApplication(payload: Record<string, unknown>): Promise<ProviderApplicationResponse> {
    return this.post('/internal/profiles/provider-applications', payload);
  }

  async matchCaregivers(payload: CaregiverMatchRequest): Promise<CaregiverMatchResponse> {
    return this.post('/internal/matching/caregivers', payload);
  }

  async matchDrivers(payload: DriverMatchRequest): Promise<DriverMatchResponse> {
    return this.post('/internal/matching/drivers', payload);
  }

  async providerReviewSummary(
    payload: ProviderReviewSummaryRequest,
  ): Promise<ProviderReviewSummaryResponse> {
    return this.post('/internal/reviews/provider-summary', payload);
  }

  async createReview(orderId: string, payload: Record<string, unknown>): Promise<PythonReviewRecord> {
    return this.post(`/internal/reviews/orders/${orderId}/reviews`, payload);
  }

  async listProviderReviews(providerUserId: string): Promise<{ items: PythonReviewRecord[] }> {
    return this.get(`/internal/reviews/providers/${providerUserId}/reviews`);
  }

  async createFeedback(orderId: string, payload: Record<string, unknown>): Promise<PythonServiceFeedbackRecord> {
    return this.post(`/internal/reviews/orders/${orderId}/feedback`, payload);
  }

  async listFeedback(orderId: string): Promise<{ items: PythonServiceFeedbackRecord[] }> {
    return this.get(`/internal/reviews/orders/${orderId}/feedback`);
  }

  async quote(payload: PricingQuoteRequest): Promise<PricingQuoteResponse> {
    return this.post('/internal/pricing/quote', payload);
  }

  async prepayCheck(payload: PrepayRiskCheckRequest): Promise<PrepayRiskCheckResponse> {
    return this.post('/internal/risk/prepay-check', payload);
  }

  async orderSnapshot(payload: OrderSnapshotRequest): Promise<OrderSnapshotResponse> {
    return this.post('/internal/orders/snapshot', payload);
  }

  async createDemand(payload: DemandCreateRequest): Promise<DemandResponse> {
    return this.post('/internal/marketplace/demands', payload);
  }

  async listDemands(query: Record<string, string | undefined>): Promise<DemandListResponse> {
    return this.get('/internal/marketplace/demands', query);
  }

  async getDemand(demandId: string): Promise<DemandResponse> {
    return this.get(`/internal/marketplace/demands/${demandId}`);
  }

  async cancelDemand(demandId: string, payload: DemandCancelRequest): Promise<DemandResponse> {
    return this.post(`/internal/marketplace/demands/${demandId}/cancel`, payload);
  }

  async createOffer(demandId: string, payload: OfferCreateRequest): Promise<OfferResponse> {
    return this.post(`/internal/marketplace/demands/${demandId}/offers`, payload);
  }

  async listOffers(demandId: string): Promise<OfferListResponse> {
    return this.get(`/internal/marketplace/demands/${demandId}/offers`);
  }

  async acceptOffer(offerId: string, payload: AcceptOfferRequest): Promise<AcceptOfferResponse> {
    return this.post(`/internal/marketplace/offers/${offerId}/accept`, payload);
  }

  async rejectOffer(offerId: string): Promise<OfferResponse> {
    return this.post(`/internal/marketplace/offers/${offerId}/reject`, {});
  }

  async withdrawOffer(offerId: string): Promise<OfferResponse> {
    return this.post(`/internal/marketplace/offers/${offerId}/withdraw`, {});
  }

  async listOrders(query: Record<string, string | undefined>): Promise<OrderListResponse> {
    return this.get('/internal/marketplace/orders', query);
  }

  async getOrderDetail(orderId: string, operatorUserId: string): Promise<OrderDetailResponse> {
    return this.get(`/internal/marketplace/orders/${orderId}`, { operatorUserId });
  }

  async transitionOrder(orderId: string, payload: OrderTransitionRequest): Promise<OrderResponse> {
    return this.post(`/internal/marketplace/orders/${orderId}/transition`, payload);
  }

  async createPayment(payload: PaymentCreateRequest): Promise<PaymentCreateResponse> {
    return this.post('/internal/payments', payload);
  }

  async getPayment(paymentId: string, operatorUserId: string): Promise<PaymentResponse> {
    return this.get(`/internal/payments/${paymentId}`, { operatorUserId });
  }

  async queryPayment(paymentId: string, payload: PaymentQueryRequest): Promise<PaymentResponse> {
    return this.post(`/internal/payments/${paymentId}/query`, payload);
  }

  async closePayment(paymentId: string, payload: PaymentCloseRequest): Promise<PaymentResponse> {
    return this.post(`/internal/payments/${paymentId}/close`, payload);
  }

  async refundPayment(paymentId: string, payload: RefundCreateRequest): Promise<RefundCreateResponse> {
    return this.post(`/internal/payments/${paymentId}/refund`, payload);
  }

  async notifyPayment(payload: PaymentNotifyRequest): Promise<PaymentResponse> {
    return this.post('/internal/payments/notify', payload);
  }

  async listConversations(userId: string): Promise<ConversationListResponse> {
    return this.get('/internal/messages/conversations', { userId });
  }

  async ensureOrderConversation(payload: EnsureOrderConversationRequest): Promise<ConversationResponse> {
    return this.post('/internal/messages/conversations/ensure-order', payload);
  }

  async getConversation(conversationId: string, operatorUserId: string): Promise<ConversationDetailResponse> {
    return this.get(`/internal/messages/conversations/${conversationId}`, { operatorUserId });
  }

  async sendMessage(conversationId: string, payload: SendMessageRequest): Promise<MessageResponse> {
    return this.post(`/internal/messages/conversations/${conversationId}`, payload);
  }

  async markMessageRead(payload: MarkReadRequest): Promise<MessageReadResponse> {
    return this.post('/internal/messages/read', payload);
  }

  async reportLocation(payload: LocationReportRequest): Promise<LocationReportResponse> {
    return this.post('/internal/locations/report', payload);
  }

  async listOrderLocations(orderId: string, operatorUserId: string): Promise<LocationListResponse> {
    return this.get(`/internal/locations/orders/${orderId}`, { operatorUserId });
  }

  async adminDashboard(adminUserId: string): Promise<AdminDashboardResponse> {
    return this.get('/internal/governance/admin/dashboard', { adminUserId });
  }

  async reviewProviderApplication(
    applicationId: string,
    payload: { adminUserId: string; status: string; reviewNote?: string },
  ): Promise<{ application: ProviderApplicationResponse }> {
    return this.post(`/internal/governance/provider-applications/${applicationId}/review`, payload);
  }

  async createComplaint(payload: Record<string, unknown>): Promise<ComplaintResponse> {
    return this.post('/internal/governance/complaints', payload);
  }

  async handleComplaint(complaintId: string, payload: Record<string, unknown>): Promise<ComplaintResponse> {
    return this.post(`/internal/governance/complaints/${complaintId}/handle`, payload);
  }

  async createDispute(payload: Record<string, unknown>): Promise<DisputeResponse> {
    return this.post('/internal/governance/disputes', payload);
  }

  async handleDispute(disputeId: string, payload: Record<string, unknown>): Promise<DisputeResponse> {
    return this.post(`/internal/governance/disputes/${disputeId}/handle`, payload);
  }

  async listPolicyFavorites(userId: string): Promise<PolicyFavoriteListResponse> {
    return this.get('/internal/governance/policy-favorites', { userId });
  }

  async createPolicyFavorite(payload: Record<string, unknown>): Promise<PolicyFavoriteResponse> {
    return this.post('/internal/governance/policy-favorites', payload);
  }

  private async get<TResponse>(
    path: string,
    query?: Record<string, string | undefined>,
  ): Promise<TResponse> {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(toSnakeCaseKey(key), value);
    });

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Internal-Token': this.token,
        },
      });
    } catch (error) {
      throw new PythonClientError('Python 服务不可用', 503, error);
    }

    return this.readResponse<TResponse>(response);
  }

  private async post<TRequest, TResponse>(path: string, payload: TRequest): Promise<TResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': this.token,
        },
        body: JSON.stringify(toSnakeCaseKeys(payload)),
      });
    } catch (error) {
      throw new PythonClientError('Python 服务不可用', 503, error);
    }

    return this.readResponse<TResponse>(response);
  }

  private async readResponse<TResponse>(response: Response): Promise<TResponse> {
    const raw = await response.text();
    const parsed = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      throw new PythonClientError(
        'Python 服务调用失败',
        response.status,
        parsed ?? raw,
      );
    }

    return toCamelCaseKeys(parsed) as TResponse;
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toSnakeCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSnakeCaseKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        toSnakeCaseKey(key),
        toSnakeCaseKeys(nestedValue),
      ]),
    );
  }
  return value;
}

function toSnakeCaseKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        toCamelCaseKeys(nestedValue),
      ]),
    );
  }
  return value;
}
