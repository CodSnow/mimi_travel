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
  ProviderReviewSummaryRequest,
  ProviderReviewSummaryResponse,
} from '../internal-dto/reviews.js';
import type {
  PrepayRiskCheckRequest,
  PrepayRiskCheckResponse,
} from '../internal-dto/risk.js';

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

  private async get<TResponse>(
    path: string,
    query?: Record<string, string | undefined>,
  ): Promise<TResponse> {
    const url = new URL(`${this.baseUrl}${path}`);
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, value);
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
        key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
        toSnakeCaseKeys(nestedValue),
      ]),
    );
  }
  return value;
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
