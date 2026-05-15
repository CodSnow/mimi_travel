import type {
  Conversation,
  Demand,
  LocationPoint,
  MessageRecord,
  Offer,
  OrderEvent,
  PaymentChannel,
  PaymentRecord,
  PaymentScene,
  PolicyDocument,
  ProviderProfile,
  ReviewRecord,
  ServiceFeedbackRecord,
  ServiceOrder,
  UserProfile,
  VehicleProfile,
} from '@mimi/shared';

export class ApiError extends Error {
  constructor(message: string, public readonly statusCode = 500, public readonly details?: unknown) {
    super(message);
  }
}

export interface ProviderBundle {
  user?: UserProfile;
  provider?: ProviderProfile;
  vehicles: VehicleProfile[];
}

export interface ReviewSummary {
  providerUserId: string;
  overallScore: number;
  reviewCount: number;
  catCareScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  punctualityScore?: number;
  cleanlinessScore?: number;
  communicationScore?: number;
  feedbackCompletenessScore?: number;
  medicationAccuracyScore?: number;
  topTags: Array<{ tag: string; count: number }>;
}

export interface KnowledgePreview extends Omit<PolicyDocument, 'content'> {}

export interface KnowledgeResponse {
  updatedAt: string;
  sourceNames: string[];
  districts: string[];
  documents: KnowledgePreview[];
}

export interface AskPolicyResponse {
  question: string;
  answer: string;
  mode: string;
  model: string;
  checklist?: string[];
  citations?: Array<{ id: string; title: string; sourceName: string; district: string }>;
  contexts: KnowledgePreview[];
}

export interface NavigationLinkResponse {
  amap: string;
  baidu: string;
  webFallback: string;
}

export interface NavigationSdkProviderConfig {
  enabled: boolean;
  key: string;
  sdkUrl: string;
}

export interface NavigationSdkConfig {
  enabled: boolean;
  webFallbackEnabled: boolean;
  providers: {
    amap: NavigationSdkProviderConfig;
    baidu: NavigationSdkProviderConfig;
  };
}

export interface PolicyFavoriteRecord {
  id: string;
  userId: string;
  policyId: string;
  title: string;
  district?: string;
  createdAt: string;
}

