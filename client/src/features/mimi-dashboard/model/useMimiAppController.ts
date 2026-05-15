import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Conversation,
  Demand,
  MessageRecord,
  Offer,
  PolicyDocument,
  ServiceFeedbackRecord,
  ServiceOrder,
  ServiceType,
  UserProfile,
} from '@mimi/shared';
import {
  ApiError,
  api,
  type AddressRecord,
  type AskPolicyResponse,
  type AdminDashboardResponse,
  type CaregiverMatchCandidate,
  type PolicyFavoriteRecord,
  type DriverMatchCandidate,
  type KnowledgePreview,
  type PaymentCreateResponse,
  type PetProfileRecord,
  type ProviderBundle,
  type ReviewSummary,
} from '../../../shared/api/mimiApi';
import { assets } from '../../../shared/lib/assets';
import { AUTH_FLAG, orderStatusMeta } from '../config/constants';
import {
  buildDemandPayload,
  buildPricingDemandPayload,
  createDefaultDemandForm,
  getConversationTitle,
  isRideService,
  matchesOrderFilter,
} from '../lib/helpers';
import type {
  DemandFormState,
  LoginDraft,
  OrderFilterKey,
  ProfileDraft,
  ProviderCard,
  RecommendationCard,
  ReviewDraft,
  ScreenKey,
  ScreenParams,
  TabKey,
} from './types';

