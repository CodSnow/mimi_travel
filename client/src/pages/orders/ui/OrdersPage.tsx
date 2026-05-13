import React from 'react';
import { orderFilters, orderStatusMeta } from '../../../features/mimi-dashboard/config/constants';
import { currency, formatDateTime, getOrderFilterCount, getOrderProgress } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { DetailItem, EmptyBlock } from '../../../shared/ui/common';

export function OrdersPage({ controller }: { controller: MimiAppController }) {
  const { ui, orders } = controller;
  const selectedOrder = orders.selectedOrder;
  const selectedOrderStatus = orders.selectedOrderStatus;

  return (
    <section className="page-stack orders-page">
      <section className="orders-hero">
        <div>
          <span className="eyebrow">订单中心</span>
          <h2>{selectedOrder ? selectedOrder.title : '我的订单'}</h2>
          <p>{selectedOrderStatus?.desc || '默认展示当前用户参与的全部订单。'}</p>
        </div>
        <div className="orders-overview-grid">
          <article>
            <strong>{orders.orders.length}</strong>
            <span>全部</span>
          </article>
          <article>
            <strong>{getOrderFilterCount(orders.orders, 'pending')}</strong>
            <span>待支付</span>
          </article>
          <article>
            <strong>{getOrderFilterCount(orders.orders, 'processing')}</strong>
            <span>进行中</span>
          </article>
        </div>
      </section>

      <div className="order-tabs">
        {orderFilters.map((item) => (
          <button
            className={orders.orderFilter === item.key ? 'active' : ''}
            key={item.key}
            onClick={() => orders.setOrderFilter(item.key)}
            type="button"
          >
            {item.label}
            <span>{getOrderFilterCount(orders.orders, item.key)}</span>
          </button>
        ))}
      </div>

      <section className="section-card">
        {orders.filteredOrders.length ? (
          <div className="order-list">
            {orders.filteredOrders.map((order) => {
              const meta = orderStatusMeta[order.status];
              return (
                <button
                  className={[
                    'order-card',
                    orders.selectedOrderId === order.id ? 'is-active' : '',
                    meta.tone,
                  ].join(' ')}
                  key={order.id}
                  onClick={() => void orders.loadOrderDetail(order.id)}
                  type="button"
                >
                  <div>
                    <span className="order-status">{meta.label}</span>
                    <h3>{order.title}</h3>
                    <p className="small">#{order.id} · {formatDateTime(order.serviceTime)} · {currency(order.amountFen)}</p>
                  </div>
                  <span className="mini-action ghost-inline">查看</span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyBlock description="先去发布需求并选择服务者。" image={assets.homeCat} title="暂无订单" />
        )}
      </section>

      {selectedOrder ? (
        <>
          <section className={['order-detail-hero', selectedOrderStatus?.tone || 'warm'].join(' ')}>
            <span>{selectedOrderStatus?.label}</span>
            <h2>{selectedOrder.title}</h2>
            <p>#{selectedOrder.id} · {selectedOrderStatus?.desc}</p>
          </section>

          <section className="progress-card">
            {getOrderProgress(selectedOrder).map((step) => (
              <span className={[step.active ? 'active' : '', step.cancelled ? 'cancelled' : ''].join(' ')} key={step.label}>
                {step.label}
              </span>
            ))}
          </section>

          <section className="section-card">
            <div className="detail-grid">
              <DetailItem label="订单号" value={selectedOrder.id} />
              <DetailItem label="服务时间" value={formatDateTime(selectedOrder.serviceTime)} />
              <DetailItem label="订单金额" value={currency(selectedOrder.amountFen)} />
              <DetailItem label="定金" value={currency(selectedOrder.depositFen || selectedOrder.amountFen)} />
            </div>

            <div className="tag-row">
              {selectedOrder.driverSnapshot?.tags?.map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
              {selectedOrder.caregiverSnapshot?.tags?.map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>

            <div className="order-actions">
              {selectedOrder.status === 'pending_payment' ? (
                <button
                  className="primary-btn"
                  disabled={ui.busyKey === `pay-${selectedOrder.id}`}
                  onClick={() => void orders.payOrder(selectedOrder)}
                  type="button"
                >
                  {ui.busyKey === `pay-${selectedOrder.id}` ? '支付中...' : '支付定金'}
                </button>
              ) : null}
              {selectedOrder.status === 'paid' ? (
                <button
                  className="secondary-btn"
                  disabled={ui.busyKey === `confirm-arrival-${selectedOrder.id}`}
                  onClick={() => void orders.transitionOrder(selectedOrder, 'confirm-arrival')}
                  type="button"
                >
                  标记已到达
                </button>
              ) : null}
              {selectedOrder.status === 'arriving' ? (
                <button
                  className="secondary-btn"
                  disabled={ui.busyKey === `start-service-${selectedOrder.id}`}
                  onClick={() => void orders.transitionOrder(selectedOrder, 'start-service')}
                  type="button"
                >
                  开始服务
                </button>
              ) : null}
              {selectedOrder.status === 'serving' ? (
                <button
                  className="secondary-btn"
                  disabled={ui.busyKey === `complete-${selectedOrder.id}`}
                  onClick={() => void orders.transitionOrder(selectedOrder, 'complete')}
                  type="button"
                >
                  完成订单
                </button>
              ) : null}
              {['pending_payment', 'paid', 'arriving', 'serving'].includes(selectedOrder.status) ? (
                <button
                  className="ghost-btn"
                  disabled={ui.busyKey === `cancel-${selectedOrder.id}`}
                  onClick={() => void orders.transitionOrder(selectedOrder, 'cancel')}
                  type="button"
                >
                  取消订单
                </button>
              ) : null}
            </div>

            <div className="order-actions compact-top">
              <button
                className="ghost-btn"
                disabled={ui.busyKey === `location-${selectedOrder.id}`}
                onClick={() => void orders.reportOrderLocation()}
                type="button"
              >
                上报位置
              </button>
              {orders.navigationUrl ? (
                <a className="link-btn" href={orders.navigationUrl} rel="noreferrer" target="_blank">
                  打开导航
                </a>
              ) : null}
            </div>

            {orders.paymentCache[selectedOrder.id] ? (
              <div className="detail-box compact-top">
                <h3>最近支付</h3>
                <p>{orders.paymentCache[selectedOrder.id].outTradeNo} · {orders.paymentCache[selectedOrder.id].status}</p>
              </div>
            ) : null}

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
      ) : null}

      {selectedOrder?.status === 'completed' ? (
        <section className="section-card">
          <div className="section-head">
            <div>
              <h3>评价与反馈</h3>
              <p>完成订单后即可提交评价与服务反馈。</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              评分
              <input
                max={5}
                min={1}
                type="number"
                value={orders.reviewDraft.score}
                onChange={(event) => orders.setReviewDraft((prev) => ({ ...prev, score: Number(event.target.value) || 5 }))}
              />
            </label>
            <label className="full-span">
              评价内容
              <textarea
                rows={3}
                value={orders.reviewDraft.content}
                onChange={(event) => orders.setReviewDraft((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
          </div>
          <button className="primary-btn" disabled={ui.busyKey === `review-${selectedOrder.id}`} onClick={() => void orders.submitReview()} type="button">
            提交评价
          </button>

          <div className="form-grid compact-top">
            <label className="full-span">
              服务反馈
              <textarea
                rows={3}
                value={orders.feedbackDraft}
                onChange={(event) => orders.setFeedbackDraft(event.target.value)}
              />
            </label>
          </div>
          <button className="secondary-btn" disabled={ui.busyKey === `feedback-${selectedOrder.id}`} onClick={() => void orders.submitFeedback()} type="button">
            记录服务反馈
          </button>

          {orders.orderFeedbacks.length ? (
            <div className="feedback-list">
              {orders.orderFeedbacks.map((feedback) => (
                <article className="feedback-card" key={feedback.id}>
                  <strong>{formatDateTime(feedback.createdAt)}</strong>
                  <p>{feedback.note || '服务反馈已提交'}</p>
                  <div className="tag-row">
                    {feedback.photoUrls.map((item) => (
                      <a className="tag" href={item} key={item} rel="noreferrer" target="_blank">反馈图片</a>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
