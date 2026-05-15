import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Input, ScrollView, Text, View } from '@tarojs/components'

import { ApiError, api, clearCurrentUserId, getBffBaseUrl, getCurrentUserId, setCurrentUserId } from '../../api'

const h = React.createElement

const navItems = [
  { key: 'home', label: '首页' },
  { key: 'demand', label: '需求' },
  { key: 'orders', label: '订单' },
  { key: 'payment', label: '支付' },
  { key: 'messages', label: '消息' },
  { key: 'policy', label: '政策' },
  { key: 'profile', label: '我的' },
  { key: 'provider', label: '工作台' },
]

const initialStatus = {
  loading: false,
  ok: false,
  message: '未请求',
}

const Index = () => {
  const [active, setActive] = useState('home')
  const [loginDraft, setLoginDraft] = useState({ nickname: '咪咪小程序用户', phone: '13800009999' })
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState({})
  const [latestDemandId, setLatestDemandId] = useState('')
  const [latestOfferId, setLatestOfferId] = useState('')
  const [latestOrderId, setLatestOrderId] = useState('')
  const [latestPaymentId, setLatestPaymentId] = useState('')
  const [latestConversationId, setLatestConversationId] = useState('')
  const [policyQuestion, setPolicyQuestion] = useState('杭州宠物出行需要准备什么？')

  const loggedIn = Boolean(user && user.id)
  const currentUserId = (user && user.id) || getCurrentUserId()

  const setOneStatus = useCallback((key, next) => {
    setStatus((prev) => ({ ...prev, [key]: next }))
  }, [])

  const markMissing = useCallback((key, message) => {
    setOneStatus(key, { loading: false, ok: false, message, updatedAt: new Date().toLocaleTimeString() })
  }, [setOneStatus])

  const runApi = useCallback(async (key, task, onSuccess) => {
    setOneStatus(key, { loading: true, ok: false, message: '请求中...' })
    try {
      const data = await task()
      if (onSuccess) onSuccess(data)
      setOneStatus(key, {
        loading: false,
        ok: true,
        message: 'BFF 已返回真实结果',
        data,
        updatedAt: new Date().toLocaleTimeString(),
      })
      return data
    } catch (error) {
      const message = error instanceof ApiError ? `${error.statusCode} ${error.message}` : error instanceof Error ? error.message : '请求失败'
      setOneStatus(key, {
        loading: false,
        ok: false,
        message,
        data: error instanceof ApiError ? error.details : undefined,
        updatedAt: new Date().toLocaleTimeString(),
      })
      return null
    }
  }, [setOneStatus])

  const login = useCallback(async () => {
    await runApi('login', () => api.login(loginDraft), (data) => {
      setUser(data.user)
      setCurrentUserId(data.user.id)
      Taro.showToast({ title: '已登录', icon: 'none' })
    })
  }, [loginDraft, runApi])

  const refreshCore = useCallback(async () => {
    await Promise.all([
      runApi('state', api.getState),
      runApi('me', api.getCurrentUser, setUser),
      runApi('providers', api.listProviders),
      runApi('demands', api.listDemands, (data) => data.items && data.items[0] && setLatestDemandId(data.items[0].id)),
      runApi('orders', api.listOrders, (data) => data.items && data.items[0] && setLatestOrderId(data.items[0].id)),
      runApi('messages', api.listConversations, (data) => data.items && data.items[0] && setLatestConversationId(data.items[0].id)),
      runApi('knowledge', api.getKnowledge),
      runApi('pets', api.listPets),
      runApi('addresses', api.listAddresses),
      runApi('admin', api.getAdminDashboard),
    ])
  }, [runApi])

  useEffect(() => {
    if (getCurrentUserId() && !user) {
      runApi('me', api.getCurrentUser, setUser)
    }
  }, [runApi, user])

  const demandActions = useMemo(() => [
    { label: '获取报价', onClick: () => runApi('quote', api.quotePricing) },
    { label: '创建需求', onClick: () => runApi('createDemand', api.createDemand, (data) => data.id && setLatestDemandId(data.id)) },
    { label: '刷新需求', onClick: () => runApi('demands', api.listDemands) },
    {
      label: '查看报价',
      onClick: () => latestDemandId
        ? runApi('offers', () => api.listOffers(latestDemandId), (data) => data.items && data.items[0] && setLatestOfferId(data.items[0].id))
        : markMissing('offers', '需要先从 BFF 获取 demandId'),
    },
    {
      label: '服务者报价',
      onClick: () => latestDemandId
        ? runApi('createOffer', () => api.createOffer(latestDemandId), (data) => data.id && setLatestOfferId(data.id))
        : markMissing('createOffer', '需要先创建或选择需求'),
    },
    {
      label: '接受报价',
      onClick: () => latestOfferId
        ? runApi('acceptOffer', () => api.acceptOffer(latestOfferId), (data) => data.order && data.order.id && setLatestOrderId(data.order.id))
        : markMissing('acceptOffer', '需要先从 BFF 获取 offerId'),
    },
  ], [latestDemandId, latestOfferId, markMissing, runApi])

  const logout = () => {
    clearCurrentUserId()
    setUser(null)
    setStatus({})
    setLatestDemandId('')
    setLatestOfferId('')
    setLatestOrderId('')
    setLatestPaymentId('')
    setLatestConversationId('')
  }

  if (!loggedIn) {
    return h(View, { className: 'mp-page login-shell' },
      h(View, { className: 'login-card' },
        h(Text, { className: 'eyebrow' }, 'Mini Program API Alignment'),
        h(Text, { className: 'title' }, '咪咪出行小程序'),
        h(Text, { className: 'subtitle' }, `当前 BFF：${getBffBaseUrl()}`),
        h(View, { className: 'field' },
          h(Text, null, '昵称'),
          h(Input, { value: loginDraft.nickname, onInput: (event) => setLoginDraft({ ...loginDraft, nickname: event.detail.value }) }),
        ),
        h(View, { className: 'field' },
          h(Text, null, '手机号'),
          h(Input, { value: loginDraft.phone, onInput: (event) => setLoginDraft({ ...loginDraft, phone: event.detail.value }) }),
        ),
        h(Button, { className: 'primary-btn', loading: status.login && status.login.loading, onClick: login }, '通过 BFF 登录'),
        h(StatusCard, { title: '登录 API', value: status.login || initialStatus }),
      ),
    )
  }

  return h(View, { className: 'mp-page' },
    h(View, { className: 'topbar' },
      h(View, null,
        h(Text, { className: 'eyebrow' }, 'TS BFF API'),
        h(Text, { className: 'title' }, '小程序主流程'),
        h(Text, { className: 'subtitle' }, `${user.nickname} · ${currentUserId}`),
      ),
      h(Button, { className: 'ghost-btn', onClick: logout }, '退出'),
    ),
    h(ScrollView, { scrollX: true, className: 'nav-scroll' },
      h(View, { className: 'nav-row' },
        navItems.map((item) => h(Button, {
          key: item.key,
          className: `nav-pill ${active === item.key ? 'active' : ''}`,
          onClick: () => setActive(item.key),
        }, item.label)),
      ),
    ),
    h(ScrollView, { scrollY: true, className: 'content-scroll' }, renderSection({
      active,
      status,
      refreshCore,
      runApi,
      markMissing,
      demandActions,
      latestDemandId,
      latestOfferId,
      latestOrderId,
      latestPaymentId,
      latestConversationId,
      setLatestOrderId,
      setLatestPaymentId,
      setLatestConversationId,
      policyQuestion,
      setPolicyQuestion,
    })),
  )
}

