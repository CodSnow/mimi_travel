import React from 'react';
import type { LocationPoint, ServiceOrder } from '@mimi/shared';
import { orderStatusMeta } from '../../../features/mimi-dashboard/config/constants';
import { currency, formatDateTime, serviceLabel } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { DetailItem, EmptyBlock } from '../../../shared/ui/common';

export function FlowScreen({ controller }: { controller: MimiAppController }) {
  const { ui, dashboard, publish, orders, messages, policy, profile, governance } = controller;
  const demand = dashboard.demands.find((item) => item.id === ui.screenParams.demandId) || publish.latestDemand;
  const provider = ui.screenParams.providerUserId ? dashboard.providerCardMap[ui.screenParams.providerUserId] : undefined;
  const order = ui.screenParams.orderId
    ? orders.orders.find((item) => item.id === ui.screenParams.orderId) || orders.selectedOrder
    : orders.selectedOrder;
  const conversation = ui.screenParams.conversationId
    ? messages.conversations.find((item) => item.id === ui.screenParams.conversationId) || messages.currentConversation
    : messages.currentConversation;

  if (ui.screen === 'demand_hall') {
    return (
      <FlowShell controller={controller} title="需求大厅">
        <section className="section-card">
          <div className="section-head">
            <div>
              <h3>公开需求</h3>
              <p>来自 TS BFF 的真实需求列表。</p>
            </div>
            <button className="primary-btn compact-btn" onClick={() => ui.returnToTab('publish')} type="button">发布需求</button>
          </div>
          <div className="offer-list">
            {dashboard.demands.map((item) => (
              <button className="offer-card as-button" key={item.id} onClick={() => ui.navigateToScreen('demand_detail', { demandId: item.id })} type="button">
                <div>
                  <strong>{item.title}</strong>
                  <p>{serviceLabel(item.serviceType)} · {item.pickup?.district || '杭州'} · {currency(item.budgetMax)}</p>
                </div>
                <span className="mini-status">{item.status}</span>
              </button>
            ))}
          </div>
        </section>
      </FlowShell>
    );
  }

  if (ui.screen === 'nearby_providers') {
    return (
      <FlowShell controller={controller} title="附近服务者">
        <ProviderList controller={controller} mode="provider" />
      </FlowShell>
    );
  }

  if (ui.screen === 'provider_detail' || ui.screen === 'driver_detail') {
    return (
      <FlowShell controller={controller} title={ui.screen === 'driver_detail' ? '司机详情' : '服务者详情'}>
        {provider ? (
          <section className="section-card provider-detail-card">
            <div className="provider-card__header">
              <div className="emoji-avatar">{provider.avatar}</div>
              <div>
                <h3>{provider.nickname}</h3>
                <p>{provider.baseDistrict} · {provider.completedOrderCount} 单经验</p>
              </div>
              <span className="score-pill">{provider.score.toFixed(1)}</span>
            </div>
            <p className="provider-intro">{provider.intro}</p>
            <div className="tag-row">
              {provider.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
            </div>
            <div className="order-actions">
              <button className="primary-btn" onClick={() => ui.returnToTab('publish')} type="button">找 TA 下单</button>
              <button className="ghost-btn" onClick={() => ui.navigateToScreen('nearby_providers')} type="button">更多服务者</button>
            </div>
          </section>
        ) : (
          <EmptyBlock description="服务者资料还在同步。" image={assets.windCat} title="未找到服务者" />
        )}
      </FlowShell>
    );
  }

  if (ui.screen === 'demand_detail') {
    return (
      <FlowShell controller={controller} title="需求详情">
        {demand ? (
          <>
            <section className="section-card">
              <div className="section-head">
                <div>
                  <h3>{demand.title}</h3>
                  <p>{serviceLabel(demand.serviceType)} · {formatDateTime(demand.serviceTime)}</p>
                </div>
                <span className="mini-status">{demand.status}</span>
              </div>
              <div className="detail-grid">
                <DetailItem label="预算" value={`${currency(demand.budgetMin)} - ${currency(demand.budgetMax)}`} />
                <DetailItem label="区县" value={demand.pickup?.district || '--'} />
                <DetailItem label="宠物" value={demand.petSummary || '--'} />
                <DetailItem label="上门点" value={demand.pickup?.address || '--'} />
              </div>
              <p className="provider-intro">{demand.description}</p>
            </section>
            <section className="section-card">
              <div className="section-head">
                <div>
                  <h3>推荐与报价</h3>
                  <p>选择候选后会创建报价并接受，进入订单确认。</p>
                </div>
                <button className="ghost-btn compact-btn" onClick={() => void publish.runRecommendations(demand)} type="button">刷新</button>
              </div>
              <div className="recommendation-stack">
                {publish.recommendations.map((candidate) => (
                  <article className="recommendation-card" key={candidate.providerUserId}>
                    <div className="provider-card__header">
                      <div className="emoji-avatar">{candidate.avatar}</div>
                      <div>
                        <strong>{candidate.nickname}</strong>
                        <p>{candidate.serviceNote}</p>
                      </div>
                      <span className="score-pill">{candidate.score.toFixed(1)}</span>
                    </div>
                    <div className="recommendation-meta">
                      <span>{currency(candidate.priceHintFen)}</span>
                      <span>{candidate.etaMinutes ? `${candidate.etaMinutes} 分钟` : '可沟通档期'}</span>
                    </div>
                    <button className="primary-btn" onClick={() => void publish.pickRecommendation(candidate)} type="button">选择并生成订单</button>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <EmptyBlock description="请先发布或选择一个需求。" image={assets.adoptCat} title="暂无需求详情" />
        )}
      </FlowShell>
    );
  }

  if (ui.screen === 'order_confirm' || ui.screen === 'payment_confirm' || ui.screen === 'payment_result' || ui.screen === 'order_detail') {
    return (
      <FlowShell controller={controller} title={screenTitle(ui.screen)}>
        {order ? (
          <OrderFlow controller={controller} order={order} />
        ) : (
          <EmptyBlock description="订单数据同步后会显示详情。" image={assets.homeCat} title="暂无订单" />
        )}
      </FlowShell>
    );
  }

  if (ui.screen === 'navigation') {
    return (
      <FlowShell controller={controller} title="导航">
        <NavigationMapPanel controller={controller} order={order} />
      </FlowShell>
    );
  }

  if (ui.screen === 'conversation') {
    return (
      <FlowShell controller={controller} title="会话">
        {conversation ? (
          <section className="section-card conversation-panel">
            <div className="message-stream">
              {messages.conversationMessages.map((message) => (
                <div className={['message-bubble', message.senderUserId === profile.user?.id ? 'mine' : '', message.type !== 'text' ? 'system' : ''].join(' ')} key={message.id}>
                  <strong>{message.type}</strong>
                  <p>{message.content || '系统消息'}</p>
                  <span>{formatDateTime(message.createdAt)}</span>
                </div>
              ))}
            </div>
            <div className="composer message-composer">
              <textarea rows={3} value={messages.messageDraft} onChange={(event) => messages.setMessageDraft(event.target.value)} />
              <button className="primary-btn" onClick={() => void messages.sendConversationMessage()} type="button">发送</button>
            </div>
          </section>
        ) : (
          <EmptyBlock description="订单生成后会自动建立会话。" image={assets.policyCat} title="暂无会话" />
        )}
      </FlowShell>
    );
  }

  if (ui.screen === 'policy_detail') {
    return (
      <FlowShell controller={controller} title="政策详情">
        {policy.selectedPolicy ? (
          <section className="section-card policy-detail-card">
            <h3>{policy.selectedPolicy.title}</h3>
            <p className="muted-text">{policy.selectedPolicy.sourceName}</p>
            <div className="policy-content">
              <p>{policy.selectedPolicy.summary}</p>
              <p><strong>办理材料：</strong>{policy.selectedPolicy.materials}</p>
              <p>{policy.selectedPolicy.content}</p>
            </div>
            <button className="primary-btn" onClick={() => void policy.favoriteSelectedPolicy()} type="button">收藏政策</button>
          </section>
        ) : (
          <EmptyBlock description="请选择一篇政策文档。" image={assets.policyCat} title="暂无政策详情" />
        )}
      </FlowShell>
    );
  }

  return <AuxiliaryScreen controller={controller} />;
}

type MapRenderStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'failed';

interface AMapSdk {
  Map: new (container: HTMLElement, options: { zoom: number; center: [number, number] }) => unknown;
  Driving: new (options: { map: unknown }) => { search: (from: [number, number], to: [number, number], callback: (status: string) => void) => void };
}

interface BaiduMapSdk {
  Map: new (container: HTMLElement) => { centerAndZoom: (point: unknown, zoom: number) => void; enableScrollWheelZoom?: (enabled: boolean) => void };
  Point: new (lng: number, lat: number) => unknown;
  DrivingRoute: new (map: unknown, options: { renderOptions: { map: unknown; autoViewport: boolean }; onSearchComplete: () => void }) => { search: (from: unknown, to: unknown) => void };
}

const scriptLoaders = new Map<string, Promise<void>>();

/**
 * 加载第三方地图 SDK 脚本。
 * 参数：script id 和完整 URL；同一个 URL 复用 Promise，避免 React 重渲染重复注入脚本。
 * 返回值：脚本加载完成 Promise，失败时交给页面显示 Web fallback。
 */
function loadMapScript(id: string, url: string) {
  const cached = scriptLoaders.get(id);
  if (cached) return cached;
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === 'true') return Promise.resolve();

  const loader = new Promise<void>((resolve, reject) => {
    const script = existing || document.createElement('script');
    script.id = id;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`${id} load failed`));
    if (!existing) {
      script.src = url;
      document.head.appendChild(script);
    }
  });
  scriptLoaders.set(id, loader);
  return loader;
}

/**
 * 加载百度地图 SDK，使用官方 callback 形态判断初始化完成。
 * 参数：Web SDK key 和 sdkUrl。
 * 返回值：callback 被触发后 resolve，网络失败 reject。
 */
function loadBaiduMapScript(key: string, sdkUrl: string) {
  const callbackName = '__mimiBaiduMapReady';
  const id = 'mimi-baidu-map-sdk';
  const url = `${sdkUrl}?v=3.0&type=webgl&ak=${encodeURIComponent(key)}&callback=${callbackName}`;
  if ((window as unknown as { BMapGL?: BaiduMapSdk }).BMapGL) return Promise.resolve();
  const cached = scriptLoaders.get(id);
  if (cached) return cached;
  const loader = new Promise<void>((resolve, reject) => {
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = url;
    script.onerror = () => reject(new Error('baidu map load failed'));
    document.head.appendChild(script);
  });
  scriptLoaders.set(id, loader);
  return loader;
}

function pointLabel(point?: LocationPoint) {
  return point?.address || '--';
}

function NavigationMapPanel({ controller, order }: { controller: MimiAppController; order?: ServiceOrder | null }) {
  const { orders, ui } = controller;
  const mapRef = React.useRef<HTMLDivElement | null>(null);
  const [mapStatus, setMapStatus] = React.useState<MapRenderStatus>('idle');
  const [mapMessage, setMapMessage] = React.useState('');
  const sdkConfig = orders.navigationSdkConfig;
  const links = orders.navigationLinks;
  const canRoute = Boolean(order?.pickup && order.destination);
  const provider = sdkConfig?.providers.amap.enabled ? 'amap' : sdkConfig?.providers.baidu.enabled ? 'baidu' : '';

  React.useEffect(() => {
    let active = true;
    const container = mapRef.current;
    const pickup = order?.pickup;
    const destination = order?.destination;
    if (!container || !pickup || !destination) {
      setMapStatus('fallback');
      setMapMessage('当前订单缺少完整起终点。');
      return;
    }
    if (!sdkConfig?.enabled || !provider) {
      setMapStatus('fallback');
      setMapMessage('未配置地图 SDK，使用 Web 导航。');
      return;
    }

    const renderRoute = async () => {
      try {
        setMapStatus('loading');
        setMapMessage('正在加载地图路线');
        container.innerHTML = '';
        if (provider === 'amap') {
          const amap = sdkConfig.providers.amap;
          await loadMapScript('mimi-amap-sdk', `${amap.sdkUrl}?v=2.0&key=${encodeURIComponent(amap.key)}&plugin=AMap.Driving`);
          const AMap = (window as unknown as { AMap?: AMapSdk }).AMap;
          if (!AMap) throw new Error('AMap SDK missing');
          const map = new AMap.Map(container, { zoom: 12, center: [pickup.lng, pickup.lat] });
          const driving = new AMap.Driving({ map });
          driving.search([pickup.lng, pickup.lat], [destination.lng, destination.lat], (status) => {
            if (!active) return;
            setMapStatus(status === 'complete' ? 'ready' : 'failed');
            setMapMessage(status === 'complete' ? '已生成高德地图路线' : '高德路线生成失败，请使用 Web 导航。');
          });
          return;
        }

        const baidu = sdkConfig.providers.baidu;
        await loadBaiduMapScript(baidu.key, baidu.sdkUrl);
        const BMapGL = (window as unknown as { BMapGL?: BaiduMapSdk }).BMapGL;
        if (!BMapGL) throw new Error('Baidu SDK missing');
        const map = new BMapGL.Map(container);
        const from = new BMapGL.Point(pickup.lng, pickup.lat);
        const to = new BMapGL.Point(destination.lng, destination.lat);
        map.centerAndZoom(from, 13);
        map.enableScrollWheelZoom?.(true);
        const driving = new BMapGL.DrivingRoute(map, {
          renderOptions: { map, autoViewport: true },
          onSearchComplete: () => {
            if (!active) return;
            setMapStatus('ready');
            setMapMessage('已生成百度地图路线');
          },
        });
        driving.search(from, to);
      } catch {
        if (!active) return;
        setMapStatus('failed');
        setMapMessage('地图 SDK 加载失败，请使用 Web 导航。');
      }
    };

    void renderRoute();
    return () => {
      active = false;
    };
  }, [order?.destination, order?.pickup, provider, sdkConfig]);

  return (
    <section className="section-card navigation-panel">
      <div className="section-head">
        <div>
          <h3>{order?.title || '订单导航'}</h3>
          <p>{pointLabel(order?.pickup)} → {pointLabel(order?.destination)}</p>
        </div>
        <span className={['mini-status', mapStatus === 'ready' ? 'green' : mapStatus === 'failed' ? 'danger' : ''].join(' ')}>
          {orders.navigationStatus}
        </span>
      </div>

      <div className="map-route-card">
        <div className="map-route-card__meta">
          <span>起</span>
          <p>{pointLabel(order?.pickup)}</p>
          <span>终</span>
          <p>{pointLabel(order?.destination)}</p>
        </div>
        <div className="map-canvas" ref={mapRef}>
          {mapStatus !== 'ready' ? <span>{mapMessage || '等待地图配置'}</span> : null}
        </div>
      </div>

      {orders.navigationIssue ? <p className="form-error">{orders.navigationIssue}</p> : null}
      {mapMessage && mapStatus !== 'ready' ? <p className="muted-text">{mapMessage}</p> : null}

      <div className="order-actions compact-top">
        {links?.amap ? <a className="ghost-btn" href={links.amap} rel="noreferrer" target="_blank">高德 App</a> : null}
        {links?.baidu ? <a className="ghost-btn" href={links.baidu} rel="noreferrer" target="_blank">百度 App</a> : null}
        {links?.webFallback || orders.navigationUrl ? (
          <a className="primary-btn" href={links?.webFallback || orders.navigationUrl} rel="noreferrer" target="_blank">
            打开 Web 导航
          </a>
        ) : null}
        {!canRoute ? <p className="muted-text">当前订单缺少完整起终点。</p> : null}
      </div>
      <div className="order-actions compact-top">
        <button className="ghost-btn" onClick={() => void orders.refreshNavigationSdkConfig()} type="button">重试地图配置</button>
        <button className="ghost-btn" disabled={ui.busyKey === `location-${order?.id}`} onClick={() => void orders.reportOrderLocation()} type="button">上报当前位置</button>
      </div>
    </section>
  );
}

function FlowShell({ controller, title, children }: { controller: MimiAppController; title: string; children: React.ReactNode }) {
  return (
    <section className="page-stack flow-page">
      <div className="flow-header">
        <button className="ghost-btn compact-btn" onClick={() => controller.ui.returnToTab()} type="button">返回</button>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ProviderList({ controller, mode }: { controller: MimiAppController; mode: 'provider' }) {
  return (
    <section className="section-card">
      <div className="provider-list">
        {controller.dashboard.providerCards.map((card) => (
          <button className="provider-row as-button" key={card.userId} onClick={() => controller.ui.navigateToScreen(card.vehicleType ? 'driver_detail' : 'provider_detail', { providerUserId: card.userId })} type="button">
            <div className="emoji-avatar">{card.avatar}</div>
            <div>
              <strong>{card.nickname}</strong>
              <p>{card.baseDistrict} · {card.tags.slice(0, 2).join(' / ') || '可接单'}</p>
            </div>
            <span className="score-pill">{card.score.toFixed(1)}</span>
          </button>
        ))}
      </div>
      {mode ? null : null}
    </section>
  );
}

function OrderFlow({ controller, order }: { controller: MimiAppController; order: NonNullable<MimiAppController['orders']['selectedOrder']> }) {
  const { ui, orders } = controller;
  const meta = orderStatusMeta[order.status];
  return (
    <>
      <section className={['order-detail-hero', meta.tone].join(' ')}>
        <span>{meta.label}</span>
        <h2>{order.title}</h2>
        <p>#{order.id} · {meta.desc}</p>
      </section>
      <section className="section-card">
        <div className="detail-grid">
          <DetailItem label="订单金额" value={currency(order.amountFen)} />
          <DetailItem label="定金" value={currency(order.depositFen || order.amountFen)} />
          <DetailItem label="服务时间" value={formatDateTime(order.serviceTime)} />
          <DetailItem label="支付状态" value={(order as { paymentStatus?: string }).paymentStatus || '--'} />
        </div>
        <div className="order-actions">
          {order.status === 'pending_payment' ? <button className="primary-btn" disabled={ui.busyKey === `pay-${order.id}`} onClick={() => void orders.payOrder(order)} type="button">{ui.screen === 'payment_confirm' ? '确认支付' : '进入支付'}</button> : null}
          {order.status === 'paid' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'confirm-arrival')} type="button">标记到达</button> : null}
          {order.status === 'arriving' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'start-service')} type="button">开始服务</button> : null}
          {order.status === 'serving' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'complete')} type="button">完成订单</button> : null}
          <button className="ghost-btn" onClick={() => ui.navigateToScreen('navigation', { orderId: order.id })} type="button">导航与位置</button>
          <button className="ghost-btn" onClick={() => ui.navigateToScreen('conversation', { orderId: order.id })} type="button">订单会话</button>
          <button className="ghost-btn" onClick={() => ui.navigateToScreen('refund', { orderId: order.id })} type="button">退款/售后</button>
        </div>
        {ui.screen === 'payment_result' ? (
          <div className="detail-box compact-top">
            <h3>支付结果</h3>
            <p>{orders.paymentCache[order.id]?.outTradeNo || '本地支付已完成'} · {orders.paymentCache[order.id]?.status || order.status}</p>
          </div>
        ) : null}
      </section>
      <section className="section-card">
        <div className="section-head">
          <div>
            <h3>订单时间线</h3>
            <p>来自 Python 订单事件。</p>
          </div>
        </div>
        <div className="timeline">
          {orders.selectedOrderEvents.map((event) => (
            <div className="timeline-item" key={event.id}>
              <span className="timeline-dot" />
              <div>
                <strong>{event.eventType}</strong>
                <p>{formatDateTime(event.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function AuxiliaryScreen({ controller }: { controller: MimiAppController }) {
  const { ui, profile, orders, policy, governance } = controller;
  const titleMap: Record<string, string> = {
    care_feedback: '照护服务反馈',
    pets: '宠物档案',
    addresses: '地址管理',
    favorites: '收藏夹',
    payments: '支付记录',
    refund: '退款申请',
    dispute: '争议/投诉',
    provider_onboarding: '闲人入驻',
    provider_workspace: '服务者工作台',
    offer_management: '报价管理',
    admin: '管理后台',
  };
  const title = titleMap[ui.screen] || '功能页';
  const canSubmitFeedback = Boolean(orders.selectedOrder && profile.user?.id === orders.selectedOrder.sellerUserId);
  return (
    <FlowShell controller={controller} title={title}>
      <section className="section-card">
        <div className="section-head">
          <div>
            <h3>{title}</h3>
            <p>{auxiliaryDescription(ui.screen)}</p>
          </div>
        </div>
        <div className="detail-grid">
          <DetailItem label="当前用户" value={profile.user?.nickname || '--'} />
          <DetailItem label="相关订单" value={ui.screenParams.orderId || orders.selectedOrder?.id || '--'} />
        </div>
        {ui.screen === 'pets' ? (
          <div className="offer-list compact-top">
            <button
              className="primary-btn"
              disabled={ui.busyKey === 'create-pet'}
              onClick={() => void profile.createDemoPet()}
              type="button"
            >
              新增宠物档案
            </button>
            {profile.pets.map((pet) => (
              <article className="offer-card" key={pet.id}>
                <div>
                  <strong>{pet.avatar || '🐱'} {pet.name}</strong>
                  <p>{pet.breed || '未填写品种'} · {pet.weight || '未填写体重'}</p>
                  <p>{pet.vaccine || '疫苗信息待补充'} · {pet.certificate || '检疫证明待办理'}</p>
                </div>
                <span className="mini-status">{formatDateTime(pet.updatedAt)}</span>
              </article>
            ))}
            {!profile.pets.length ? (
              <EmptyBlock description="保存后会写入 Python/PostgreSQL，并在这里展示。" image={assets.homeCat} title="暂无宠物档案" />
            ) : null}
          </div>
        ) : null}
        {ui.screen === 'addresses' ? (
          <div className="offer-list compact-top">
            <button
              className="primary-btn"
              disabled={ui.busyKey === 'create-address'}
              onClick={() => void profile.createDemoAddress()}
              type="button"
            >
              新增常用地址
            </button>
            {profile.addresses.map((address) => (
              <article className="offer-card" key={address.id}>
                <div>
                  <strong>{address.label}{address.isDefault ? ' · 默认' : ''}</strong>
                  <p>{address.district || '杭州'} · {address.address}</p>
                  <p>{address.contactName || profile.user?.nickname || '--'} · {address.contactPhone || profile.user?.phone || '--'}</p>
                </div>
                <span className="mini-status">{formatDateTime(address.updatedAt)}</span>
              </article>
            ))}
            {!profile.addresses.length ? (
              <EmptyBlock description="保存后会作为发单和接送地址的用户资料。" image={assets.routeDog} title="暂无常用地址" />
            ) : null}
          </div>
        ) : null}
        {ui.screen === 'provider_onboarding' ? (
          <button className="primary-btn compact-top" onClick={() => void profile.applyAsProvider()} type="button">提交入驻申请</button>
        ) : null}
        {ui.screen === 'care_feedback' ? (
          <div className="compact-top">
            <div className="form-grid">
              <label className="full-span">
                服务反馈
                <textarea
                  rows={3}
                  value={orders.feedbackDraft}
                  onChange={(event) => orders.setFeedbackDraft(event.target.value)}
                />
              </label>
            </div>
            <button
              className="primary-btn"
              disabled={!canSubmitFeedback || ui.busyKey === `feedback-${ui.screenParams.orderId || orders.selectedOrder?.id}`}
              onClick={() => void orders.submitFeedback(ui.screenParams.orderId)}
              type="button"
            >
              {canSubmitFeedback ? '提交照护反馈' : '服务者可提交照护反馈'}
            </button>
            <div className="feedback-list compact-top">
              {orders.orderFeedbacks.map((feedback) => (
                <article className="feedback-card" key={feedback.id}>
                  <strong>{formatDateTime(feedback.createdAt)}</strong>
                  <p>{feedback.note || '服务反馈已提交'}</p>
                  <div className="tag-row">
                    {feedback.photoUrls.map((item) => (
                      <a className="tag" href={item} key={item} rel="noreferrer" target="_blank">反馈图片</a>
                    ))}
                    {feedback.videoUrls.map((item) => (
                      <a className="tag" href={item} key={item} rel="noreferrer" target="_blank">反馈视频</a>
                    ))}
                  </div>
                </article>
              ))}
              {!orders.orderFeedbacks.length ? (
                <EmptyBlock description="提交反馈后会在当前订单下持续展示。" image={assets.postCarrier} title="暂无服务反馈" />
              ) : null}
            </div>
          </div>
        ) : null}
        {ui.screen === 'refund' ? (
          <button className="danger-btn compact-top" onClick={() => void governance.submitDispute()} type="button">提交退款争议</button>
        ) : null}
        {ui.screen === 'dispute' ? (
          <div className="order-actions compact-top">
            <button className="danger-btn" onClick={() => void governance.submitComplaint()} type="button">提交投诉</button>
            <button className="ghost-btn" onClick={() => void governance.submitDispute()} type="button">提交争议</button>
          </div>
        ) : null}
        {ui.screen === 'favorites' ? (
          <div className="policy-doc-list compact-top">
            {policy.policyFavorites.map((favorite) => (
              <article className="policy-doc" key={favorite.id}>
                <strong>{favorite.title}</strong>
                <p>{favorite.district || '全部区县'} · {formatDateTime(favorite.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : null}
        {ui.screen === 'admin' ? (
          <div className="compact-top">
            <button className="primary-btn" disabled={ui.busyKey === 'admin-dashboard'} onClick={() => void governance.loadAdminDashboard()} type="button">刷新管理数据</button>
            {governance.adminDashboard ? (
              <div className="detail-grid compact-top">
                <DetailItem label="服务者申请" value={String(governance.adminDashboard.providerApplications.length)} />
                <DetailItem label="投诉" value={String(governance.adminDashboard.complaints.length)} />
                <DetailItem label="争议" value={String(governance.adminDashboard.disputes.length)} />
                <DetailItem label="退款" value={String(governance.adminDashboard.refunds.length)} />
              </div>
            ) : null}
          </div>
        ) : null}
        {ui.screen === 'offer_management' ? (
          <div className="offer-list compact-top">
            {controller.publish.latestOffers.map((offer) => (
              <article className="offer-card" key={offer.id}>
                <div>
                  <strong>{controller.dashboard.providerCardMap[offer.providerUserId]?.nickname || offer.providerUserId}</strong>
                  <p>{currency(offer.quoteAmountFen)} · {offer.status}</p>
                </div>
                <span className="mini-status">{offer.status}</span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </FlowShell>
  );
}

function auxiliaryDescription(screen: string): string {
  if (['dispute', 'admin'].includes(screen)) return '治理类主写能力已接入平台后端，当前 H5 保留处理入口和状态。';
  if (screen === 'pets') return '宠物档案已接入 Python/PostgreSQL，可通过 H5 创建并读取。';
  if (screen === 'addresses') return '常用地址已接入 Python/PostgreSQL，可作为发单和接送资料。';
  if (screen === 'care_feedback') return '照护反馈会写入订单记录，并同步更新订单反馈摘要。';
  if (['favorites', 'payments'].includes(screen)) return '该页面展示用户侧资料和交易辅助信息。';
  return '该流程页已纳入 H5 导航体系，可从主链路进入。';
}

function screenTitle(screen: string): string {
  if (screen === 'order_confirm') return '订单确认';
  if (screen === 'payment_confirm') return '支付确认';
  if (screen === 'payment_result') return '支付结果';
  return '订单详情';
}
