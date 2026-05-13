import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CaregiverSnapshot,
  Conversation,
  Demand,
  DriverSnapshot,
  LocationPoint,
  LocationSnapshot,
  MessageRecord,
  MessageType,
  Offer,
  OfferStatus,
  OrderEvent,
  OrderStatus,
  PaymentChannel,
  PaymentRecord,
  PaymentScene,
  ProviderProfile,
  RefundRecord,
  ReviewRecord,
  ServiceFeedbackRecord,
  ServiceOrder,
  ServiceType,
  UserProfile,
  VehicleProfile,
} from '@mimi/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '../../../');
const dataDir = path.join(root, 'data');
const domainDbPath = path.join(dataDir, 'domain.json');

export class DomainStoreError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export interface DomainDb {
  currentUserId: string;
  users: UserProfile[];
  providers: ProviderProfile[];
  vehicles: VehicleProfile[];
  demands: Demand[];
  offers: Offer[];
  orders: ServiceOrder[];
  orderEvents: OrderEvent[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  conversations: Conversation[];
  messages: MessageRecord[];
  reviews: ReviewRecord[];
  feedbacks: ServiceFeedbackRecord[];
  locations: LocationSnapshot[];
  updatedAt: string;
}

export interface DemandCreateInput {
  userId?: string;
  serviceType: ServiceType;
  title: string;
  description?: string;
  petSummary?: string;
  budgetMin?: number;
  budgetMax?: number;
  expectedPrice?: number;
  pickup?: LocationPoint;
  destination?: LocationPoint;
  serviceTime?: string;
  contactName?: string;
  contactPhone?: string;
  allowBargain?: boolean;
  visibilityRadiusKm?: number;
  careRequirements?: Demand['careRequirements'];
  rideRequirements?: Demand['rideRequirements'];
}

export interface OfferCreateInput {
  providerUserId?: string;
  quoteAmountFen: number;
  message?: string;
  etaMinutes?: number;
  vehicleId?: string;
  servicePlan?: string;
}

export interface PaymentCreateInput {
  orderId: string;
  channel: PaymentChannel;
  scene: PaymentScene;
}

export interface PaymentCreateResult {
  paymentId: string;
  status: PaymentRecord['status'];
  outTradeNo: string;
  channelPayload: {
    payUrl: string;
    appParams: Record<string, string>;
  };
  payment: PaymentRecord;
}

export interface ProviderApplyInput {
  services?: ServiceType[];
  intro?: string;
  serviceRadiusKm?: number;
  baseDistrict?: string;
  supportsHomeVisit?: boolean;
  supportsMedication?: boolean;
  supportsMultiDayCare?: boolean;
  vehicle?: Partial<VehicleProfile>;
}

export interface ReviewCreateInput {
  reviewerUserId?: string;
  revieweeUserId: string;
  overallScore: number;
  catCareScore?: number;
  petFriendlyScore?: number;
  drivingStabilityScore?: number;
  punctualityScore?: number;
  cleanlinessScore?: number;
  communicationScore?: number;
  feedbackCompletenessScore?: number;
  medicationAccuracyScore?: number;
  supportsPetHandlingScore?: number;
  tags?: string[];
  content?: string;
}

export interface FeedbackCreateInput {
  providerUserId?: string;
  arrivedAt?: string;
  leftAt?: string;
  note?: string;
  photoUrls?: string[];
  videoUrls?: string[];
}

export interface NearbyProviderResult {
  provider: ProviderProfile;
  user?: UserProfile;
  vehicle?: VehicleProfile;
  distanceKm: number | null;
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
  topTags: { tag: string; count: number }[];
}

export class DomainStore {
  async login(input: { nickname?: string; phone?: string; avatar?: string }): Promise<UserProfile> {
    return this.updateDb((db) => {
      const currentUser = this.requireCurrentUser(db);
      currentUser.nickname = cleanString(input.nickname) || currentUser.nickname;
      currentUser.phone = cleanString(input.phone) || currentUser.phone;
      currentUser.avatar = cleanString(input.avatar) || currentUser.avatar;
      return currentUser;
    });
  }

  async getCurrentUser(): Promise<UserProfile> {
    const db = await this.readDb();
    return this.requireCurrentUser(db);
  }

  async updateCurrentUser(input: Partial<UserProfile>): Promise<UserProfile> {
    return this.updateDb((db) => {
      const currentUser = this.requireCurrentUser(db);
      currentUser.nickname = cleanString(input.nickname) || currentUser.nickname;
      currentUser.phone = cleanString(input.phone) || currentUser.phone;
      currentUser.avatar = cleanString(input.avatar) || currentUser.avatar;
      currentUser.verified = typeof input.verified === 'boolean' ? input.verified : currentUser.verified;
      return currentUser;
    });
  }

  async getProvider(userId: string): Promise<{ user?: UserProfile; provider?: ProviderProfile; vehicles: VehicleProfile[] }> {
    const db = await this.readDb();
    return this.providerBundle(db, userId);
  }

  async listProviders(query: { serviceType?: string; district?: string } = {}): Promise<ProviderProfile[]> {
    const db = await this.readDb();
    return db.providers.filter((provider) => {
      if (query.serviceType && !provider.services.includes(query.serviceType as ServiceType)) return false;
      if (query.district && provider.baseDistrict !== query.district) return false;
      return provider.status === 'approved';
    });
  }

  async applyProvider(input: ProviderApplyInput): Promise<{ provider: ProviderProfile; vehicle?: VehicleProfile }> {
    return this.updateDb((db) => {
      const currentUser = this.requireCurrentUser(db);
      currentUser.role = 'provider';
      let provider = db.providers.find((item) => item.userId === currentUser.id);
      if (!provider) {
        provider = {
          userId: currentUser.id,
          status: 'pending',
          services: input.services?.length ? input.services : ['buddy'],
          intro: cleanString(input.intro) || '愿意为附近猫咪家庭提供帮助',
          serviceRadiusKm: positiveNumber(input.serviceRadiusKm, 8),
          baseDistrict: cleanString(input.baseDistrict) || '拱墅区',
          score: 0,
          completedOrderCount: 0,
          supportsHomeVisit: Boolean(input.supportsHomeVisit),
          supportsMedication: Boolean(input.supportsMedication),
          supportsMultiDayCare: Boolean(input.supportsMultiDayCare),
          supportsEmergencyOrder: false,
          catCareTags: [],
        };
        db.providers.push(provider);
      } else {
        this.assignProvider(provider, input);
      }

      let vehicle: VehicleProfile | undefined;
      if (input.vehicle) {
        vehicle = this.upsertVehicle(db, currentUser.id, input.vehicle);
      }
      return { provider, vehicle };
    });
  }