function renderSection(ctx) {
  if (ctx.active === 'home') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '首页总览', desc: '所有卡片只展示 BFF 返回、加载中或错误状态。' }),
      h(View, { className: 'action-grid' },
        h(Button, { className: 'primary-btn', onClick: ctx.refreshCore }, '刷新核心 API'),
        h(Button, { className: 'secondary-btn', onClick: () => ctx.runApi('stateUpdate', () => api.updateState({ mpLastSeenAt: new Date().toISOString() })) }, '写入 /api/state'),
      ),
      h(StatusGrid, { keys: ['state', 'me', 'providers', 'demands', 'orders', 'messages', 'knowledge', 'pets', 'addresses', 'admin'], status: ctx.status }),
    )
  }

  if (ctx.active === 'demand') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '需求与报价', desc: '覆盖需求创建、报价预估、服务者报价、接受报价。' }),
      h(ActionList, { actions: ctx.demandActions }),
      h(StatusGrid, { keys: ['quote', 'createDemand', 'demands', 'offers', 'createOffer', 'acceptOffer'], status: ctx.status }),
      h(IdPanel, { demandId: ctx.latestDemandId, offerId: ctx.latestOfferId, orderId: ctx.latestOrderId, paymentId: ctx.latestPaymentId }),
    )
  }

  if (ctx.active === 'orders') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '订单', desc: '订单列表、详情和状态流转均走订单 API。' }),
      h(ActionList, { actions: [
        { label: '刷新订单', onClick: () => ctx.runApi('orders', api.listOrders, (data) => data.items && data.items[0] && ctx.setLatestOrderId(data.items[0].id)) },
        { label: '订单详情', onClick: () => ctx.latestOrderId ? ctx.runApi('orderDetail', () => api.getOrder(ctx.latestOrderId)) : ctx.markMissing('orderDetail', '需要先获取 orderId') },
        { label: '确认到达', onClick: () => ctx.latestOrderId ? ctx.runApi('orderArrive', () => api.transitionOrder(ctx.latestOrderId, 'confirm-arrival')) : ctx.markMissing('orderArrive', '需要先获取 orderId') },
        { label: '开始服务', onClick: () => ctx.latestOrderId ? ctx.runApi('orderStart', () => api.transitionOrder(ctx.latestOrderId, 'start-service')) : ctx.markMissing('orderStart', '需要先获取 orderId') },
        { label: '完成服务', onClick: () => ctx.latestOrderId ? ctx.runApi('orderComplete', () => api.transitionOrder(ctx.latestOrderId, 'complete')) : ctx.markMissing('orderComplete', '需要先获取 orderId') },
      ] }),
      h(StatusGrid, { keys: ['orders', 'orderDetail', 'orderArrive', 'orderStart', 'orderComplete'], status: ctx.status }),
    )
  }

  if (ctx.active === 'payment') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '支付与退款', desc: '真实支付风险、预下单、查询、退款状态直接展示 API 响应或错误。' }),
      h(ActionList, { actions: [
        { label: '支付风险检查', onClick: () => ctx.latestOrderId ? ctx.runApi('prepay', async () => {
          const detail = await api.getOrder(ctx.latestOrderId)
          return api.prepayCheck(detail.order || detail)
        }) : ctx.markMissing('prepay', '需要先获取 orderId') },
        { label: '创建支付', onClick: () => ctx.latestOrderId ? ctx.runApi('paymentCreate', () => api.createPayment(ctx.latestOrderId), (data) => data.payment && data.payment.id && ctx.setLatestPaymentId(data.payment.id)) : ctx.markMissing('paymentCreate', '需要先获取 orderId') },
        { label: '查询支付', onClick: () => ctx.latestPaymentId ? ctx.runApi('paymentQuery', () => api.queryPayment(ctx.latestPaymentId)) : ctx.markMissing('paymentQuery', '需要先获取 paymentId') },
        { label: '申请退款', onClick: () => ctx.latestPaymentId ? ctx.runApi('refund', () => api.refundPayment(ctx.latestPaymentId)) : ctx.markMissing('refund', '需要先获取 paymentId') },
        { label: '提交退款争议', onClick: () => ctx.latestOrderId ? ctx.runApi('dispute', () => api.createDispute(ctx.latestOrderId)) : ctx.markMissing('dispute', '需要先获取 orderId') },
      ] }),
      h(StatusGrid, { keys: ['prepay', 'paymentCreate', 'paymentQuery', 'refund', 'dispute'], status: ctx.status }),
    )
  }

  if (ctx.active === 'messages') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '消息', desc: '会话列表和发送消息均使用 BFF 消息 API。' }),
      h(ActionList, { actions: [
        { label: '刷新会话', onClick: () => ctx.runApi('messages', api.listConversations, (data) => data.items && data.items[0] && ctx.setLatestConversationId(data.items[0].id)) },
        { label: '发送消息', onClick: () => ctx.latestConversationId ? ctx.runApi('sendMessage', () => api.sendMessage(ctx.latestConversationId, '来自小程序的消息')) : ctx.markMissing('sendMessage', '需要先获取 conversationId') },
      ] }),
      h(StatusGrid, { keys: ['messages', 'sendMessage'], status: ctx.status }),
    )
  }

  if (ctx.active === 'policy') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '政策问答', desc: '/api/knowledge 与 /api/ask 保持演示兼容，同时展示模型真实模式。' }),
      h(View, { className: 'field' },
        h(Text, null, '问题'),
        h(Input, { value: ctx.policyQuestion, onInput: (event) => ctx.setPolicyQuestion(event.detail.value) }),
      ),
      h(ActionList, { actions: [
        { label: '政策库', onClick: () => ctx.runApi('knowledge', api.getKnowledge) },
        { label: '提问', onClick: () => ctx.runApi('ask', () => api.askPolicy(ctx.policyQuestion)) },
      ] }),
      h(StatusGrid, { keys: ['knowledge', 'ask'], status: ctx.status }),
    )
  }

  if (ctx.active === 'profile') {
    return h(View, { className: 'section' },
      h(SectionHeader, { title: '宠物档案与地址', desc: '档案和地址从 BFF/Python 事实源读写。' }),
      h(ActionList, { actions: [
        { label: '刷新宠物', onClick: () => ctx.runApi('pets', api.listPets) },
        { label: '新增宠物', onClick: () => ctx.runApi('petCreate', () => api.createPet({ name: '小程序猫咪', breed: '狸花', weight: '4kg' })) },
        { label: '刷新地址', onClick: () => ctx.runApi('addresses', api.listAddresses) },
        { label: '新增地址', onClick: () => ctx.runApi('addressCreate', () => api.createAddress({ label: '家', district: '西湖区', address: '杭州市西湖区小程序测试地址' })) },
        { label: '提交投诉', onClick: () => ctx.runApi('complaint', () => api.createComplaint(ctx.latestOrderId || undefined)) },
      ] }),
      h(StatusGrid, { keys: ['pets', 'petCreate', 'addresses', 'addressCreate', 'complaint'], status: ctx.status }),
    )
  }

  return h(View, { className: 'section' },
    h(SectionHeader, { title: '服务者工作台', desc: '服务者入驻、接单报价、治理后台状态都以 API 返回为准。' }),
    h(ActionList, { actions: [
      { label: '服务者列表', onClick: () => ctx.runApi('providers', api.listProviders) },
      { label: '申请服务者', onClick: () => ctx.runApi('providerApply', api.applyProvider) },
      { label: '工作台状态', onClick: () => ctx.runApi('admin', api.getAdminDashboard) },
    ] }),
    h(StatusGrid, { keys: ['providers', 'providerApply', 'admin'], status: ctx.status }),
  )
}

