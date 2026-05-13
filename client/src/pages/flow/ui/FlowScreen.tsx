import React from 'react';
import { orderStatusMeta } from '../../../features/mimi-dashboard/config/constants';
import { currency, formatDateTime, serviceLabel } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { DetailItem, EmptyBlock } from '../../../shared/ui/common';

export function FlowScreen({ controller }: { controller: MimiAppController }) {
  const { ui, dashboard, publish, orders, messages, policy, profile } = controller;
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
        <section className="section-card">
          <div className="section-head">
            <div>
              <h3>{order?.title || '订单导航'}</h3>
              <p>{order?.pickup?.address || '--'} → {order?.destination?.address || '--'}</p>
            </div>
          </div>
          {orders.navigationUrl ? <a className="primary-btn" href={orders.navigationUrl} rel="noreferrer" target="_blank">打开 Web 导航</a> : <p className="muted-text">当前订单缺少完整起终点。</p>}
          <button className="ghost-btn compact-top" onClick={() => void orders.reportOrderLocation()} type="button">上报当前位置</button>
        </section>
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
          </section>
        ) : (
          <EmptyBlock description="请选择一篇政策文档。" image={assets.policyCat} title="暂无政策详情" />
        )}
      </FlowShell>
    );
  }

  return <AuxiliaryScreen controller={controller} />;
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
          {order.status === 'pending_payment' ? <button className="primary-btn" disabled={ui.busyKey === `pay-${order.id}`} onClick={() => void orders.payOrder(order)} type="button">确认并支付</button> : null}
          {order.status === 'paid' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'confirm-arrival')} type="button">标记到达</button> : null}
          {order.status === 'arriving' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'start-service')} type="button">开始服务</button> : null}
          {order.status === 'serving' ? <button className="secondary-btn" onClick={() => void orders.transitionOrder(order, 'complete')} type="button">完成订单</button> : null}
          <button className="ghost-btn" onClick={() => ui.navigateToScreen('navigation', { orderId: order.id })} type="button">导航与位置</button>
          <button className="ghost-btn" onClick={() => ui.navigateToScreen('refund', { orderId: order.id })} type="button">退款/售后</button>
        </div>
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
  const { ui, profile, orders } = controller;
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
        {ui.screen === 'provider_onboarding' ? (
          <button className="primary-btn compact-top" onClick={() => void profile.applyAsProvider()} type="button">提交入驻申请</button>
        ) : null}
        {ui.screen === 'care_feedback' ? (
          <button className="primary-btn compact-top" onClick={() => void orders.submitFeedback()} type="button">提交照护反馈</button>
        ) : null}
        {ui.screen === 'refund' ? (
          <button className="danger-btn compact-top" type="button">提交退款申请</button>
        ) : null}
      </section>
    </FlowShell>
  );
}

function auxiliaryDescription(screen: string): string {
  if (['dispute', 'admin'].includes(screen)) return '治理类主写能力将在 Phase 5 接入；当前 H5 保留入口和处理状态。';
  if (['pets', 'addresses', 'favorites', 'payments'].includes(screen)) return '该页面展示用户侧资料和交易辅助信息，后续可继续细化字段。';
  return '该流程页已纳入 H5 导航体系，可从主链路进入。';
}

function screenTitle(screen: string): string {
  if (screen === 'order_confirm') return '订单确认';
  if (screen === 'payment_confirm') return '支付确认';
  if (screen === 'payment_result') return '支付结果';
  return '订单详情';
}
