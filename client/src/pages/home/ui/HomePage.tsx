import React from 'react';
import { postCards } from '../../../features/mimi-dashboard/config/constants';
import { serviceTitleTemplate } from '../../../features/mimi-dashboard/lib/helpers';
import type { MimiAppController } from '../../../features/mimi-dashboard/model/useMimiAppController';
import { assets } from '../../../shared/lib/assets';
import { EmptyBlock } from '../../../shared/ui/common';
import { SmartImage } from '../../../shared/ui/SmartImage';

export function HomePage({ controller }: { controller: MimiAppController }) {
  const { ui, home, publish, profile, dashboard, policy } = controller;
  const { demandForm } = publish;

  return (
    <section className="page-stack home-page">
      <div className="location-row">
        <button className="location" onClick={() => ui.setActiveTab('policy')} type="button">
          <span>杭州{demandForm.district}</span>
          <span className="location-chevron">⌄</span>
        </button>
        <button className="ghost-btn compact-btn" onClick={() => void dashboard.syncDashboard()} type="button">
          刷新
        </button>
      </div>

      <section className="hero-carousel" aria-label="首页活动轮播">
        <div className="hero-track" style={{ transform: `translateX(-${home.bannerIndex * 100}%)` }}>
          <article className="hero-panel hero-panel--rail">
            <span className="eyebrow hero-eyebrow">📰 最新咪咪消息</span>
            <h2>高铁终于可以带猫啦！</h2>
            <p>你知道携宠进站的规范吗？</p>
            <SmartImage alt="高铁携宠" className="hero-cat rail-cat" fallbackLabel="高铁携宠" src={assets.bannerCat} />
            <button
              className="hero-link"
              onClick={() => {
                policy.setPolicyQuestion('高铁带猫出行有哪些注意事项？');
                ui.setActiveTab('policy');
              }}
              type="button"
            >
              查看政策 →
            </button>
          </article>
          <article className="hero-panel hero-panel--adopt">
            <span className="eyebrow hero-eyebrow">🐱 领养代替购买</span>
            <h2>上门照护和陪同办证都能约</h2>
            <p>从发单到支付，H5 现在已经能完整闭环。</p>
            <SmartImage alt="领养与照护" className="hero-cat adopt-cat" fallbackLabel="咪咪服务" src={assets.adoptCat} />
            <button className="hero-link" onClick={() => ui.setActiveTab('publish')} type="button">
              立即发需求 →
            </button>
          </article>
        </div>
        <div className="hero-dots" aria-label="切换首页活动">
          {[0, 1].map((item) => (
            <button
              aria-label={`查看第 ${item + 1} 个活动`}
              className={home.bannerIndex === item ? 'active' : ''}
              key={item}
              onClick={() => home.setBannerIndex(item)}
              type="button"
            />
          ))}
        </div>
      </section>

      <div className="scene-tabs">
        <button
          className={['scene-tab', home.homeTab === 'buddy' ? 'active' : ''].join(' ')}
          onClick={() => home.setHomeTab('buddy')}
          type="button"
        >
          👩 摇人陪咪
        </button>
        <button
          className={['scene-tab', home.homeTab === 'car' ? 'active' : ''].join(' ')}
          onClick={() => {
            home.setHomeTab('car');
            publish.setDemandForm((prev) => ({
              ...prev,
              serviceType: 'ride',
              title: serviceTitleTemplate('ride'),
            }));
          }}
          type="button"
        >
          咪咪出行
        </button>
      </div>

      {home.homeTab === 'buddy' ? (
        <>
          <button className="idle-home-cta" onClick={() => ui.navigateToScreen('provider_onboarding')} type="button">
            <strong>💰 成为闲人，赚生活费！</strong>
            <span>立即申请 <i>→</i></span>
          </button>

          <h2 className="home-section-title">{demandForm.district} 推荐闲人</h2>
          {home.buddyProviders.length ? (
            <section className="buddy-list" aria-label="可预约陪咪人">
              {home.buddyProviders.map((card) => (
                <article className="buddy-card" key={card.userId}>
                  <div className="buddy-avatar" aria-hidden="true">
                    <span>{card.avatar}</span>
                  </div>
                  <div className="buddy-info">
                    <h3>{card.nickname}</h3>
                    <p>{card.score.toFixed(1)} 分｜{card.baseDistrict}｜{card.completedOrderCount} 单经验</p>
                  </div>
                  <button
                    className="mini-action"
                    onClick={() => ui.navigateToScreen('provider_detail', { providerUserId: card.userId })}
                    type="button"
                  >
                    约 TA
                  </button>
                </article>
              ))}
            </section>
          ) : (
            <EmptyBlock description="服务者数据同步后会在这里展示。" image={assets.windCat} title="正在加载陪咪人" />
          )}
        </>
      ) : (
        <>
          <section className="ride-card">
            <span className="route-line" />
            <span className="mark start">发</span>
            <span className="mark end">收</span>
            <div className="route-input-group start-field">
              <input
                className="route-input pickup-input"
                onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, pickupAddress: event.target.value }))}
                placeholder="输入出发地"
                value={publish.demandForm.pickupAddress}
              />
              <span className="readonly-contact">{profile.user?.phone || '先补充手机号更方便联系'}</span>
            </div>
            <input
              className="route-input destination-input"
              onChange={(event) => publish.setDemandForm((prev) => ({ ...prev, destinationAddress: event.target.value }))}
              placeholder="输入宠物目的地"
              value={publish.demandForm.destinationAddress}
            />
          </section>

          <div className="hero-actions">
            <button
              className="primary-btn"
              onClick={() => {
                publish.setDemandForm((prev) => ({
                  ...prev,
                  serviceType: 'ride',
                  title: serviceTitleTemplate('ride'),
                }));
                ui.setActiveTab('publish');
              }}
              type="button"
            >
              马上叫车
            </button>
            <button className="ghost-btn" onClick={() => ui.setActiveTab('orders')} type="button">
              查看订单
            </button>
          </div>

          <h2 className="home-section-title">宠物友好司机</h2>
          {home.rideProviders.length ? (
            <section className="buddy-list" aria-label="可预约顺风车司机">
              {home.rideProviders.map((card) => (
                <article className="buddy-card" key={card.userId}>
                  <div className="buddy-avatar" aria-hidden="true">
                    <span>{card.avatar}</span>
                  </div>
                  <div className="buddy-info">
                    <h3>{card.nickname}</h3>
                    <p>{card.baseDistrict}｜{card.tags.slice(0, 2).join('｜') || '宠物友好接送'}</p>
                  </div>
                  <button className="mini-status" onClick={() => ui.navigateToScreen('driver_detail', { providerUserId: card.userId })} type="button">
                    {card.vehicleType || '可接单'}
                  </button>
                </article>
              ))}
            </section>
          ) : (
            <EmptyBlock description="发布出行需求后会自动推荐合适司机。" image={assets.routeDog} title="等待司机推荐" />
          )}
        </>
      )}

      <section className="profile-section">
        <div className="profile-section-title">
          <h2>常用入口</h2>
          <span>快速跳转</span>
        </div>
        <div className="profile-grid">
          <button onClick={() => ui.navigateToScreen('demand_hall')} type="button"><i>🧾</i><span>需求大厅</span></button>
          <button onClick={() => ui.navigateToScreen('nearby_providers')} type="button"><i>📍</i><span>附近服务者</span></button>
          <button onClick={() => ui.setActiveTab('messages')} type="button"><i>💬</i><span>消息中心</span></button>
          <button onClick={() => ui.setActiveTab('policy')} type="button"><i>📚</i><span>政策问答</span></button>
        </div>
      </section>

      <section className="section-card prototype-section">
        <div className="section-head">
          <div>
            <h3>养宠出行内容</h3>
            <p>按 `client/咪咪出行` 原型的轻内容卡片方式展示。</p>
          </div>
        </div>
        <div className="post-grid">
          {postCards.map((card) => (
            <article className="post-card" key={card.title}>
              <SmartImage alt={card.title} className="post-card__image" fallbackLabel="攻略" src={card.image} />
              <div className="post-card__body">
                <strong>{card.title}</strong>
                <p>{card.subtitle}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
