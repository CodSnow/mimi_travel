import Taro from '@tarojs/taro'

const DEFAULT_BASE_URL = 'http://localhost:3000'
const STORAGE_USER_ID = 'mimi_mp_current_user_id'

export class ApiError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export function getBffBaseUrl() {
  const envBase = process.env.TARO_APP_BFF_BASE_URL
  return envBase && envBase.trim() ? envBase.trim().replace(/\/$/, '') : DEFAULT_BASE_URL
}

export function setCurrentUserId(userId) {
  Taro.setStorageSync(STORAGE_USER_ID, userId)
}

export function getCurrentUserId() {
  return String(Taro.getStorageSync(STORAGE_USER_ID) || '')
}

export function clearCurrentUserId() {
  Taro.removeStorageSync(STORAGE_USER_ID)
}

export async function miniFetch(path, options = {}) {
  const method = options.method || 'GET'
  const url = path.startsWith('http') ? path : `${getBffBaseUrl()}${path}${toQuery(options.query)}`
  const result = await Taro.request({
    url,
    method,
    data: options.body,
    header: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (result.statusCode < 200 || result.statusCode >= 300) {
    const data = result.data
    const message = data && typeof data.error === 'string' ? data.error : `请求失败：${result.statusCode}`
    throw new ApiError(message, result.statusCode, data)
  }

  return result.data
}

function toQuery(query) {
  if (!query) return ''
  const items = Object.keys(query)
    .filter((key) => query[key] !== undefined && query[key] !== null && query[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
  return items.length ? `?${items.join('&')}` : ''
}

function requireUserId() {
  const userId = getCurrentUserId()
  if (!userId) throw new ApiError('请先登录后再操作', 401)
  return userId
}

export const api = {
  login(payload) {
    return miniFetch('/api/auth/login', { method: 'POST', body: payload })
  },
  getState() {
    return miniFetch('/api/state')
  },
  updateState(payload) {
    return miniFetch('/api/state', { method: 'PUT', body: payload })
  },
  getCurrentUser() {
    return miniFetch('/api/users/me')
  },
  listProviders() {
    return miniFetch('/api/providers')
  },
  applyProvider() {
    return miniFetch('/api/providers/apply', {
      method: 'POST',
      body: {
        userId: requireUserId(),
        services: ['buddy', 'ride'],
        intro: '小程序端提交的服务者入驻申请',
        baseDistrict: '西湖区',
        serviceRadiusKm: 8,
      },
    })
  },
  listPets() {
    return miniFetch('/api/pets', { query: { userId: requireUserId() } })
  },
  createPet(payload) {
    return miniFetch('/api/pets', { method: 'POST', body: { ...payload, userId: requireUserId() } })
  },
  listAddresses() {
    return miniFetch('/api/addresses', { query: { userId: requireUserId() } })
  },
  createAddress(payload) {
    return miniFetch('/api/addresses', { method: 'POST', body: { ...payload, userId: requireUserId() } })
  },
  quotePricing() {
    return miniFetch('/api/pricing/quote', {
      method: 'POST',
      body: {
        operatorUserId: requireUserId(),
        demand: {
          serviceType: 'ride',
          district: '西湖区',
          budgetMin: 3000,
          budgetMax: 12000,
          rideRequirements: {
            petCount: 1,
            carrierType: 'cat_bag',
            requirePetFriendlyVehicle: true,
          },
        },
      },
    })
  },
  createDemand() {
    return miniFetch('/api/demands', {
      method: 'POST',
      body: {
        userId: requireUserId(),
        serviceType: 'ride',
        title: '小程序宠物友好出行需求',
        description: '来自小程序的真实 BFF API 需求单',
        petSummary: '1 只猫，已装航空箱',
        budgetMin: 3000,
        budgetMax: 12000,
        serviceTime: new Date(Date.now() + 86400000).toISOString(),
        contactName: '小程序用户',
        contactPhone: '13800009999',
        allowBargain: true,
        visibilityRadiusKm: 8,
        district: '西湖区',
        pickup: { lat: 30.259, lng: 120.13, address: '西湖区' },
        destination: { lat: 30.235, lng: 120.2, address: '滨江区' },
        rideRequirements: {
          petCount: 1,
          carrierType: 'cat_bag',
          requirePetFriendlyVehicle: true,
        },
      },
    })
  },
  listDemands() {
    return miniFetch('/api/demands')
  },
  listOffers(demandId) {
    return miniFetch(`/api/demands/${demandId}/offers`)
  },
  createOffer(demandId) {
    return miniFetch(`/api/demands/${demandId}/offers`, {
      method: 'POST',
      body: {
        providerUserId: requireUserId(),
        quoteAmountFen: 6800,
        message: '小程序端服务者报价',
        etaMinutes: 20,
        servicePlan: '按约定时间上门接宠并全程反馈',
      },
    })
  },
  acceptOffer(offerId) {
    return miniFetch(`/api/offers/${offerId}/accept`, {
      method: 'POST',
      body: { operatorUserId: requireUserId() },
    })
  },
  listOrders() {
    return miniFetch('/api/orders', { query: { userId: requireUserId() } })
  },
  getOrder(orderId) {
    return miniFetch(`/api/orders/${orderId}`, { query: { operatorUserId: requireUserId() } })
  },
  transitionOrder(orderId, action) {
    return miniFetch(`/api/orders/${orderId}/${action}`, {
      method: 'POST',
      body: { operatorUserId: requireUserId() },
    })
  },
  prepayCheck(order) {
    return miniFetch('/api/payments/prepay-check', {
      method: 'POST',
      body: {
        operatorUserId: requireUserId(),
        order: {
          id: order.id,
          buyerUserId: order.buyerUserId,
          sellerUserId: order.sellerUserId,
          amountFen: order.amountFen,
          serviceType: 'ride',
          district: '西湖区',
        },
        payment: { channel: 'wechat_pay', scene: 'deposit' },
      },
    })
  },
  createPayment(orderId) {
    return miniFetch('/api/payments', {
      method: 'POST',
      body: { orderId, channel: 'wechat_pay', scene: 'deposit', operatorUserId: requireUserId() },
    })
  },
  queryPayment(paymentId) {
    return miniFetch(`/api/payments/${paymentId}/query`, {
      method: 'POST',
      body: { operatorUserId: requireUserId() },
    })
  },
  refundPayment(paymentId) {
    return miniFetch(`/api/payments/${paymentId}/refund`, {
      method: 'POST',
      body: { operatorUserId: requireUserId(), reason: '小程序端退款申请' },
    })
  },
  listConversations() {
    return miniFetch('/api/messages/conversations', { query: { userId: requireUserId() } })
  },
  sendMessage(conversationId, content) {
    return miniFetch(`/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      body: { senderUserId: requireUserId(), content },
    })
  },
  getKnowledge() {
    return miniFetch('/api/knowledge', { query: { district: '西湖区' } })
  },
  askPolicy(question) {
    return miniFetch('/api/ask', { method: 'POST', body: { question } })
  },
  createComplaint(orderId) {
    return miniFetch('/api/complaints', {
      method: 'POST',
      body: {
        orderId,
        complainantUserId: requireUserId(),
        category: 'service_quality',
        content: '小程序端提交的投诉，等待 BFF 返回真实处理状态',
        evidenceUrls: [],
      },
    })
  },
  createDispute(orderId) {
    return miniFetch('/api/disputes', {
      method: 'POST',
      body: {
        orderId,
        openerUserId: requireUserId(),
        reason: 'refund_request',
        description: '小程序端退款争议申请',
        requestedRefundFen: 1000,
        evidenceUrls: [],
      },
    })
  },
  getAdminDashboard() {
    return miniFetch('/api/admin/dashboard', { query: { adminUserId: requireUserId() } })
  },
}