export interface PetProfileRecord {
  id: string;
  userId: string;
  name: string;
  breed?: string | null;
  weight?: string | null;
  vaccine?: string | null;
  certificate?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddressRecord {
  id: string;
  userId: string;
  label: string;
  contactName?: string | null;
  contactPhone?: string | null;
  district?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  coordSystem: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintRecord {
  id: string;
  orderId?: string;
  complainantUserId: string;
  targetUserId?: string;
  category: string;
  content: string;
  evidenceUrls: string[];
  status: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardResponse {
  providerApplications: Array<{ id: string; userId: string; status: string; services: string[]; createdAt: string }>;
  complaints: ComplaintRecord[];
  disputes: Array<{ id: string; orderId: string; status: string; reason: string; description: string; createdAt: string }>;
  orders: ServiceOrder[];
  refunds: Array<Record<string, unknown>>;
  auditLogs: Array<{ id: string; action: string; targetType: string; targetId: string; createdAt: string }>;
}

export interface PricingQuoteResponse {
  requestId: string;
  amountFen: number;
  breakdown: Array<{ code: string; label: string; amountFen: number }>;
}

export interface PrepayRiskCheckResponse {
  requestId: string;
  allowed: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasonCodes: string[];
  humanMessage?: string;
}

export interface PaymentCreateResponse {
  payment: PaymentRecord;
  channelPayload: {
    payUrl: string;
    appParams: Record<string, string>;
  };
}

export interface ConversationDetailResponse {
  conversation: Conversation;
  messages: MessageRecord[];
}

export interface OrderDetailResponse {
  order: ServiceOrder;
  events: OrderEvent[];
}

let currentUserId = '';

function requireCurrentUserId(): string {
  if (!currentUserId) {
    throw new ApiError('当前用户未初始化，请重新登录', 401);
  }
  return currentUserId;
}

export interface CaregiverMatchCandidate {
  providerUserId: string;
  score: number;
  distanceKm?: number;
  reasons: string[];
  priceHintMin?: number;
  priceHintMax?: number;
  profileSnapshot: {
    nickname: string;
    avatar?: string;
    catCareScore?: number;
    communicationScore?: number;
    punctualityScore?: number;
    tags: string[];
    completedOrderCount: number;
    supportsHomeVisit?: boolean;
    supportsMedication?: boolean;
    supportsMultiDayCare?: boolean;
  };
}

export interface DriverMatchCandidate {
  providerUserId: string;
  vehicleId?: string;
  score: number;
  distanceKm?: number;
  etaMinutes?: number;
  reasons: string[];
  profileSnapshot: {
    nickname: string;
    avatar?: string;
    petFriendlyScore?: number;
    drivingStabilityScore?: number;
    cleanlinessScore?: number;
    punctualityScore?: number;
    tags: string[];
    completedOrderCount: number;
  };
  vehicleSnapshot?: {
    vehicleType: VehicleProfile['vehicleType'];
    trunkLevel?: VehicleProfile['trunkLevel'];
    supportsCatBag: boolean;
    supportsCrate: boolean;
    supportsStroller: boolean;
    supportsMultiPet: boolean;
    petFriendly: boolean;
    petFriendlyTags: string[];
  };
}

export interface MatchResponse<TCandidate> {
  requestId: string;
  candidates: TCandidate[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });

  const raw = await response.text();
  const data = raw ? safeParse(raw) : null;
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `请求失败：${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const api = {
  setCurrentUserId(userId: string) {
    currentUserId = userId;
  },
  clearCurrentUserId() {
    currentUserId = '';
  },
  login(payload: { nickname?: string; phone?: string; avatar?: string }) {
    return request<{ user: UserProfile; session: { userId: string; issuedAt: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  authMe() {
    return request<{ user: UserProfile }>('/api/auth/me');
  },
  getCurrentUser() {
    return request<UserProfile>('/api/users/me');
  },
  updateCurrentUser(payload: Partial<UserProfile>) {
    return request<UserProfile>('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  listProviders(params: { serviceType?: string; district?: string } = {}) {
    return request<{ items: ProviderProfile[] }>(`/api/providers${toQuery(params)}`);
  },
  getProvider(userId: string) {
    return request<ProviderBundle>(`/api/providers/${userId}`);
  },
  getProviderReviewSummary(userId: string) {
    return request<ReviewSummary>(`/api/providers/${userId}/review-summary`);
  },
  applyProvider(payload: {
    userId?: string;
    services: string[];
    intro: string;
    serviceRadiusKm: number;
    baseDistrict: string;
    supportsHomeVisit?: boolean;
    supportsMedication?: boolean;
    supportsMultiDayCare?: boolean;
    vehicle?: Partial<VehicleProfile>;
  }) {
    return request<{ application?: { id: string; status: string; services: string[] }; provider?: ProviderProfile; vehicle?: VehicleProfile }>('/api/providers/apply', {
      method: 'POST',
      body: JSON.stringify({ ...payload, userId: payload.userId || requireCurrentUserId() }),
    });
  },
  listPets(userId = requireCurrentUserId()) {
    return request<{ items: PetProfileRecord[] }>(`/api/pets${toQuery({ userId })}`);
  },
  createPet(payload: {
    name: string;
    breed?: string;
    weight?: string;
    vaccine?: string;
    certificate?: string;
    avatar?: string;
  }) {
    return request<PetProfileRecord>('/api/pets', {
      method: 'POST',
      body: JSON.stringify({ ...payload, userId: requireCurrentUserId() }),
    });
  },
  listAddresses(userId = requireCurrentUserId()) {
    return request<{ items: AddressRecord[] }>(`/api/addresses${toQuery({ userId })}`);
  },
  createAddress(payload: {
    label: string;
    address: string;
    contactName?: string;
    contactPhone?: string;
    district?: string;
    lat?: number;
    lng?: number;
    coordSystem?: string;
    isDefault?: boolean;
  }) {
    return request<AddressRecord>('/api/addresses', {
      method: 'POST',
      body: JSON.stringify({ ...payload, userId: requireCurrentUserId() }),
    });
  },
  createDemand(payload: Record<string, unknown>) {
    return request<Demand>('/api/demands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  listDemands(params: Record<string, string | number | boolean | undefined> = {}) {
    return request<{ items: Demand[] }>(`/api/demands${toQuery(params)}`);
  },
  listOffers(demandId: string) {
    return request<{ items: Offer[] }>(`/api/demands/${demandId}/offers`);
  },
  createOffer(demandId: string, payload: Record<string, unknown>) {
    return request<Offer>(`/api/demands/${demandId}/offers`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  acceptOffer(offerId: string) {
    return request<{ offer: Offer; order: ServiceOrder }>(`/api/offers/${offerId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ operatorUserId: requireCurrentUserId() }),
    });
  },
  quotePricing(payload: Record<string, unknown>) {
    return request<PricingQuoteResponse>('/api/pricing/quote', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  matchCaregivers(payload: Record<string, unknown>) {
    return request<MatchResponse<CaregiverMatchCandidate>>('/api/matching/caregivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  matchDrivers(payload: Record<string, unknown>) {
    return request<MatchResponse<DriverMatchCandidate>>('/api/matching/drivers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  listOrders(params: { status?: string; userId?: string } = {}) {
    return request<{ items: ServiceOrder[] }>(
      `/api/orders${toQuery({ ...params, userId: params.userId || requireCurrentUserId() })}`,
    );
  },
  getOrder(orderId: string) {
    return request<OrderDetailResponse>(
      `/api/orders/${orderId}${toQuery({ operatorUserId: requireCurrentUserId() })}`,
    );
  },
  transitionOrder(orderId: string, action: 'confirm-arrival' | 'start-service' | 'complete' | 'cancel') {
    return request<ServiceOrder>(`/api/orders/${orderId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ operatorUserId: requireCurrentUserId() }),
    });
  },
  prepayCheck(payload: {
    order: {
      id: string;
      buyerUserId: string;
      sellerUserId: string;
      amountFen: number;
      serviceType: string;
      district?: string;
    };
    payment: { channel: PaymentChannel; scene: PaymentScene };
  }) {
    return request<PrepayRiskCheckResponse>('/api/payments/prepay-check', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createPayment(payload: { orderId: string; channel: PaymentChannel; scene: PaymentScene }) {
    return request<PaymentCreateResponse>('/api/payments', {
      method: 'POST',
      body: JSON.stringify({ ...payload, operatorUserId: requireCurrentUserId() }),
    });
  },
  queryPayment(paymentId: string, payload?: { markPaid?: boolean; providerTradeNo?: string }) {
    return request<PaymentRecord>(`/api/payments/${paymentId}/query`, {
      method: 'POST',
      body: JSON.stringify({ ...(payload || {}), operatorUserId: requireCurrentUserId() }),
    });
  },
  refundPayment(paymentId: string, reason: string) {
    return request<{ payment: PaymentRecord; refund: Record<string, unknown> }>(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason, operatorUserId: requireCurrentUserId() }),
    });
  },
  queryRefund(paymentId: string, providerRefundNo: string) {
    return request<Record<string, unknown>>(`/api/payments/${paymentId}/refund/query`, {
      method: 'POST',
      body: JSON.stringify({ providerRefundNo, operatorUserId: requireCurrentUserId() }),
    });
  },
  listConversations(userId = requireCurrentUserId()) {
    return request<{ items: Conversation[] }>(`/api/messages/conversations${toQuery({ userId })}`);
  },
  getConversation(conversationId: string) {
    return request<ConversationDetailResponse>(
      `/api/messages/conversations/${conversationId}${toQuery({ operatorUserId: requireCurrentUserId() })}`,
    );
  },
  sendMessage(conversationId: string, payload: { content: string }) {
    return request<MessageRecord>(`/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, senderUserId: requireCurrentUserId() }),
    });
  },
  createReview(orderId: string, payload: {
    revieweeUserId: string;
    overallScore: number;
    punctualityScore?: number;
    communicationScore?: number;
    catCareScore?: number;
    petFriendlyScore?: number;
    drivingStabilityScore?: number;
    cleanlinessScore?: number;
    feedbackCompletenessScore?: number;
    medicationAccuracyScore?: number;
    supportsPetHandlingScore?: number;
    tags?: string[];
    content?: string;
  }) {
    return request<ReviewRecord>(`/api/orders/${orderId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, operatorUserId: requireCurrentUserId() }),
    });
  },
  createFeedback(orderId: string, payload: {
    providerUserId?: string;
    arrivedAt?: string;
    leftAt?: string;
    note?: string;
    photoUrls?: string[];
    videoUrls?: string[];
  }) {
    return request<ServiceFeedbackRecord>(`/api/orders/${orderId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, operatorUserId: requireCurrentUserId() }),
    });
  },
  listFeedback(orderId: string) {
    return request<{ items: ServiceFeedbackRecord[] }>(`/api/orders/${orderId}/feedback`);
  },
  reportLocation(payload: {
    orderId?: string;
    userId?: string;
    lat: number;
    lng: number;
    address?: string;
    coordSystem?: 'gcj02' | 'wgs84' | 'bd09ll';
  }) {
    return request(`/api/locations/report`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, userId: payload.userId || requireCurrentUserId() }),
    });
  },
  buildNavigationLink(payload: {
    from: LocationPoint;
    to: LocationPoint;
    mode?: 'driving' | 'walking';
  }) {
    return request<NavigationLinkResponse>('/api/navigation/link' + toQuery({
      fromLat: payload.from.lat,
      fromLng: payload.from.lng,
      toLat: payload.to.lat,
      toLng: payload.to.lng,
      toName: payload.to.address,
      mode: payload.mode || 'driving',
    }));
  },
  getNavigationSdkConfig() {
    return request<NavigationSdkConfig>('/api/navigation/sdk-config');
  },
  getKnowledge(district?: string) {
    return request<KnowledgeResponse>(`/api/knowledge${toQuery({ district })}`);
  },
  getPolicyDocument(id: string) {
    return request<PolicyDocument>(`/api/knowledge/${id}`);
  },
  askPolicy(question: string) {
    return request<AskPolicyResponse>('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },
  listPolicyFavorites(userId = requireCurrentUserId()) {
    return request<{ items: PolicyFavoriteRecord[] }>(`/api/policy-favorites${toQuery({ userId })}`);
  },
  createPolicyFavorite(payload: { policyId: string; title: string; district?: string }) {
    return request<PolicyFavoriteRecord>('/api/policy-favorites', {
      method: 'POST',
      body: JSON.stringify({ ...payload, userId: requireCurrentUserId() }),
    });
  },
  createComplaint(payload: { orderId?: string; targetUserId?: string; category: string; content: string; evidenceUrls?: string[] }) {
    return request<ComplaintRecord>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify({ ...payload, complainantUserId: requireCurrentUserId() }),
    });
  },
  createDispute(payload: { orderId: string; respondentUserId?: string; reason: string; description: string; requestedRefundFen?: number; evidenceUrls?: string[] }) {
    return request('/api/disputes', {
      method: 'POST',
      body: JSON.stringify({ ...payload, openerUserId: requireCurrentUserId() }),
    });
  },
  getAdminDashboard(adminUserId = requireCurrentUserId()) {
    return request<AdminDashboardResponse>(`/api/admin/dashboard${toQuery({ adminUserId })}`);
  },
  reviewProviderApplication(applicationId: string, status: string, reviewNote?: string) {
    return request(`/api/admin/provider-applications/${applicationId}/review`, {
      method: 'POST',
      body: JSON.stringify({ adminUserId: requireCurrentUserId(), status, reviewNote }),
    });
  },
};