function SectionHeader(props) {
  return h(View, { className: 'section-header' },
    h(Text, { className: 'section-title' }, props.title),
    h(Text, { className: 'section-desc' }, props.desc),
  )
}

function ActionList(props) {
  return h(View, { className: 'action-grid' },
    props.actions.map((action) => h(Button, { key: action.label, className: 'secondary-btn', onClick: action.onClick }, action.label)),
  )
}

function StatusGrid(props) {
  return h(View, { className: 'status-grid' },
    props.keys.map((key) => h(StatusCard, { key, title: key, value: props.status[key] || initialStatus })),
  )
}

function StatusCard(props) {
  const value = props.value
  const text = value.data === undefined ? '' : JSON.stringify(value.data).slice(0, 260)
  return h(View, { className: `status-card ${value.loading ? 'loading' : value.ok ? 'ok' : 'fail'}` },
    h(View, { className: 'status-head' },
      h(Text, { className: 'status-title' }, props.title),
      h(Text, { className: 'status-badge' }, value.loading ? 'loading' : value.ok ? 'ok' : 'status'),
    ),
    h(Text, { className: 'status-message' }, value.message),
    value.updatedAt ? h(Text, { className: 'status-time' }, value.updatedAt) : null,
    text ? h(Text, { className: 'status-data' }, text) : null,
  )
}

function IdPanel(props) {
  return h(View, { className: 'id-panel' },
    h(Text, null, `demandId: ${props.demandId || '未获取'}`),
    h(Text, null, `offerId: ${props.offerId || '未获取'}`),
    h(Text, null, `orderId: ${props.orderId || '未获取'}`),
    h(Text, null, `paymentId: ${props.paymentId || '未获取'}`),
  )
}

export default Index
