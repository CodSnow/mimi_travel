import type { ServiceOrder } from '@mimi/shared';
import { assets } from '../../../shared/lib/assets';
import type { OrderFilterItem, OrderStatusMap, TabItem, ServiceTypeOption } from '../model/types';

export const AUTH_FLAG = 'mimi-travel-h5-auth';

export const tabs: TabItem[] = [
  { key: 'home', label: '首页', icon: '🏠' },
  { key: 'publish', label: '发需求', icon: '📝' },
  { key: 'orders', label: '订单', icon: '📦' },
  { key: 'messages', label: '消息', icon: '💬' },
  { key: 'policy', label: '政策', icon: '📚' },
  { key: 'mine', label: '我的', icon: '👤' },
];

export const serviceTypeOptions: ServiceTypeOption[] = [
  { value: 'buddy', label: '上门陪咪', icon: '🐾', note: '到家陪玩、喂食、清洁' },
  { value: 'feeding', label: '上门喂养', icon: '🥣', note: '标准到店喂食和清洁' },
  { value: 'multi_day_care', label: '多日照护', icon: '🛋️', note: '连续多日驻留或上门' },
  { value: 'medication', label: '喂药照护', icon: '💊', note: '需有喂药经验的服务者' },
  { value: 'ride', label: '宠物顺风车', icon: '🚗', note: '同城/跨区接送' },
  { value: 'pet_friendly_taxi', label: '宠物友好专车', icon: '🚕', note: '更适合猫包和航空箱' },
  { value: 'escort', label: '陪同办证/托运', icon: '✈️', note: '车站机场陪同步骤更省心' },
];

export const policyQuickQuestions = [
  '杭州办理《动物检疫合格证明》需要哪些材料？',
  '高铁带猫出行有哪些注意事项？',
  '机场宠物托运建议提前多久办理？',
];

export const postCards = [
  {
    image: assets.postCarrier,
    title: '宠物托运箱怎么选才稳妥',
    subtitle: '航空箱、猫包、尿垫和安抚毯一次配齐。',
  },
  {
    image: assets.postCert,
    title: '检疫证明办理避坑清单',
    subtitle: '把窗口、材料和有效期一次讲清楚。',
  },
  {
    image: assets.postLuggage,
    title: '跨城出行前 4 项检查',
    subtitle: '证件、路线、服务者和应急联系人都要确认。',
  },
];

export const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  上城区: { lat: 30.242, lng: 120.17 },
  拱墅区: { lat: 30.319, lng: 120.139 },
  西湖区: { lat: 30.259, lng: 120.105 },
  滨江区: { lat: 30.207, lng: 120.212 },
  萧山区: { lat: 30.165, lng: 120.264 },
  余杭区: { lat: 30.273, lng: 120.299 },
  临平区: { lat: 30.429, lng: 120.299 },
  钱塘区: { lat: 30.321, lng: 120.471 },
  富阳区: { lat: 30.049, lng: 119.96 },
  临安区: { lat: 30.233, lng: 119.724 },
};

export const orderFilters: OrderFilterItem[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'processing', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'after_sale', label: '售后' },
];

export const orderStatusMeta: OrderStatusMap = {
  pending_payment: { label: '待支付', tone: 'warm', desc: '等待支付定金，确认服务档期。' },
  paid: { label: '已支付', tone: 'blue', desc: '支付成功，等待服务者到达。' },
  confirmed: { label: '已确认', tone: 'blue', desc: '订单已确认，等待到场。' },
  arriving: { label: '待到达', tone: 'blue', desc: '服务者正在前往，保持电话畅通。' },
  serving: { label: '服务中', tone: 'green', desc: '服务进行中，可查看位置和反馈。' },
  completed: { label: '已完成', tone: 'green', desc: '订单完成，可评价本次服务。' },
  cancelled: { label: '已取消', tone: 'gray', desc: '订单已取消。' },
  refund_pending: { label: '退款中', tone: 'danger', desc: '退款处理中，请留意进度。' },
  refunded: { label: '已退款', tone: 'gray', desc: '退款已完成。' },
} satisfies Record<ServiceOrder['status'], OrderStatusMap[ServiceOrder['status']]>;