export function useMimiAppController() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [screen, setScreen] = useState<ScreenKey>('tab');
  const [screenParams, setScreenParams] = useState<ScreenParams>({});
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState('');

  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({ nickname: '', phone: '', avatar: '🐱' });
  const [loginDraft, setLoginDraft] = useState<LoginDraft>({
    nickname: '咪咪主人',
    phone: '13800000000',
    avatar: '🐱',
  });

  const [providerCards, setProviderCards] = useState<ProviderCard[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [latestDemand, setLatestDemand] = useState<Demand | null>(null);
  const [latestOffers, setLatestOffers] = useState<Offer[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [quote, setQuote] = useState<{
    amountFen: number;
    breakdown: Array<{ code: string; label: string; amountFen: number }>;
  } | null>(null);
  const [quoteHint, setQuoteHint] = useState('');

  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [selectedOrderEvents, setSelectedOrderEvents] = useState<Array<{ id: string; eventType: string; createdAt: string }>>([]);
  const [orderFeedbacks, setOrderFeedbacks] = useState<ServiceFeedbackRecord[]>([]);
  const [navigationUrl, setNavigationUrl] = useState('');
  const [paymentCache, setPaymentCache] = useState<Record<string, PaymentCreateResponse['payment']>>({});
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft>({ score: 5, content: '沟通及时，服务细致。' });
  const [feedbackDraft, setFeedbackDraft] = useState('到店后会按节点拍照反馈，结束前再做一次环境检查。');
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>('all');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [conversationMessages, setConversationMessages] = useState<MessageRecord[]>([]);
  const [messageDraft, setMessageDraft] = useState('辛苦啦，到了请发我一条消息。');

  const [knowledge, setKnowledge] = useState<{
    districts: string[];
    documents: KnowledgePreview[];
    updatedAt: string;
  } | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDocument | null>(null);
  const [policyQuestion, setPolicyQuestion] = useState('杭州办理《动物检疫合格证明》需要哪些材料？');
  const [policyAnswer, setPolicyAnswer] = useState<AskPolicyResponse | null>(null);
  const [policyFavorites, setPolicyFavorites] = useState<PolicyFavoriteRecord[]>([]);
  const [pets, setPets] = useState<PetProfileRecord[]>([]);
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [selectedPolicyDistrict, setSelectedPolicyDistrict] = useState('全部');
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardResponse | null>(null);

  const [demandForm, setDemandForm] = useState<DemandFormState>(() => createDefaultDemandForm());
  const [homeTab, setHomeTab] = useState<'buddy' | 'car'>('buddy');
  const [bannerIndex, setBannerIndex] = useState(0);

  const providerCardMap = useMemo(
    () => Object.fromEntries(providerCards.map((card) => [card.userId, card])),
    [providerCards],
  );

  const currentConversation = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const selectedOrderStatus = useMemo(
    () => (selectedOrder ? orderStatusMeta[selectedOrder.status] : null),
    [selectedOrder],
  );

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesOrderFilter(order, orderFilter)),
    [orders, orderFilter],
  );

  const buddyProviders = useMemo(
    () => providerCards.filter((card) => card.services.some((service) => !isRideService(service))).slice(0, 3),
    [providerCards],
  );

  const rideProviders = useMemo(
    () => providerCards.filter((card) => card.services.some((service) => isRideService(service))).slice(0, 3),
    [providerCards],
  );

  const policyDistricts = useMemo(
    () => ['全部', ...(knowledge?.districts || [])],
    [knowledge],
  );

  const visiblePolicyDocs = useMemo(
    () =>
      (knowledge?.documents || []).filter(
        (doc) => selectedPolicyDistrict === '全部' || doc.district === selectedPolicyDistrict,
      ),
    [knowledge, selectedPolicyDistrict],
  );

  const showTopBar = !['home', 'policy', 'mine'].includes(activeTab);

  const navigateToScreen = useCallback((nextScreen: ScreenKey, params: ScreenParams = {}) => {
    setScreen(nextScreen);
    setScreenParams(params);
  }, []);

  const returnToTab = useCallback((tab?: TabKey) => {
    if (tab) setActiveTab(tab);
    setScreen('tab');
    setScreenParams({});
  }, []);

  const switchTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    setScreen('tab');
    setScreenParams({});
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const applyError = useCallback(
    (error: unknown, fallback: string) => {
      const message = error instanceof ApiError ? error.message : fallback;
      setErrorMessage(message);
      showToast(message);
    },
    [showToast],
  );

  const buildProviderCards = useCallback(
    async (
      profiles: Array<{
        userId: string;
        score: number;
        completedOrderCount: number;
        services: ServiceType[];
        intro: string;
        baseDistrict: string;
      }>,
    ) => {
      const cards = await Promise.all(
        profiles.map(async (profile) => {
          const [bundleResult, reviewResult] = await Promise.allSettled([
            api.getProvider(profile.userId),
            api.getProviderReviewSummary(profile.userId),
          ]);
          const bundle = bundleResult.status === 'fulfilled' ? bundleResult.value : undefined;
          const reviewSummary = reviewResult.status === 'fulfilled' ? reviewResult.value : undefined;
          const vehicle = bundle?.vehicles?.[0];
          return {
            userId: profile.userId,
            nickname: bundle?.user?.nickname || profile.userId,
            avatar: bundle?.user?.avatar || '🐾',
            intro: bundle?.provider?.intro || profile.intro,
            baseDistrict: bundle?.provider?.baseDistrict || profile.baseDistrict,
            score: reviewSummary?.overallScore || bundle?.provider?.score || profile.score || 0,
            reviewCount: reviewSummary?.reviewCount || 0,
            completedOrderCount: bundle?.provider?.completedOrderCount || profile.completedOrderCount || 0,
            services: bundle?.provider?.services || profile.services,
            tags: [
              ...(reviewSummary?.topTags.map((item) => item.tag) || []),
              ...(bundle?.provider?.catCareTags || []),
              ...(vehicle?.petFriendlyTags || []),
            ]
              .filter((tag, index, array) => tag && array.indexOf(tag) === index)
              .slice(0, 5),
            vehicleId: vehicle?.id,
            vehicleType: vehicle?.vehicleType,
          } satisfies ProviderCard;
        }),
      );
      return cards.sort((left, right) => right.score - left.score || right.completedOrderCount - left.completedOrderCount);
    },
    [],
  );

  const loadConversationDetail = useCallback(async (conversationId: string) => {
    const detail = await api.getConversation(conversationId);
    setSelectedConversationId(conversationId);
    setConversationMessages(detail.messages);
  }, []);

  const loadOrderDetail = useCallback(async (orderId: string) => {
    const detail = await api.getOrder(orderId);
    const feedbackResponse = await api.listFeedback(orderId);
    setSelectedOrderId(orderId);
    setSelectedOrder(detail.order);
    setSelectedOrderEvents(
      detail.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        createdAt: event.createdAt,
      })),
    );
    setOrderFeedbacks(feedbackResponse.items);
    if (detail.order.pickup && detail.order.destination) {
      try {
        const navigation = await api.buildNavigationLink({
          from: detail.order.pickup,
          to: detail.order.destination,
          mode: 'driving',
        });
        setNavigationUrl(navigation.webFallback || navigation.amap || navigation.baidu);
      } catch {
        setNavigationUrl('');
      }
    } else {
      setNavigationUrl('');
    }
  }, []);

  useEffect(() => {
    const targetOrderId = screenParams.orderId;
    if (!targetOrderId || targetOrderId === selectedOrderId) return;
    if (!['care_feedback', 'order_detail', 'payment_confirm', 'payment_result', 'navigation'].includes(screen)) return;
    void loadOrderDetail(targetOrderId).catch((error) => applyError(error, '订单详情加载失败'));
  }, [applyError, loadOrderDetail, screen, screenParams.orderId, selectedOrderId]);

  const loadOffersForDemand = useCallback(async (demandId: string) => {
    const response = await api.listOffers(demandId);
    setLatestOffers(response.items);
  }, []);

  const syncDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const me = await api.getCurrentUser();
      setUser(me);
      api.setCurrentUserId(me.id);
      setProfileDraft({
        nickname: me.nickname,
        phone: me.phone,
        avatar: me.avatar,
      });

      const [providersResult, demandsResult, ordersResult, conversationsResult, knowledgeResult] =
        await Promise.allSettled([
          api.listProviders(),
          api.listDemands(),
          api.listOrders(),
          api.listConversations(),
          api.getKnowledge(),
        ]);

      if (providersResult.status === 'fulfilled') {
        setProviderCards(await buildProviderCards(providersResult.value.items));
      }

      if (demandsResult.status === 'fulfilled') {
        const items = demandsResult.value.items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
        setDemands(items);
        const mineDemand = items.find((item) => item.userId === me.id) || null;
        setLatestDemand(mineDemand);
        if (mineDemand) {
          await loadOffersForDemand(mineDemand.id);
        } else {
          setLatestOffers([]);
        }
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.items);
        const currentOrderId =
          ordersResult.value.items.find((item) => item.id === selectedOrderId)?.id ||
          ordersResult.value.items[0]?.id ||
          '';
        if (currentOrderId) {
          await loadOrderDetail(currentOrderId);
        } else {
          setSelectedOrder(null);
          setSelectedOrderEvents([]);
          setOrderFeedbacks([]);
          setNavigationUrl('');
        }
      }

      if (conversationsResult.status === 'fulfilled') {
        setConversations(conversationsResult.value.items);
        const currentConversationId =
          conversationsResult.value.items.find((item) => item.id === selectedConversationId)?.id ||
          conversationsResult.value.items[0]?.id ||
          '';
        if (currentConversationId) {
          await loadConversationDetail(currentConversationId);
        } else {
          setConversationMessages([]);
        }
      }

      if (knowledgeResult.status === 'fulfilled') {
        setKnowledge({
          districts: knowledgeResult.value.districts,
          documents: knowledgeResult.value.documents,
          updatedAt: knowledgeResult.value.updatedAt,
        });
        const nextPolicyId = selectedPolicyId || knowledgeResult.value.documents[0]?.id || '';
        if (nextPolicyId) {
          setSelectedPolicyId(nextPolicyId);
          setSelectedPolicy(await api.getPolicyDocument(nextPolicyId));
        } else {
          setSelectedPolicy(null);
        }
      }
      try {
        const favorites = await api.listPolicyFavorites(me.id);
        setPolicyFavorites(favorites.items);
      } catch {
        setPolicyFavorites([]);
      }
      try {
        const [petResult, addressResult] = await Promise.all([
          api.listPets(me.id),
          api.listAddresses(me.id),
        ]);
        setPets(petResult.items);
        setAddresses(addressResult.items);
      } catch {
        setPets([]);
        setAddresses([]);
      }
    } catch (error) {
      applyError(error, '初始化数据失败');
    } finally {
      setLoading(false);
      setBooting(false);
    }
  }, [
    applyError,
    buildProviderCards,
    loadConversationDetail,
    loadOffersForDemand,
    loadOrderDetail,
    selectedConversationId,
    selectedOrderId,
    selectedPolicyId,
  ]);

  useEffect(() => {
    const hasAuth = window.sessionStorage.getItem(AUTH_FLAG) === '1';
    if (!hasAuth) {
      setBooting(false);
      return;
    }
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void syncDashboard();
  }, [authenticated, syncDashboard]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(async () => {
      try {
        const preview = await api.quotePricing({
          demand: buildPricingDemandPayload(demandForm),
        });
        setQuote({ amountFen: preview.amountFen, breakdown: preview.breakdown });
        setQuoteHint('智能报价已根据服务类型、区域和要求自动刷新。');
      } catch {
        const amountFen = Math.max(demandForm.budgetMaxYuan, demandForm.budgetMinYuan) * 100;
        setQuote({
          amountFen,
          breakdown: [
            {
              code: 'fallback',
              label: '预算区间兜底估算',
              amountFen,
            },
          ],
        });
        setQuoteHint('定价服务暂不可用，已使用本地预算预估。');
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [authenticated, demandForm]);

  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 2);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [authenticated]);

  useEffect(() => {
    if (!knowledge?.districts?.length) return;
    if (selectedPolicyDistrict !== '全部' && !knowledge.districts.includes(selectedPolicyDistrict)) {
      setSelectedPolicyDistrict('全部');
    }
  }, [knowledge, selectedPolicyDistrict]);

  useEffect(() => {
    if (!visiblePolicyDocs.length) {
      setSelectedPolicy(null);
      return;
    }
    if (!visiblePolicyDocs.some((doc) => doc.id === selectedPolicyId)) {
      void (async () => {
        const firstDoc = visiblePolicyDocs[0];
        setSelectedPolicyId(firstDoc.id);
        try {
          setSelectedPolicy(await api.getPolicyDocument(firstDoc.id));
        } catch {
          setSelectedPolicy(null);
        }
      })();
    }
  }, [selectedPolicyId, visiblePolicyDocs]);

  const handleLogin = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setBusyKey('login');
    try {
        const result = await api.login(loginDraft);
        api.setCurrentUserId(result.user.id);
        window.sessionStorage.setItem(AUTH_FLAG, '1');
        setAuthenticated(true);
        showToast('已进入咪咪出行 H5');
      } catch (error) {
        applyError(error, '登录失败');
      } finally {
        setBusyKey('');
      }
    },
    [applyError, loginDraft, showToast],
  );

  const handleLogout = useCallback(() => {
    window.sessionStorage.removeItem(AUTH_FLAG);
    api.clearCurrentUserId();
    setAuthenticated(false);
    setBooting(false);
    setUser(null);
    setProviderCards([]);
    setDemands([]);
    setLatestDemand(null);
    setLatestOffers([]);
    setRecommendations([]);
    setOrders([]);
    setSelectedOrderId('');
    setSelectedOrder(null);
    setSelectedOrderEvents([]);
    setOrderFeedbacks([]);
    setNavigationUrl('');
    setPaymentCache({});
    setConversations([]);
    setSelectedConversationId('');
    setConversationMessages([]);
    setKnowledge(null);
    setSelectedPolicyId('');
    setSelectedPolicy(null);
    setPolicyAnswer(null);
    setPolicyFavorites([]);
    setAdminDashboard(null);
    setOrderFilter('all');
    setDemandForm(createDefaultDemandForm());
    setHomeTab('buddy');
    setBannerIndex(0);
    setSelectedPolicyDistrict('全部');
    setScreen('tab');
    setScreenParams({});
    setBusyKey('');
    setErrorMessage('');
    setLoading(false);
  }, []);

  const runRecommendations = useCallback(
    async (demand: Demand) => {
      setBusyKey('matching');
      try {
        const baseDemand = {
          id: demand.id,
          userId: demand.userId,
          district: demand.pickup?.district,
          serviceType: demand.serviceType,
          budgetMin: demand.budgetMin,
          budgetMax: demand.budgetMax,
          serviceTime: demand.serviceTime,
          pickup: demand.pickup,
          destination: demand.destination,
          careRequirements: demand.careRequirements,
          rideRequirements: demand.rideRequirements,
        };

        let result: Array<CaregiverMatchCandidate | DriverMatchCandidate>;
        if (isRideService(demand.serviceType)) {
          result = (
            await api.matchDrivers({
              demand: baseDemand,
              pageSize: 6,
            })
          ).candidates;
        } else {
          result = (
            await api.matchCaregivers({
              demand: baseDemand,
              pageSize: 6,
            })
          ).candidates;
        }

        const nextRecommendations = result.map((candidate) => {
          const card = providerCardMap[candidate.providerUserId];
          const snapshotTags =
            'vehicleSnapshot' in candidate
              ? candidate.vehicleSnapshot?.petFriendlyTags || candidate.profileSnapshot.tags
              : candidate.profileSnapshot.tags;
          return {
            providerUserId: candidate.providerUserId,
            nickname: card?.nickname || candidate.profileSnapshot.nickname,
            avatar: card?.avatar || candidate.profileSnapshot.avatar || '🐾',
            score: candidate.score,
            distanceKm: candidate.distanceKm,
            etaMinutes: 'etaMinutes' in candidate ? candidate.etaMinutes : undefined,
            reasons: candidate.reasons,
            priceHintFen:
              ('priceHintMin' in candidate && candidate.priceHintMin) ||
              ('priceHintMax' in candidate && candidate.priceHintMax) ||
              quote?.amountFen ||
              demand.expectedPrice ||
              demand.budgetMax,
            tags: card?.tags?.length ? card.tags : snapshotTags,
            reviewCount: card?.reviewCount || 0,
            vehicleId: 'vehicleId' in candidate ? candidate.vehicleId : card?.vehicleId,
            serviceNote: card?.intro || (isRideService(demand.serviceType) ? '宠物友好司机' : '照护经验较充足'),
          } satisfies RecommendationCard;
        });
      setRecommendations(nextRecommendations);
      showToast('推荐候选已更新');
      } catch (error) {
        const fallback = providerCards
          .filter((card) => card.services.includes(demand.serviceType))
          .slice(0, 6)
          .map((card) => ({
            providerUserId: card.userId,
            nickname: card.nickname,
            avatar: card.avatar,
            score: card.score || 4.6,
            distanceKm: undefined,
            etaMinutes: undefined,
            reasons: ['本地回退推荐', card.baseDistrict, `${card.completedOrderCount} 单经验`],
            priceHintFen: quote?.amountFen || demand.expectedPrice || demand.budgetMax,
            tags: card.tags,
            reviewCount: card.reviewCount,
            vehicleId: card.vehicleId,
            serviceNote: card.intro,
          }));
        setRecommendations(fallback);
        applyError(error, '匹配服务暂不可用，已切换本地推荐');
      } finally {
        setBusyKey('');
      }
    },
    [applyError, providerCardMap, providerCards, quote?.amountFen, showToast],
  );

  const submitDemand = useCallback(async () => {
    if (!user) return;
    setBusyKey('publish');
    try {
      const created = await api.createDemand(buildDemandPayload(demandForm, user.id, quote?.amountFen));
      setLatestDemand(created);
      setDemands((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setLatestOffers([]);
      await runRecommendations(created);
      setActiveTab('publish');
      navigateToScreen('demand_detail', { demandId: created.id });
      showToast('需求已发布，正在刷新推荐');
    } catch (error) {
      applyError(error, '发布需求失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, demandForm, quote?.amountFen, runRecommendations, showToast, user]);

  const pickRecommendation = useCallback(
    async (candidate: RecommendationCard) => {
      if (!latestDemand) {
        showToast('请先发布需求');
        return;
      }
      setBusyKey(`pick-${candidate.providerUserId}`);
      try {
        let offer =
          latestOffers.find(
            (item) => item.providerUserId === candidate.providerUserId && ['submitted', 'accepted'].includes(item.status),
          ) || null;

        if (offer?.status === 'accepted') {
          await syncDashboard();
          setActiveTab('orders');
          showToast('该服务者已生成订单，已为你刷新订单列表');
          return;
        }

        if (!offer) {
          offer = await api.createOffer(latestDemand.id, {
            providerUserId: candidate.providerUserId,
            quoteAmountFen: candidate.priceHintFen,
            vehicleId: candidate.vehicleId,
            message: candidate.reasons.slice(0, 2).join('，'),
          });
        }

        const accepted = await api.acceptOffer(offer.id);
        await loadOffersForDemand(latestDemand.id);
        await syncDashboard();
        setActiveTab('orders');
        await loadOrderDetail(accepted.order.id);
        navigateToScreen('order_confirm', { orderId: accepted.order.id });
        showToast('已生成订单，下一步支付定金');
      } catch (error) {
        applyError(error, '生成订单失败');
      } finally {
        setBusyKey('');
      }
    },
    [applyError, latestDemand, latestOffers, loadOffersForDemand, loadOrderDetail, showToast, syncDashboard],
  );

  const payOrder = useCallback(
    async (order: ServiceOrder) => {
      setBusyKey(`pay-${order.id}`);
      try {
        try {
          const risk = await api.prepayCheck({
            order: {
              id: order.id,
              buyerUserId: order.buyerUserId,
              sellerUserId: order.sellerUserId,
              amountFen: order.depositFen || order.amountFen,
              serviceType: order.driverSnapshot ? 'ride' : 'buddy',
              district: order.pickup?.district,
            },
            payment: {
              channel: 'alipay',
              scene: 'deposit',
            },
          });
          if (!risk.allowed) {
            showToast(risk.humanMessage || '风控阻止了本次支付');
            return;
          }
        } catch {
          showToast('风控服务不可用，继续演示支付流程');
        }

        const created = await api.createPayment({
          orderId: order.id,
          channel: 'alipay',
          scene: 'deposit',
        });
        const paid = await api.queryPayment(created.payment.id, {
          markPaid: true,
          providerTradeNo: `SIM-${Date.now()}`,
        });
        setPaymentCache((prev) => ({ ...prev, [order.id]: paid }));
        await syncDashboard();
        await loadOrderDetail(order.id);
        navigateToScreen('payment_result', { orderId: order.id });
        showToast('支付成功，订单已进入待到达');
      } catch (error) {
        applyError(error, '支付失败');
      } finally {
        setBusyKey('');
      }
    },
    [applyError, loadOrderDetail, showToast, syncDashboard],
  );

  const transitionOrder = useCallback(
    async (order: ServiceOrder, action: 'confirm-arrival' | 'start-service' | 'complete' | 'cancel') => {
      setBusyKey(`${action}-${order.id}`);
      try {
        await api.transitionOrder(order.id, action);
        await syncDashboard();
        await loadOrderDetail(order.id);
        showToast('订单状态已更新');
      } catch (error) {
        applyError(error, '订单操作失败');
      } finally {
        setBusyKey('');
      }
    },
    [applyError, loadOrderDetail, showToast, syncDashboard],
  );

  const submitReview = useCallback(async () => {
    if (!selectedOrder) return;
    setBusyKey(`review-${selectedOrder.id}`);
    try {
      await api.createReview(selectedOrder.id, {
        revieweeUserId: selectedOrder.sellerUserId,
        overallScore: reviewDraft.score,
        punctualityScore: reviewDraft.score,
        communicationScore: reviewDraft.score,
        catCareScore: selectedOrder.caregiverSnapshot ? reviewDraft.score : undefined,
        petFriendlyScore: selectedOrder.driverSnapshot ? reviewDraft.score : undefined,
        drivingStabilityScore: selectedOrder.driverSnapshot ? reviewDraft.score : undefined,
        tags: selectedOrder.driverSnapshot ? ['宠物友好', '沟通顺畅'] : ['拍照及时', '细心照护'],
        content: reviewDraft.content,
      });
      await syncDashboard();
      showToast('评价已提交');
    } catch (error) {
      applyError(error, '评价提交失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, reviewDraft, selectedOrder, showToast, syncDashboard]);

  const submitFeedback = useCallback(async (orderId?: string) => {
    const targetOrderId = orderId || selectedOrder?.id;
    if (!targetOrderId) return;
    setBusyKey(`feedback-${targetOrderId}`);
    try {
      await api.createFeedback(targetOrderId, {
        note: feedbackDraft,
        arrivedAt: new Date().toISOString(),
        leftAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        photoUrls: [assets.postCarrier],
      });
      await loadOrderDetail(targetOrderId);
      await syncDashboard();
      showToast('服务反馈已记录');
    } catch (error) {
      applyError(error, '服务反馈提交失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, feedbackDraft, loadOrderDetail, selectedOrder?.id, showToast, syncDashboard]);

  const reportOrderLocation = useCallback(async () => {
    if (!selectedOrder?.pickup) return;
    setBusyKey(`location-${selectedOrder.id}`);
    try {
      const point = selectedOrder.destination || selectedOrder.pickup;
      await api.reportLocation({
        orderId: selectedOrder.id,
        lat: point.lat,
        lng: point.lng,
        address: point.address,
        coordSystem: point.coordSystem || 'gcj02',
      });
      await syncDashboard();
      const conversationId = selectedConversationId || conversations[0]?.id;
      if (conversationId) {
        await loadConversationDetail(conversationId);
      }
      showToast('位置已同步到会话');
    } catch (error) {
      applyError(error, '位置上报失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, conversations, loadConversationDetail, selectedConversationId, selectedOrder, showToast, syncDashboard]);

  const sendConversationMessage = useCallback(async () => {
    if (!selectedConversationId || !messageDraft.trim()) return;
    setBusyKey(`message-${selectedConversationId}`);
    try {
      await api.sendMessage(selectedConversationId, { content: messageDraft.trim() });
      setMessageDraft('');
      await loadConversationDetail(selectedConversationId);
      const list = await api.listConversations();
      setConversations(list.items);
    } catch (error) {
      applyError(error, '发送消息失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, loadConversationDetail, messageDraft, selectedConversationId]);

  const askPolicy = useCallback(async () => {
    setBusyKey('policy-ask');
    try {
      const answer = await api.askPolicy(policyQuestion);
      setPolicyAnswer(answer);
    } catch (error) {
      applyError(error, '政策问答失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, policyQuestion]);

  const saveProfile = useCallback(async () => {
    setBusyKey('save-profile');
    try {
      const nextUser = await api.updateCurrentUser(profileDraft);
      setUser(nextUser);
      setProfileDraft({
        nickname: nextUser.nickname,
        phone: nextUser.phone,
        avatar: nextUser.avatar,
      });
      showToast('资料已更新');
    } catch (error) {
      applyError(error, '保存资料失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, profileDraft, showToast]);

  const applyAsProvider = useCallback(async () => {
    setBusyKey('apply-provider');
    try {
      await api.applyProvider({
        services: ['buddy', 'feeding', 'ride'],
        intro: '可提供上门陪咪、喂养和宠物友好接送。',
        serviceRadiusKm: 10,
        baseDistrict: demandForm.district,
        supportsHomeVisit: true,
        supportsMedication: true,
        supportsMultiDayCare: true,
        vehicle: {
          vehicleType: 'suv',
          plateMasked: '浙A·MIMI',
          seats: 5,
          trunkLevel: 'large',
          supportsCatBag: true,
          supportsCrate: true,
          supportsStroller: true,
          supportsMultiPet: true,
          petFriendly: true,
          petFriendlyTags: ['支持航空箱', '大空间', '低异味'],
        },
      });
      await syncDashboard();
      showToast('服务者申请已提交');
    } catch (error) {
      applyError(error, '服务者申请失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, demandForm.district, showToast, syncDashboard]);

  const createDemoPet = useCallback(async () => {
    setBusyKey('create-pet');
    try {
      const pet = await api.createPet({
        name: '急急',
        breed: demandForm.petSummary || '猫咪',
        weight: `${Math.max(1, demandForm.petCount)} 只`,
        vaccine: '疫苗信息待补充',
        certificate: '检疫证明待办理',
        avatar: '🐱',
      });
      setPets((prev) => [pet, ...prev.filter((item) => item.id !== pet.id)]);
      showToast('宠物档案已保存');
    } catch (error) {
      applyError(error, '宠物档案保存失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, demandForm.petCount, demandForm.petSummary, showToast]);

  const createDemoAddress = useCallback(async () => {
    setBusyKey('create-address');
    try {
      const address = await api.createAddress({
        label: '常用地址',
        address: demandForm.pickupAddress || '杭州市西湖区宠物友好社区',
        district: demandForm.district,
        contactName: profileDraft.nickname || user?.nickname,
        contactPhone: profileDraft.phone || user?.phone,
        coordSystem: 'gcj02',
        isDefault: true,
      });
      setAddresses((prev) => [address, ...prev.filter((item) => item.id !== address.id)]);
      showToast('常用地址已保存');
    } catch (error) {
      applyError(error, '常用地址保存失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, demandForm.district, demandForm.pickupAddress, profileDraft.nickname, profileDraft.phone, showToast, user?.nickname, user?.phone]);

  const loadPolicyDetail = useCallback(
    async (policyId: string) => {
      try {
        setSelectedPolicyId(policyId);
        setSelectedPolicy(await api.getPolicyDocument(policyId));
        navigateToScreen('policy_detail', { policyId });
      } catch (error) {
        applyError(error, '政策详情加载失败');
      }
    },
    [applyError],
  );

  const copyPolicyAnswer = useCallback(async () => {
    if (!policyAnswer?.answer || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(policyAnswer.answer);
      showToast('已复制 AI 回答');
    } catch {
      showToast('当前环境不支持复制');
    }
  }, [policyAnswer, showToast]);

  const favoriteSelectedPolicy = useCallback(async () => {
    if (!selectedPolicy) return;
    setBusyKey('policy-favorite');
    try {
      const favorite = await api.createPolicyFavorite({
        policyId: selectedPolicy.id,
        title: selectedPolicy.title,
        district: selectedPolicy.district,
      });
      setPolicyFavorites((prev) => [favorite, ...prev.filter((item) => item.policyId !== favorite.policyId)]);
      showToast('已收藏政策');
    } catch (error) {
      applyError(error, '收藏政策失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, selectedPolicy, showToast]);

  const submitComplaint = useCallback(async () => {
    const order = selectedOrder;
    setBusyKey('complaint');
    try {
      await api.createComplaint({
        orderId: order?.id,
        targetUserId: order?.sellerUserId,
        category: 'service_quality',
        content: '服务过程存在异常，需要平台介入。',
      });
      showToast('投诉已提交');
    } catch (error) {
      applyError(error, '投诉提交失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, selectedOrder, showToast]);

  const submitDispute = useCallback(async () => {
    if (!selectedOrder) return;
    setBusyKey('dispute');
    try {
      await api.createDispute({
        orderId: selectedOrder.id,
        respondentUserId: selectedOrder.sellerUserId,
        reason: 'refund',
        description: '申请平台协助处理退款争议。',
        requestedRefundFen: selectedOrder.depositFen || selectedOrder.amountFen,
      });
      showToast('争议已提交');
    } catch (error) {
      applyError(error, '争议提交失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, selectedOrder, showToast]);

  const loadAdminDashboard = useCallback(async () => {
    setBusyKey('admin-dashboard');
    try {
      setAdminDashboard(await api.getAdminDashboard());
      showToast('管理后台已刷新');
    } catch (error) {
      applyError(error, '管理后台加载失败');
    } finally {
      setBusyKey('');
    }
  }, [applyError, showToast]);

  return {
    ui: {
      booting,
      authenticated,
      activeTab,
      setActiveTab: switchTab,
      screen,
      screenParams,
      navigateToScreen,
      returnToTab,
      loading,
      busyKey,
      errorMessage,
      toast,
      showTopBar,
    },
    auth: {
      loginDraft,
      setLoginDraft,
      handleLogin,
    },
    profile: {
      user,
      profileDraft,
      setProfileDraft,
      saveProfile,
      applyAsProvider,
      pets,
      addresses,
      createDemoPet,
      createDemoAddress,
      handleLogout,
    },
    home: {
      homeTab,
      setHomeTab,
      bannerIndex,
      setBannerIndex,
      buddyProviders,
      rideProviders,
    },
    publish: {
      demandForm,
      setDemandForm,
      quote,
      quoteHint,
      latestDemand,
      latestOffers,
      recommendations,
      submitDemand,
      runRecommendations,
      pickRecommendation,
    },
    orders: {
      orders,
      filteredOrders,
      orderFilter,
      setOrderFilter,
      selectedOrderId,
      selectedOrder,
      selectedOrderStatus,
      selectedOrderEvents,
      orderFeedbacks,
      navigationUrl,
      paymentCache,
      reviewDraft,
      setReviewDraft,
      feedbackDraft,
      setFeedbackDraft,
      loadOrderDetail,
      payOrder,
      transitionOrder,
      submitReview,
      submitFeedback,
      reportOrderLocation,
    },
    messages: {
      conversations,
      selectedConversationId,
      currentConversation,
      conversationMessages,
      messageDraft,
      setMessageDraft,
      loadConversationDetail,
      sendConversationMessage,
      getConversationTitle,
    },
    policy: {
      knowledge,
      selectedPolicyId,
      selectedPolicy,
      policyQuestion,
      setPolicyQuestion,
      policyAnswer,
      askPolicy,
      loadPolicyDetail,
      copyPolicyAnswer,
      favoriteSelectedPolicy,
      policyFavorites,
      selectedPolicyDistrict,
      setSelectedPolicyDistrict,
      policyDistricts,
      visiblePolicyDocs,
    },
    governance: {
      adminDashboard,
      loadAdminDashboard,
      submitComplaint,
      submitDispute,
    },
    dashboard: {
      providerCards,
      providerCardMap,
      demands,
      latestDemand,
      latestOffers,
      recommendations,
      orders,
      conversations,
      syncDashboard,
    },
  };
}

export type MimiAppController = ReturnType<typeof useMimiAppController>;
