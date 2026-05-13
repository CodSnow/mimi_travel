import type { LocationPoint, ServiceOrder, ServiceType } from '@mimi/shared';
import { districtCoordinates, orderStatusMeta, serviceTypeOptions } from '../config/constants';
import type { DemandFormState, OrderFilterKey } from '../model/types';

export function isRideService(serviceType: ServiceType): boolean {
  return ['ride', 'pet_friendly_taxi', 'escort', 'taxi', 'carpool'].includes(serviceType);
}

export function serviceTitleTemplate(serviceType: ServiceType): string {
  if (isRideService(serviceType)) return '需要宠物友好出行服务';
  if (serviceType === 'medication') return '今晚需要上门喂药';
  if (serviceType === 'multi_day_care') return '下周需要连续多日照护';
  return '今晚需要上门陪咪';
}

export function serviceLabel(serviceType: ServiceType): string {
  return serviceTypeOptions.find((item) => item.value === serviceType)?.label || serviceType;
}

export function buildPoint(district: string, address: string): LocationPoint {
  const coord = districtCoordinates[district] || districtCoordinates.拱墅区;
  return {
    lat: coord.lat,
    lng: coord.lng,
    address,
    district,
    coordSystem: 'gcj02',
  };
}

export function toIsoOrNow(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

export function toLocalDateTimeValue(iso: string): string {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function currency(amountFen: number): string {
  return `¥${(amountFen / 100).toFixed(2)}`;
}

export function yuanToFen(amountYuan: number): number {
  return Math.max(0, Math.round(amountYuan * 100));
}

export function createDefaultDemandForm(): DemandFormState {
  return {
    serviceType: 'buddy',
    title: '今晚需要上门陪咪',
    description: '希望服务者能拍照反馈，并帮忙清理猫砂。',
    petSummary: '2 只英短，性格稳定，已接种疫苗。',
    district: '拱墅区',
    pickupAddress: '杭州市拱墅区祥符街道',
    destinationAddress: '杭州市萧山区杭州萧山国际机场',
    budgetMinYuan: 60,
    budgetMaxYuan: 120,
    serviceTime: toLocalDateTimeValue(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()),
    allowBargain: true,
    visibilityRadiusKm: 6,
    needHomeVisit: true,
    needMedication: false,
    needMultiDayCare: false,
    needPhotoFeedback: true,
    petCount: 1,
    carrierType: 'cat_bag',
    requirePetFriendlyVehicle: true,
    requireLargeTrunk: false,
    requireStableDriving: true,
    requireLowOdor: true,
  };
}

export function buildDemandPayload(form: DemandFormState, userId: string, expectedPrice?: number) {
  const pickup = buildPoint(form.district, form.pickupAddress);
  const destination = buildPoint(form.district, form.destinationAddress);
  return {
    userId,
    serviceType: form.serviceType,
    title: form.title,
    description: form.description,
    petSummary: form.petSummary,
    budgetMin: yuanToFen(form.budgetMinYuan),
    budgetMax: yuanToFen(form.budgetMaxYuan),
    expectedPrice,
    pickup,
    destination,
    serviceTime: toIsoOrNow(form.serviceTime),
    contactName: '',
    contactPhone: '',
    allowBargain: form.allowBargain,
    visibilityRadiusKm: form.visibilityRadiusKm,
    careRequirements: isRideService(form.serviceType)
      ? undefined
      : {
          needHomeVisit: form.needHomeVisit,
          needMedication: form.needMedication,
          needMultiDayCare: form.needMultiDayCare,
          needPhotoFeedback: form.needPhotoFeedback,
          hasMultiplePets: form.petCount > 1,
        },
    rideRequirements: isRideService(form.serviceType)
      ? {
          petCount: form.petCount,
          carrierType: form.carrierType,
          requirePetFriendlyVehicle: form.requirePetFriendlyVehicle,
          requireLargeTrunk: form.requireLargeTrunk,
          requireStableDriving: form.requireStableDriving,
          requireLowOdor: form.requireLowOdor,
        }
      : undefined,
  };
}

export function buildPricingDemandPayload(form: DemandFormState) {
  return {
    serviceType: form.serviceType,
    district: form.district,
    budgetMin: yuanToFen(form.budgetMinYuan),
    budgetMax: yuanToFen(form.budgetMaxYuan),
    careRequirements: isRideService(form.serviceType)
      ? undefined
      : {
          needHomeVisit: form.needHomeVisit,
          needMedication: form.needMedication,
          needMultiDayCare: form.needMultiDayCare,
        },
    rideRequirements: isRideService(form.serviceType)
      ? {
          petCount: form.petCount,
          carrierType: form.carrierType,
          requirePetFriendlyVehicle: form.requirePetFriendlyVehicle,
          requireLargeTrunk: form.requireLargeTrunk,
          requireStableDriving: form.requireStableDriving,
          requireLowOdor: form.requireLowOdor,
        }
      : undefined,
  };
}

export function matchesOrderFilter(order: ServiceOrder, filter: OrderFilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending') return order.status === 'pending_payment';
  if (filter === 'processing') return ['paid', 'confirmed', 'arriving', 'serving'].includes(order.status);
  if (filter === 'completed') return order.status === 'completed';
  return ['cancelled', 'refund_pending', 'refunded'].includes(order.status);
}

export function getOrderFilterCount(orders: ServiceOrder[], filter: OrderFilterKey): number {
  return orders.filter((order) => matchesOrderFilter(order, filter)).length;
}

export function getOrderProgress(order: ServiceOrder): Array<{ label: string; active: boolean; cancelled?: boolean }> {
  const steps: Array<{ key: ServiceOrder['status']; label: string }> = [
    { key: 'pending_payment', label: '待支付' },
    { key: 'paid', label: '已支付' },
    { key: 'arriving', label: '待到达' },
    { key: 'serving', label: '服务中' },
    { key: 'completed', label: '已完成' },
  ];

  if (order.status === 'cancelled') {
    return steps.map((step, index) => ({
      label: step.label,
      active: index === 0,
      cancelled: index > 0,
    }));
  }

  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === order.status || (order.status === 'confirmed' && step.key === 'paid')),
  );

  return steps.map((step, index) => ({
    label: step.label,
    active: index <= currentIndex,
  }));
}

export function getOrderStatusLabel(order: ServiceOrder): string {
  return orderStatusMeta[order.status].label;
}

export function getConversationTitle(orderId?: string): string {
  return orderId ? `订单会话 ${orderId.slice(0, 8)}` : '需求会话';
}
