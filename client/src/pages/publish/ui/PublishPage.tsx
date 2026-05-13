import React from 'react';
import { districtCoordinates, serviceTypeOptions } from '../../../features/mimi-dashboard/config/constants';
import { currency, formatDateTime, isRideService, serviceLabel, serviceTitleTemplate } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { EmptyBlock, ToggleChip } from '../../../shared/ui/common';

export function PublishPage({ controller }: { controller: MimiAppController }) {
  const { ui, publish, dashboard } = controller;
  const { demandForm } = publish;

  return (
    <section className="page-stack publish-page">
      <section className="publish-hero">
        <div>
          <span className="eyebrow">智能发单</span>
          <h2>{serviceLabel(demandForm.serviceType)}</h2>
          <p>按移动端卡片顺序填写关键信息，提交后自动拉取推荐候选。</p>
        </div>
        <div className="publish-hero-price">
          <span>当前预估</span>
          <strong>{publish.quote ? currency(publish.quote.amountFen) : '--'}</strong>
          <small>{publish.quoteHint || '系统会自动刷新报价。'}</small>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>服务场景</h2>
          <span>先选类型</span>
        </div>
        <div className="publish-scene-grid">
          {serviceTypeOptions.map((item) => (
            <button
              className={['publish-scene-card', demandForm.serviceType === item.value ? 'active' : ''].join(' ')}
              key={item.value}
              onClick={() =>
                publish.setDemandForm((prev) => ({
                  ...prev,
                  serviceType: item.value,
                  title: serviceTitleTemplate(item.value),
                }))
              }
              type="button"
            >
              <span>{item.icon}</span>
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>需求概况</h2>
          <span>{serviceLabel(demandForm.serviceType)}</span>
        </div>
        <div className="form-grid">
          <label>
            需求标题
            <input
              value={demandForm.title}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <label>
            服务时间
            <input
              type="datetime-local"
              value={demandForm.serviceTime}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, serviceTime: event.target.value }))}
            />
          </label>
          <label className="full-span">
            需求说明
            <textarea
              rows={3}
              value={demandForm.description}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label className="full-span">
            宠物概况
            <textarea
              rows={2}
              value={demandForm.petSummary}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, petSummary: event.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>{isRideService(demandForm.serviceType) ? '路线与预算' : '地址与预算'}</h2>
          <span>越具体越准</span>
        </div>
        <div className="form-grid">
          <label>
            服务区县
            <select
              value={demandForm.district}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, district: event.target.value }))}
            >
              {Object.keys(districtCoordinates).map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label>
            可见半径（km）
            <input
              min={1}
              type="number"
              value={demandForm.visibilityRadiusKm}
              onChange={(event) =>
                publish.setDemandForm((prev) => ({ ...prev, visibilityRadiusKm: Number(event.target.value) || 1 }))
              }
            />
          </label>
          <label>
            预算下限（元）
            <input
              min={1}
              type="number"
              value={demandForm.budgetMinYuan}
              onChange={(event) =>
                publish.setDemandForm((prev) => ({ ...prev, budgetMinYuan: Number(event.target.value) || 1 }))
              }
            />
          </label>
          <label>
            预算上限（元）
            <input
              min={1}
              type="number"
              value={demandForm.budgetMaxYuan}
              onChange={(event) =>
                publish.setDemandForm((prev) => ({ ...prev, budgetMaxYuan: Number(event.target.value) || 1 }))
              }
            />
          </label>
          <label className="full-span">
            出发地址 / 上门地址
            <input
              value={demandForm.pickupAddress}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, pickupAddress: event.target.value }))}
            />
          </label>
          <label className="full-span">
            目的地 / 备注目的地
            <input
              value={demandForm.destinationAddress}
              onChange={(event) =>
                publish.setDemandForm((prev) => ({ ...prev, destinationAddress: event.target.value }))
              }
            />
          </label>
        </div>

        <div className="inline-fields compact-top">
          <label>
            宠物数量
            <input
              min={1}
              type="number"
              value={demandForm.petCount}
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, petCount: Number(event.target.value) || 1 }))}
            />
          </label>
          <label>
            携带方式
            <select
              value={demandForm.carrierType}
              onChange={(event) =>
                publish.setDemandForm((prev) => ({
                  ...prev,
                  carrierType: event.target.value as typeof prev.carrierType,
                }))
              }
            >
              <option value="none">无</option>
              <option value="cat_bag">猫包</option>
              <option value="crate">航空箱</option>
              <option value="stroller">推车</option>
            </select>
          </label>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>服务要求</h2>
          <span>按需勾选</span>
        </div>
        <div className="switch-grid">
          <ToggleChip label="允许议价" value={demandForm.allowBargain} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, allowBargain: value }))} />
          <ToggleChip label="需要上门" value={demandForm.needHomeVisit} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, needHomeVisit: value }))} />
          <ToggleChip label="需要喂药" value={demandForm.needMedication} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, needMedication: value }))} />
          <ToggleChip label="多日照护" value={demandForm.needMultiDayCare} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, needMultiDayCare: value }))} />
          <ToggleChip label="拍照反馈" value={demandForm.needPhotoFeedback} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, needPhotoFeedback: value }))} />
          <ToggleChip label="宠物友好车" value={demandForm.requirePetFriendlyVehicle} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, requirePetFriendlyVehicle: value }))} />
          <ToggleChip label="大后备箱" value={demandForm.requireLargeTrunk} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, requireLargeTrunk: value }))} />
          <ToggleChip label="驾驶平稳" value={demandForm.requireStableDriving} onChange={(value) => publish.setDemandForm((prev) => ({ ...prev, requireStableDriving: value }))} />
        </div>

        <div className="form-actions">
          <button className="primary-btn" disabled={ui.busyKey === 'publish'} onClick={() => void publish.submitDemand()} type="button">
            {ui.busyKey === 'publish' ? '发布中...' : '发布需求并拉取推荐'}
          </button>
        </div>
      </section>

      <section className="section-card publish-quote-card">
        <div className="section-head">
          <div>
            <h3>智能报价</h3>
            <p>{publish.quoteHint || '根据区域、服务类型与要求预估价格。'}</p>
          </div>
          <span className="price-badge">{publish.quote ? currency(publish.quote.amountFen) : '--'}</span>
        </div>
        <div className="price-list">
          {(publish.quote?.breakdown || []).map((item) => (
            <div className="price-row" key={item.code}>
              <span>{item.label}</span>
              <strong>{currency(item.amountFen)}</strong>
            </div>
          ))}
        </div>
      </section>

      {publish.latestDemand ? (
        <section className="section-card publish-demand-card">
          <div className="section-head">
            <div>
              <h3>最新需求</h3>
              <p>{publish.latestDemand.title} · {formatDateTime(publish.latestDemand.serviceTime)}</p>
            </div>
            <button className="ghost-btn compact-btn" onClick={() => void publish.runRecommendations(publish.latestDemand!)} type="button">
              刷新推荐
            </button>
          </div>
          <div className="demand-summary">
            <span className="status-chip">{publish.latestDemand.status}</span>
            <span>{publish.latestDemand.pickup?.district || demandForm.district}</span>
            <span>{currency(publish.latestDemand.budgetMax)}</span>
          </div>
        </section>
      ) : null}

      <section className="section-card">
        <div className="section-head">
          <div>
            <h3>推荐候选</h3>
            <p>优先展示更合适、更可靠、成交经验更强的服务者。</p>
          </div>
        </div>
        {publish.recommendations.length ? (
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
                  <span>{candidate.distanceKm ? `${candidate.distanceKm.toFixed(1)} km` : '按区筛选'}</span>
                  <span>{candidate.etaMinutes ? `${candidate.etaMinutes} 分钟可到` : '支持快速响应'}</span>
                  <span>{currency(candidate.priceHintFen)}</span>
                </div>
                <div className="tag-row">
                  {candidate.tags.slice(0, 4).map((tag) => (
                    <span className="tag" key={tag}>{tag}</span>
                  ))}
                </div>
                <ul className="reason-list">
                  {candidate.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <button
                  className="primary-btn"
                  disabled={ui.busyKey === `pick-${candidate.providerUserId}`}
                  onClick={() => void publish.pickRecommendation(candidate)}
                  type="button"
                >
                  {ui.busyKey === `pick-${candidate.providerUserId}` ? '生成中...' : '生成报价并下单'}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyBlock
            description="还没有推荐结果。发布需求后会自动调用匹配服务。"
            image={assets.adoptCat}
            title="等待推荐候选"
          />
        )}
      </section>

      <section className="section-card">
        <div className="section-head">
          <div>
            <h3>已生成报价</h3>
            <p>支持重复进入查看，不再允许同服务者重复有效报价。</p>
          </div>
        </div>
        {publish.latestOffers.length ? (
          <div className="offer-list">
            {publish.latestOffers.map((offer) => (
              <article className="offer-card" key={offer.id}>
                <div>
                  <strong>{dashboard.providerCardMap[offer.providerUserId]?.nickname || offer.providerUserId}</strong>
                  <p>{currency(offer.quoteAmountFen)} · {offer.status}</p>
                </div>
                <span className="mini-status">{offer.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">暂无报价记录。</p>
        )}
      </section>
    </section>
  );
}