  async updateProvider(input: ProviderApplyInput): Promise<{ provider: ProviderProfile; vehicle?: VehicleProfile }> {
    return this.updateDb((db) => {
      const currentUser = this.requireCurrentUser(db);
      const provider = db.providers.find((item) => item.userId === currentUser.id);
      if (!provider) throw new DomainStoreError(404, 'provider profile not found');
      this.assignProvider(provider, input);
      const vehicle = input.vehicle ? this.upsertVehicle(db, currentUser.id, input.vehicle) : undefined;
      return { provider, vehicle };
    });
  }

  async createDemand(input: DemandCreateInput): Promise<Demand> {
    return this.updateDb((db) => {
      const currentUser = this.requireCurrentUser(db);
      const now = new Date().toISOString();
      const demand: Demand = {
        id: randomUUID(),
        userId: input.userId || currentUser.id,
        serviceType: input.serviceType,
        title: cleanString(input.title) || '新的咪咪出行需求',
        description: cleanString(input.description) || '',
        petSummary: cleanString(input.petSummary) || '',
        budgetMin: nonNegativeInteger(input.budgetMin, 0),
        budgetMax: nonNegativeInteger(input.budgetMax, nonNegativeInteger(input.expectedPrice, 0)),
        expectedPrice: input.expectedPrice,
        pickup: input.pickup,
        destination: input.destination,
        serviceTime: input.serviceTime || now,
        contactName: cleanString(input.contactName) || currentUser.nickname,
        contactPhone: cleanString(input.contactPhone) || currentUser.phone,
        allowBargain: Boolean(input.allowBargain),
        visibilityRadiusKm: positiveNumber(input.visibilityRadiusKm, 5),
        careRequirements: input.careRequirements,
        rideRequirements: input.rideRequirements,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      if (demand.budgetMax < demand.budgetMin) demand.budgetMax = demand.budgetMin;
      db.demands.push(demand);
      return demand;
    });
  }

  async listDemands(query: Record<string, string | undefined>): Promise<Demand[]> {
    const db = await this.readDb();
    const page = positiveNumber(Number(query.page), 1);
    const pageSize = Math.min(positiveNumber(Number(query.pageSize), 20), 50);
    const filtered = db.demands
      .filter((demand) => {
        if (query.serviceType && demand.serviceType !== query.serviceType) return false;
        if (query.district && demand.pickup?.district !== query.district) return false;
        if (query.status && demand.status !== query.status) return false;
        if (query.petFriendly === 'true' && !demand.rideRequirements?.requirePetFriendlyVehicle) return false;
        if (query.supportsCrate === 'true' && demand.rideRequirements?.carrierType !== 'crate') return false;
        if (query.supportsMultiPet === 'true' && !demand.rideRequirements?.petCount) return false;
        if (query.supportsMedication === 'true' && !demand.careRequirements?.needMedication) return false;
        if (query.supportsHomeVisit === 'true' && !demand.careRequirements?.needHomeVisit) return false;
        if (query.supportsMultiDayCare === 'true' && !demand.careRequirements?.needMultiDayCare) return false;
        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }

  async getDemand(demandId: string): Promise<Demand | undefined> {
    const db = await this.readDb();
    return db.demands.find((demand) => demand.id === demandId);
  }

  async cancelDemand(demandId: string, operatorUserId?: string): Promise<Demand> {
    return this.updateDb((db) => {
      const demand = this.requireDemand(db, demandId);
      const operatorId = operatorUserId || db.currentUserId;
      if (operatorId !== demand.userId) {
        throw new DomainStoreError(403, 'only demand owner can cancel demand');
      }
      if (['completed', 'cancelled'].includes(demand.status)) {
        throw new DomainStoreError(409, 'demand can not be cancelled in current status');
      }
      const now = new Date().toISOString();
      demand.status = 'cancelled';
      demand.updatedAt = now;
      db.offers
        .filter((offer) => offer.demandId === demandId && offer.status === 'submitted')
        .forEach((offer) => {
          offer.status = 'rejected';
        });
      db.orders
        .filter((order) => order.demandId === demandId && !['completed', 'cancelled', 'refunded'].includes(order.status))
        .forEach((order) => {
          order.status = 'cancelled';
          order.updatedAt = now;
          this.pushOrderEvent(db, order.id, 'order_cancelled_by_demand', operatorId, { demandId });
          const conversation = this.ensureConversation(db, demand.id, order.id, [order.buyerUserId, order.sellerUserId]);
          this.pushConversationMessage(db, conversation.id, operatorId, 'system', {
            content: '需求已取消，相关订单已关闭。',
            relatedDemandId: demand.id,
            createdAt: now,
          });
        });
      return demand;
    });
  }

  async createOffer(demandId: string, input: OfferCreateInput): Promise<Offer> {
    return this.updateDb((db) => {
      const demand = this.requireDemand(db, demandId);
      if (demand.status !== 'open') throw new DomainStoreError(409, 'demand is not open');
      const providerUserId = input.providerUserId || this.defaultProviderUserId(db, demand.serviceType);
      if (!db.providers.some((provider) => provider.userId === providerUserId)) {
        throw new DomainStoreError(404, 'provider not found');
      }
      const duplicated = db.offers.find(
        (offer) =>
          offer.demandId === demandId &&
          offer.providerUserId === providerUserId &&
          ['submitted', 'accepted'].includes(offer.status),
      );
      if (duplicated) {
        throw new DomainStoreError(409, 'provider already has an active offer for this demand');
      }
      const createdAt = new Date().toISOString();
      const offer: Offer = {
        id: randomUUID(),
        demandId,
        providerUserId,
        quoteAmountFen: nonNegativeInteger(input.quoteAmountFen, demand.expectedPrice ?? demand.budgetMax),
        message: cleanString(input.message) || undefined,
        etaMinutes: input.etaMinutes,
        vehicleId: input.vehicleId,
        servicePlan: cleanString(input.servicePlan) || undefined,
        status: 'submitted',
        createdAt,
      };
      db.offers.push(offer);
      const conversation = this.ensureConversation(db, demand.id, undefined, [demand.userId, providerUserId]);
      this.pushConversationMessage(db, conversation.id, providerUserId, 'offer', {
        content: `已提交报价：¥${(offer.quoteAmountFen / 100).toFixed(2)}，${
          cleanString(input.message) || '可立即沟通服务细节'
        }`,
        relatedDemandId: demand.id,
        createdAt,
      });
      return offer;
    });
  }

  async listOffers(demandId: string): Promise<Offer[]> {
    const db = await this.readDb();
    this.requireDemand(db, demandId);
    return db.offers.filter((offer) => offer.demandId === demandId);
  }

  async acceptOffer(offerId: string, operatorUserId?: string): Promise<{ offer: Offer; order: ServiceOrder }> {
    return this.updateDb((db) => {
      const offer = this.requireOffer(db, offerId);
      if (offer.status !== 'submitted') throw new DomainStoreError(409, 'offer is not submitted');
      const demand = this.requireDemand(db, offer.demandId);
      if (demand.status !== 'open') throw new DomainStoreError(409, 'demand is not open');
      const operatorId = operatorUserId || db.currentUserId;
      if (operatorId !== demand.userId) {
        throw new DomainStoreError(403, 'only demand owner can accept offer');
      }
      const now = new Date().toISOString();
      offer.status = 'accepted';
      db.offers
        .filter((item) => item.demandId === demand.id && item.id !== offer.id && item.status === 'submitted')
        .forEach((item) => {
          item.status = 'rejected';
      });
      demand.status = 'matched';
      demand.selectedOfferId = offer.id;
      demand.updatedAt = now;
      const order = this.createOrderFromAcceptedOffer(db, demand, offer, now);
      this.pushOrderEvent(db, order.id, 'offer_accepted', operatorId, { offerId });
      const conversation = this.ensureConversation(db, demand.id, order.id, [demand.userId, offer.providerUserId]);
      this.pushConversationMessage(db, conversation.id, operatorId, 'system', {
        content: `需求已选中服务者，订单已生成，待支付定金。`,
        relatedDemandId: demand.id,
        createdAt: now,
      });
      return { offer, order };
    });
  }

  async updateOfferStatus(offerId: string, nextStatus: Exclude<OfferStatus, 'accepted'>): Promise<Offer> {
    return this.updateDb((db) => {
      const offer = this.requireOffer(db, offerId);
      if (offer.status !== 'submitted') throw new DomainStoreError(409, 'offer is not submitted');
      offer.status = nextStatus;
      return offer;
    });
  }

  async listOrders(query: { userId?: string; status?: string } = {}): Promise<ServiceOrder[]> {
    const db = await this.readDb();
    const currentUser = this.requireCurrentUser(db);
    const targetUserId = query.userId || currentUser.id;
    if (targetUserId !== currentUser.id) {
      throw new DomainStoreError(403, 'can not query other user orders');
    }
    return db.orders
      .filter((order) => {
        if (order.buyerUserId !== targetUserId && order.sellerUserId !== targetUserId) return false;
        if (query.status && order.status !== query.status) return false;
        return true;
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async getOrder(orderId: string): Promise<ServiceOrder | undefined> {
    const db = await this.readDb();
    const order = db.orders.find((item) => item.id === orderId);
    if (!order) return undefined;
    this.ensureOrderAccessible(order, db.currentUserId);
    return order;
  }

  async transitionOrder(orderId: string, action: 'confirm-arrival' | 'start-service' | 'complete' | 'cancel', operatorUserId?: string): Promise<ServiceOrder> {
    return this.updateDb((db) => {
      const order = this.requireOrder(db, orderId);
      const operatorId = operatorUserId || db.currentUserId;
      this.ensureOrderAccessible(order, operatorId);
      const nextStatus = this.nextOrderStatus(order.status, action);
      const now = new Date().toISOString();
      order.status = nextStatus;
      order.updatedAt = now;
      const demand = db.demands.find((item) => item.id === order.demandId);
      if (demand) {
        demand.updatedAt = now;
        if (nextStatus === 'serving') demand.status = 'in_service';
        if (nextStatus === 'completed') demand.status = 'completed';
        if (nextStatus === 'cancelled') demand.status = 'cancelled';
      }
      this.pushOrderEvent(db, order.id, `order_${action.replace('-', '_')}`, operatorId);
      const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
      this.pushConversationMessage(db, conversation.id, operatorId, 'system', {
        content: this.orderTransitionMessage(nextStatus),
        relatedDemandId: order.demandId,
        createdAt: now,
      });
      return order;
    });
  }

  async listOrderEvents(orderId: string): Promise<OrderEvent[]> {
    const db = await this.readDb();
    const order = this.requireOrder(db, orderId);
    this.ensureOrderAccessible(order, db.currentUserId);
    return db.orderEvents
      .filter((event) => event.orderId === orderId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    return this.updateDb((db) => {
      const order = this.requireOrder(db, input.orderId);
      this.ensureOrderAccessible(order, db.currentUserId);
      if (['cancelled', 'refunded'].includes(order.status)) {
        throw new DomainStoreError(409, 'order can not be paid in current status');
      }
      const existing = db.payments.find(
        (payment) =>
          payment.orderId === order.id &&
          payment.scene === input.scene &&
          ['created', 'pending', 'paid'].includes(payment.status),
      );
      if (existing) {
        return this.paymentCreateResult(existing);
      }
      const now = new Date().toISOString();
      const amountFen = input.scene === 'deposit' ? order.depositFen ?? order.amountFen : order.amountFen;
      const outTradeNo = `MIMI${Date.now()}${String(db.payments.length + 1).padStart(4, '0')}`;
      const payment: PaymentRecord = {
        id: randomUUID(),
        orderId: order.id,
        channel: input.channel,
        scene: input.scene,
        amountFen,
        currency: 'CNY',
        status: 'pending',
        outTradeNo,
        createdAt: now,
        updatedAt: now,
      };
      db.payments.push(payment);
      this.pushOrderEvent(db, order.id, 'payment_created', undefined, { paymentId: payment.id });
      const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
      this.pushConversationMessage(db, conversation.id, db.currentUserId, 'payment', {
        content: `支付单已创建，待支付 ¥${(amountFen / 100).toFixed(2)}。`,
        relatedDemandId: order.demandId,
        createdAt: now,
      });
      return this.paymentCreateResult(payment);
    });
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | undefined> {
    const db = await this.readDb();
    const payment = db.payments.find((item) => item.id === paymentId);
    if (!payment) return undefined;
    this.ensurePaymentAccessible(db, payment, db.currentUserId);
    return payment;
  }

  async getPaymentByOutTradeNo(outTradeNo: string): Promise<PaymentRecord | undefined> {
    const db = await this.readDb();
    return db.payments.find((payment) => payment.outTradeNo === outTradeNo);
  }

  async markPaymentPaid(paymentId: string, providerTradeNo?: string, rawNotify?: unknown): Promise<PaymentRecord> {
    return this.updateDb((db) => {
      const payment = this.requirePayment(db, paymentId);
      this.ensurePaymentAccessible(db, payment, db.currentUserId);
      return this.markPaymentPaidInDb(db, payment, providerTradeNo, rawNotify);
    });
  }

  async markPaymentPaidByOutTradeNo(outTradeNo: string, providerTradeNo?: string, rawNotify?: unknown): Promise<PaymentRecord> {
    return this.updateDb((db) => {
      const payment = db.payments.find((item) => item.outTradeNo === outTradeNo);
      if (!payment) throw new DomainStoreError(404, 'payment not found');
      return this.markPaymentPaidInDb(db, payment, providerTradeNo, rawNotify);
    });
  }

  async refundPayment(paymentId: string, reason?: string): Promise<{ payment: PaymentRecord; refund: RefundRecord }> {
    return this.updateDb((db) => {
      const payment = this.requirePayment(db, paymentId);
      this.ensurePaymentAccessible(db, payment, db.currentUserId);
      if (!['paid', 'partial_refunded'].includes(payment.status)) {
        throw new DomainStoreError(409, 'only paid payment can be refunded');
      }
      const order = this.requireOrder(db, payment.orderId);
      const now = new Date().toISOString();
      const refund: RefundRecord = {
        id: randomUUID(),
        paymentId: payment.id,
        orderId: order.id,
        refundAmountFen: payment.amountFen,
        status: 'success',
        providerRefundNo: `RF${Date.now()}`,
        reason: cleanString(reason) || '用户申请退款',
        createdAt: now,
        updatedAt: now,
      };
      db.refunds.push(refund);
      payment.status = 'refunded';
      payment.updatedAt = now;
      order.status = 'refunded';
      order.updatedAt = now;
      const demand = db.demands.find((item) => item.id === order.demandId);
      if (demand) {
        demand.status = 'refunding';
        demand.updatedAt = now;
      }
      this.pushOrderEvent(db, order.id, 'payment_refunded', undefined, { paymentId: payment.id, refundId: refund.id });
      const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
      this.pushConversationMessage(db, conversation.id, db.currentUserId, 'payment', {
        content: `退款已发起，金额 ¥${(refund.refundAmountFen / 100).toFixed(2)}。`,
        relatedDemandId: order.demandId,
        createdAt: now,
      });
      return { payment, refund };
    });
  }

  async listConversations(): Promise<Conversation[]> {
    const db = await this.readDb();
    return db.conversations
      .filter((conversation) => conversation.participantUserIds.includes(db.currentUserId))
      .sort((left, right) => right.lastMessageAt.localeCompare(left.lastMessageAt));
  }

  async getConversation(conversationId: string): Promise<{ conversation: Conversation; messages: MessageRecord[] }> {
    const db = await this.readDb();
    const conversation = db.conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new DomainStoreError(404, 'conversation not found');
    if (!conversation.participantUserIds.includes(db.currentUserId)) {
      throw new DomainStoreError(403, 'conversation access denied');
    }
    const messages = db.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    return { conversation, messages };
  }

  async sendMessage(conversationId: string, input: { senderUserId?: string; type?: MessageType; content?: string; relatedDemandId?: string }): Promise<MessageRecord> {
    return this.updateDb((db) => {
      const conversation = db.conversations.find((item) => item.id === conversationId);
      if (!conversation) throw new DomainStoreError(404, 'conversation not found');
      const senderUserId = input.senderUserId || db.currentUserId;
      if (senderUserId !== db.currentUserId) {
        throw new DomainStoreError(403, 'sender user mismatch');
      }
      if (!conversation.participantUserIds.includes(senderUserId)) {
        throw new DomainStoreError(403, 'sender is not in conversation');
      }
      return this.pushConversationMessage(db, conversationId, senderUserId, input.type || 'text', {
        content: cleanString(input.content) || '',
        relatedDemandId: input.relatedDemandId,
      });
    });
  }

  async createReview(orderId: string, input: ReviewCreateInput): Promise<ReviewRecord> {
    return this.updateDb((db) => {
      const order = this.requireOrder(db, orderId);
      this.ensureOrderAccessible(order, db.currentUserId);
      const reviewerUserId = input.reviewerUserId || db.currentUserId;
      if (reviewerUserId !== db.currentUserId) {
        throw new DomainStoreError(403, 'reviewer user mismatch');
      }
      const allowedRevieweeUserId =
        reviewerUserId === order.buyerUserId ? order.sellerUserId : reviewerUserId === order.sellerUserId ? order.buyerUserId : undefined;
      if (!allowedRevieweeUserId) {
        throw new DomainStoreError(403, 'reviewer is not order participant');
      }
      if (input.revieweeUserId !== allowedRevieweeUserId) {
        throw new DomainStoreError(403, 'reviewee must be the other participant of the order');
      }
      if (!db.users.some((user) => user.id === input.revieweeUserId)) {
        throw new DomainStoreError(404, 'reviewee not found');
      }
      const duplicated = db.reviews.find(
        (review) => review.orderId === order.id && review.reviewerUserId === reviewerUserId,
      );
      if (duplicated) {
        throw new DomainStoreError(409, 'review already submitted for this order');
      }
      const review: ReviewRecord = {
        id: randomUUID(),
        orderId: order.id,
        reviewerUserId,
        revieweeUserId: input.revieweeUserId,
        overallScore: clampScore(input.overallScore),
        catCareScore: optionalScore(input.catCareScore),
        petFriendlyScore: optionalScore(input.petFriendlyScore),
        drivingStabilityScore: optionalScore(input.drivingStabilityScore),
        punctualityScore: optionalScore(input.punctualityScore),
        cleanlinessScore: optionalScore(input.cleanlinessScore),
        communicationScore: optionalScore(input.communicationScore),
        feedbackCompletenessScore: optionalScore(input.feedbackCompletenessScore),
        medicationAccuracyScore: optionalScore(input.medicationAccuracyScore),
        supportsPetHandlingScore: optionalScore(input.supportsPetHandlingScore),
        tags: input.tags || [],
        content: cleanString(input.content) || undefined,
        createdAt: new Date().toISOString(),
      };
      db.reviews.push(review);
      return review;
    });
  }

  async listReviewsForProvider(providerUserId: string): Promise<ReviewRecord[]> {
    const db = await this.readDb();
    return db.reviews.filter((review) => review.revieweeUserId === providerUserId);
  }

  async summarizeReviews(providerUserId: string): Promise<ReviewSummary> {
    const reviews = await this.listReviewsForProvider(providerUserId);
    const tagCounts = new Map<string, number>();
    reviews.forEach((review) => {
      review.tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
    });
    return {
      providerUserId,
      overallScore: average(reviews.map((review) => review.overallScore)) || 0,
      reviewCount: reviews.length,
      catCareScore: average(reviews.map((review) => review.catCareScore)),
      petFriendlyScore: average(reviews.map((review) => review.petFriendlyScore)),
      drivingStabilityScore: average(reviews.map((review) => review.drivingStabilityScore)),
      punctualityScore: average(reviews.map((review) => review.punctualityScore)),
      cleanlinessScore: average(reviews.map((review) => review.cleanlinessScore)),
      communicationScore: average(reviews.map((review) => review.communicationScore)),
      feedbackCompletenessScore: average(reviews.map((review) => review.feedbackCompletenessScore)),
      medicationAccuracyScore: average(reviews.map((review) => review.medicationAccuracyScore)),
      topTags: [...tagCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
    };
  }

  async createFeedback(orderId: string, input: FeedbackCreateInput): Promise<ServiceFeedbackRecord> {
    return this.updateDb((db) => {
      const order = this.requireOrder(db, orderId);
      this.ensureOrderAccessible(order, db.currentUserId);
      const providerUserId = input.providerUserId || order.sellerUserId;
      if (providerUserId !== order.sellerUserId) {
        throw new DomainStoreError(403, 'feedback provider must match order seller');
      }
      const feedback: ServiceFeedbackRecord = {
        id: randomUUID(),
        orderId: order.id,
        providerUserId,
        arrivedAt: input.arrivedAt,
        leftAt: input.leftAt,
        note: cleanString(input.note) || undefined,
        photoUrls: input.photoUrls || [],
        videoUrls: input.videoUrls || [],
        createdAt: new Date().toISOString(),
      };
      db.feedbacks.push(feedback);
      const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
      this.pushConversationMessage(db, conversation.id, providerUserId, 'service_feedback', {
        content: cleanString(input.note) || '服务反馈已提交，可查看到店/离店与图片记录。',
        relatedDemandId: order.demandId,
        createdAt: feedback.createdAt,
      });
      return feedback;
    });
  }

  async listFeedback(orderId: string): Promise<ServiceFeedbackRecord[]> {
    const db = await this.readDb();
    const order = this.requireOrder(db, orderId);
    this.ensureOrderAccessible(order, db.currentUserId);
    return db.feedbacks
      .filter((feedback) => feedback.orderId === orderId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async reportLocation(input: { orderId?: string; userId?: string; lat: number; lng: number; address?: string; coordSystem?: LocationSnapshot['coordSystem'] }): Promise<LocationSnapshot> {
    return this.updateDb((db) => {
      const reporterUserId = input.userId || db.currentUserId;
      if (reporterUserId !== db.currentUserId) {
        throw new DomainStoreError(403, 'can not report location for another user');
      }
      let order: ServiceOrder | undefined;
      if (input.orderId) {
        order = this.requireOrder(db, input.orderId);
        this.ensureOrderAccessible(order, reporterUserId);
      }
      const createdAt = new Date().toISOString();
      const snapshot: LocationSnapshot = {
        id: randomUUID(),
        orderId: input.orderId,
        userId: reporterUserId,
        lat: input.lat,
        lng: input.lng,
        address: cleanString(input.address) || undefined,
        coordSystem: input.coordSystem || 'gcj02',
        createdAt,
      };
      db.locations.push(snapshot);
      if (order) {
        const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
        this.pushConversationMessage(db, conversation.id, reporterUserId, 'location', {
          content: snapshot.address ? `已上报位置：${snapshot.address}` : '已上报实时位置',
          relatedDemandId: order.demandId,
          createdAt,
        });
      }
      return snapshot;
    });
  }

  async nearbyProviders(input: { lat?: number; lng?: number; district?: string; radiusKm?: number; serviceType?: string }): Promise<NearbyProviderResult[]> {
    const db = await this.readDb();
    const radiusKm = positiveNumber(input.radiusKm, 10);
    return db.providers
      .filter((provider) => provider.status === 'approved')
      .filter((provider) => !input.serviceType || provider.services.includes(input.serviceType as ServiceType))
      .filter((provider) => !input.district || provider.baseDistrict === input.district)
      .map((provider) => {
        const distanceKm = estimateProviderDistance(provider, input.lat, input.lng);
        return {
          provider,
          user: db.users.find((user) => user.id === provider.userId),
          vehicle: db.vehicles.find((vehicle) => vehicle.userId === provider.userId),
          distanceKm,
        };
      })
      .filter((item) => item.distanceKm === null || item.distanceKm <= radiusKm)
      .sort((left, right) => (left.distanceKm ?? Number.MAX_SAFE_INTEGER) - (right.distanceKm ?? Number.MAX_SAFE_INTEGER));
  }

  private async readDb(): Promise<DomainDb> {
    await fs.mkdir(dataDir, { recursive: true });
    try {
      const raw = await fs.readFile(domainDbPath, 'utf8');
      return normalizeDb(JSON.parse(raw) as Partial<DomainDb>);
    } catch {
      const db = createDefaultDomainDb();
      await this.writeDb(db);
      return db;
    }
  }

  private async updateDb<T>(mutator: (db: DomainDb) => T): Promise<T> {
    const db = await this.readDb();
    const result = mutator(db);
    db.updatedAt = new Date().toISOString();
    await this.writeDb(db);
    return result;
  }

  private async writeDb(db: DomainDb): Promise<void> {
    const tempPath = `${domainDbPath}.${process.pid}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(db, null, 2));
    await fs.rename(tempPath, domainDbPath);
  }

  private requireCurrentUser(db: DomainDb): UserProfile {
    const currentUser = db.users.find((user) => user.id === db.currentUserId);
    if (!currentUser) throw new DomainStoreError(500, 'current user not found');
    return currentUser;
  }

  private requireDemand(db: DomainDb, demandId: string): Demand {
    const demand = db.demands.find((item) => item.id === demandId);
    if (!demand) throw new DomainStoreError(404, 'demand not found');
    return demand;
  }

  private requireOffer(db: DomainDb, offerId: string): Offer {
    const offer = db.offers.find((item) => item.id === offerId);
    if (!offer) throw new DomainStoreError(404, 'offer not found');
    return offer;
  }

  private requireOrder(db: DomainDb, orderId: string): ServiceOrder {
    const order = db.orders.find((item) => item.id === orderId);
    if (!order) throw new DomainStoreError(404, 'order not found');
    return order;
  }

  private requirePayment(db: DomainDb, paymentId: string): PaymentRecord {
    const payment = db.payments.find((item) => item.id === paymentId);
    if (!payment) throw new DomainStoreError(404, 'payment not found');
    return payment;
  }

  private assignProvider(provider: ProviderProfile, input: ProviderApplyInput): void {
    if (input.services?.length) provider.services = input.services;
    if (typeof input.intro === 'string') provider.intro = input.intro;
    if (input.serviceRadiusKm !== undefined) provider.serviceRadiusKm = positiveNumber(input.serviceRadiusKm, provider.serviceRadiusKm);
    if (typeof input.baseDistrict === 'string') provider.baseDistrict = input.baseDistrict;
    if (typeof input.supportsHomeVisit === 'boolean') provider.supportsHomeVisit = input.supportsHomeVisit;
    if (typeof input.supportsMedication === 'boolean') provider.supportsMedication = input.supportsMedication;
    if (typeof input.supportsMultiDayCare === 'boolean') provider.supportsMultiDayCare = input.supportsMultiDayCare;
  }

  private upsertVehicle(db: DomainDb, userId: string, input: Partial<VehicleProfile>): VehicleProfile {
    let vehicle = db.vehicles.find((item) => item.userId === userId);
    if (!vehicle) {
      vehicle = {
        id: randomUUID(),
        userId,
        vehicleType: input.vehicleType || 'economy',
        plateMasked: input.plateMasked || '浙A****',
        seats: input.seats || 4,
        trunkLevel: input.trunkLevel || 'medium',
        supportsCatBag: Boolean(input.supportsCatBag),
        supportsCrate: Boolean(input.supportsCrate),
        supportsStroller: Boolean(input.supportsStroller),
        supportsMultiPet: Boolean(input.supportsMultiPet),
        petFriendly: Boolean(input.petFriendly),
        petFriendlyTags: input.petFriendlyTags || [],
      };
      db.vehicles.push(vehicle);
    } else {
      Object.assign(vehicle, input);
    }
    return vehicle;
  }

  private providerBundle(db: DomainDb, userId: string): { user?: UserProfile; provider?: ProviderProfile; vehicles: VehicleProfile[] } {
    return {
      user: db.users.find((user) => user.id === userId),
      provider: db.providers.find((provider) => provider.userId === userId),
      vehicles: db.vehicles.filter((vehicle) => vehicle.userId === userId),
    };
  }

  private defaultProviderUserId(db: DomainDb, serviceType: ServiceType): string {
    const provider = db.providers.find((item) => item.status === 'approved' && item.services.includes(serviceType));
    if (!provider) throw new DomainStoreError(404, 'no provider supports this service type');
    return provider.userId;
  }

  private createOrderFromAcceptedOffer(db: DomainDb, demand: Demand, offer: Offer, now: string): ServiceOrder {
    const existing = db.orders.find((order) => order.demandId === demand.id && order.sellerUserId === offer.providerUserId);
    if (existing) return existing;
    const provider = db.providers.find((item) => item.userId === offer.providerUserId);
    const user = db.users.find((item) => item.id === offer.providerUserId);
    const vehicle = offer.vehicleId
      ? db.vehicles.find((item) => item.id === offer.vehicleId)
      : db.vehicles.find((item) => item.userId === offer.providerUserId);
    const order: ServiceOrder = {
      id: randomUUID(),
      demandId: demand.id,
      buyerUserId: demand.userId,
      sellerUserId: offer.providerUserId,
      title: demand.title,
      amountFen: offer.quoteAmountFen,
      depositFen: Math.min(offer.quoteAmountFen, Math.ceil(offer.quoteAmountFen * 0.3)),
      status: 'pending_payment',
      serviceTime: demand.serviceTime,
      pickup: demand.pickup,
      destination: demand.destination,
      vehicleId: vehicle?.id,
      driverSnapshot: provider && vehicle ? buildDriverSnapshot(provider, user, vehicle) : undefined,
      caregiverSnapshot: provider ? buildCaregiverSnapshot(provider, user) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.orders.push(order);
    this.ensureConversation(db, demand.id, order.id, [demand.userId, offer.providerUserId]);
    return order;
  }

  private nextOrderStatus(currentStatus: OrderStatus, action: 'confirm-arrival' | 'start-service' | 'complete' | 'cancel'): OrderStatus {
    if (action === 'cancel') {
      if (['completed', 'refunded'].includes(currentStatus)) throw new DomainStoreError(409, 'order can not be cancelled');
      return 'cancelled';
    }
    if (action === 'confirm-arrival') {
      if (!['paid', 'confirmed'].includes(currentStatus)) throw new DomainStoreError(409, 'order is not ready for arrival confirmation');
      return 'arriving';
    }
    if (action === 'start-service') {
      if (!['paid', 'confirmed', 'arriving'].includes(currentStatus)) throw new DomainStoreError(409, 'order is not ready to start service');
      return 'serving';
    }
    if (!['paid', 'confirmed', 'arriving', 'serving'].includes(currentStatus)) throw new DomainStoreError(409, 'order is not ready to complete');
    return 'completed';
  }

  private pushOrderEvent(db: DomainDb, orderId: string, eventType: string, operatorUserId?: string, payload?: Record<string, unknown>): void {
    db.orderEvents.push({
      id: randomUUID(),
      orderId,
      eventType,
      operatorUserId,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  private pushConversationMessage(
    db: DomainDb,
    conversationId: string,
    senderUserId: string,
    type: MessageType,
    input: { content: string; relatedDemandId?: string; createdAt?: string },
  ): MessageRecord {
    const conversation = db.conversations.find((item) => item.id === conversationId);
    if (!conversation) throw new DomainStoreError(404, 'conversation not found');
    const createdAt = input.createdAt || new Date().toISOString();
    const message: MessageRecord = {
      id: randomUUID(),
      conversationId,
      senderUserId,
      type,
      content: input.content,
      relatedDemandId: input.relatedDemandId,
      createdAt,
    };
    db.messages.push(message);
    conversation.lastMessageAt = createdAt;
    return message;
  }

  private ensureConversation(db: DomainDb, demandId: string, orderId: string | undefined, participantUserIds: string[]): Conversation {
    const existing = db.conversations.find((conversation) => {
      if (orderId && conversation.orderId === orderId) return true;
      return conversation.demandId === demandId && sameParticipants(conversation.participantUserIds, participantUserIds);
    });
    if (existing) {
      if (orderId) existing.orderId = orderId;
      return existing;
    }
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: randomUUID(),
      demandId,
      orderId,
      participantUserIds: [...new Set(participantUserIds)],
      lastMessageAt: now,
    };
    db.conversations.push(conversation);
    return conversation;
  }

  private paymentCreateResult(payment: PaymentRecord): PaymentCreateResult {
    return {
      paymentId: payment.id,
      status: payment.status,
      outTradeNo: payment.outTradeNo,
      channelPayload: {
        payUrl: `mimi-travel://pay/${payment.outTradeNo}`,
        appParams: {
          outTradeNo: payment.outTradeNo,
          channel: payment.channel,
          amountFen: String(payment.amountFen),
        },
      },
      payment,
    };
  }

  private ensureOrderAccessible(order: ServiceOrder, userId: string): void {
    if (order.buyerUserId !== userId && order.sellerUserId !== userId) {
      throw new DomainStoreError(403, 'order access denied');
    }
  }

  private ensurePaymentAccessible(db: DomainDb, payment: PaymentRecord, userId: string): void {
    const order = this.requireOrder(db, payment.orderId);
    this.ensureOrderAccessible(order, userId);
  }

  private orderTransitionMessage(status: OrderStatus): string {
    switch (status) {
      case 'arriving':
        return '服务者已确认到达，建议尽快开始服务。';
      case 'serving':
        return '订单已进入服务中，请留意消息和反馈。';
      case 'completed':
        return '订单已完成，可提交评价与服务反馈。';
      case 'cancelled':
        return '订单已取消，如已支付请关注退款进度。';
      default:
        return `订单状态已更新为 ${status}。`;
    }
  }

  private markPaymentPaidInDb(db: DomainDb, payment: PaymentRecord, providerTradeNo?: string, rawNotify?: unknown): PaymentRecord {
    if (payment.status === 'paid') {
      return payment;
    }
    if (['refunded', 'partial_refunded'].includes(payment.status)) {
      throw new DomainStoreError(409, 'payment can not be marked paid in current status');
    }
    const now = new Date().toISOString();
    payment.status = 'paid';
    payment.providerTradeNo = providerTradeNo || payment.providerTradeNo || `SIM${Date.now()}`;
    payment.rawNotify = rawNotify ? JSON.stringify(rawNotify).slice(0, 1000) : payment.rawNotify;
    payment.paidAt = now;
    payment.updatedAt = now;
    const order = this.requireOrder(db, payment.orderId);
    order.status = 'paid';
    order.updatedAt = now;
    const demand = db.demands.find((item) => item.id === order.demandId);
    if (demand) {
      demand.status = 'paid';
      demand.updatedAt = now;
    }
    this.pushOrderEvent(db, order.id, 'payment_paid', undefined, { paymentId: payment.id });
    const conversation = this.ensureConversation(db, order.demandId, order.id, [order.buyerUserId, order.sellerUserId]);
    this.pushConversationMessage(db, conversation.id, order.buyerUserId, 'payment', {
      content: `支付成功，金额 ¥${(payment.amountFen / 100).toFixed(2)}。`,
      relatedDemandId: order.demandId,
      createdAt: now,
    });
    return payment;
  }
}

function createDefaultDomainDb(): DomainDb {
  const now = new Date().toISOString();
  return {
    currentUserId: 'user_demo',
    users: [
      {
        id: 'user_demo',
        nickname: '咪咪主人',
        phone: '13800000000',
        avatar: '🐱',
        role: 'customer',
        verified: true,
        createdAt: now,
      },
      {
        id: 'provider_caregiver_001',
        nickname: '小满陪咪',
        phone: '13900000001',
        avatar: '😺',
        role: 'provider',
        verified: true,
        createdAt: now,
      },
      {
        id: 'provider_driver_001',
        nickname: '阿航宠物车',
        phone: '13900000002',
        avatar: '🚗',
        role: 'provider',
        verified: true,
        createdAt: now,
      },
    ],
    providers: [
      {
        userId: 'provider_caregiver_001',
        status: 'approved',
        services: ['buddy', 'feeding', 'cleaning', 'playtime', 'medication', 'multi_day_care'],
        intro: '三年多猫家庭照护经验，支持上门喂药和照片反馈。',
        serviceRadiusKm: 12,
        baseDistrict: '拱墅区',
        score: 4.8,
        completedOrderCount: 126,
        catCareScore: 4.9,
        communicationScore: 4.8,
        punctualityScore: 4.7,
        emergencyHandlingScore: 4.6,
        supportsHomeVisit: true,
        supportsMedication: true,
        supportsMultiDayCare: true,
        supportsEmergencyOrder: true,
        catCareTags: ['多猫家庭', '喂药熟练', '拍照细致'],
      },
      {
        userId: 'provider_driver_001',
        status: 'approved',
        services: ['taxi', 'ride', 'pet_friendly_taxi', 'escort'],
        intro: '宠物友好司机，车内常备尿垫、除味喷雾和固定带。',
        serviceRadiusKm: 20,
        baseDistrict: '萧山区',
        score: 4.7,
        completedOrderCount: 214,
        petFriendlyScore: 4.9,
        drivingStabilityScore: 4.8,
        cleanlinessScore: 4.8,
        punctualityScore: 4.7,
        supportsEmergencyOrder: true,
        catCareTags: ['宠物友好', '驾驶平稳'],
      },
    ],
    vehicles: [
      {
        id: 'vehicle_driver_001',
        userId: 'provider_driver_001',
        vehicleType: 'suv',
        plateMasked: '浙A·8***M',
        seats: 5,
        trunkLevel: 'large',
        supportsCatBag: true,
        supportsCrate: true,
        supportsStroller: true,
        supportsMultiPet: true,
        petFriendly: true,
        petFriendlyTags: ['支持航空箱', '低异味', '大空间'],
      },
    ],
    demands: [],
    offers: [],
    orders: [],
    orderEvents: [],
    payments: [],
    refunds: [],
    conversations: [],
    messages: [],
    reviews: [],
    feedbacks: [],
    locations: [],
    updatedAt: now,
  };
}

function normalizeDb(partial: Partial<DomainDb>): DomainDb {
  const fallback = createDefaultDomainDb();
  return {
    ...fallback,
    ...partial,
    users: partial.users || fallback.users,
    providers: partial.providers || fallback.providers,
    vehicles: partial.vehicles || fallback.vehicles,
    demands: partial.demands || [],
    offers: partial.offers || [],
    orders: partial.orders || [],
    orderEvents: partial.orderEvents || [],
    payments: partial.payments || [],
    refunds: partial.refunds || [],
    conversations: partial.conversations || [],
    messages: partial.messages || [],
    reviews: partial.reviews || [],
    feedbacks: partial.feedbacks || [],
    locations: partial.locations || [],
    currentUserId: partial.currentUserId || fallback.currentUserId,
    updatedAt: partial.updatedAt || fallback.updatedAt,
  };
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}

function positiveNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function optionalScore(value: number | undefined): number | undefined {
  return value === undefined ? undefined : clampScore(value);
}

function average(values: Array<number | undefined>): number | undefined {
  const present = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!present.length) return undefined;
  return Math.round((present.reduce((sum, value) => sum + value, 0) / present.length) * 100) / 100;
}

function sameParticipants(left: string[], right: string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === rightSet.size && [...leftSet].every((item) => rightSet.has(item));
}

function buildDriverSnapshot(provider: ProviderProfile, user: UserProfile | undefined, vehicle: VehicleProfile): DriverSnapshot {
  return {
    userId: provider.userId,
    nickname: user?.nickname || provider.userId,
    avatar: user?.avatar || '',
    petFriendlyScore: provider.petFriendlyScore,
    tags: vehicle.petFriendlyTags,
    vehicleType: vehicle.vehicleType,
  };
}

function buildCaregiverSnapshot(provider: ProviderProfile, user: UserProfile | undefined): CaregiverSnapshot {
  return {
    userId: provider.userId,
    nickname: user?.nickname || provider.userId,
    avatar: user?.avatar || '',
    catCareScore: provider.catCareScore,
    tags: provider.catCareTags || [],
    supportsMedication: provider.supportsMedication,
    supportsMultiDayCare: provider.supportsMultiDayCare,
  };
}

function estimateProviderDistance(provider: ProviderProfile, lat?: number, lng?: number): number | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const districtSeed = provider.baseDistrict.charCodeAt(0) % 9;
  const baseLat = 30.18 + districtSeed * 0.01;
  const baseLng = 120.12 + districtSeed * 0.015;
  return Math.round(distanceKm(lat as number, lng as number, baseLat, baseLng) * 100) / 100;
}

function distanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const earthRadiusKm = 6371;
  const latDelta = degreesToRadians(toLat - fromLat);
  const lngDelta = degreesToRadians(toLng - fromLng);
  const fromLatRadians = degreesToRadians(fromLat);
  const toLatRadians = degreesToRadians(toLat);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatRadians) * Math.cos(toLatRadians) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
