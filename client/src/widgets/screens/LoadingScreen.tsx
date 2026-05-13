import React from 'react';
import { assets } from '../../shared/lib/assets';
import { SmartImage } from '../../shared/ui/SmartImage';

export function LoadingScreen() {
  return (
    <div className="app-shell">
      <div className="loading-card">
        <SmartImage alt="加载中" className="loading-illustration" fallbackLabel="咪咪出行" src={assets.homeCat} />
        <h2>正在同步咪咪出行数据</h2>
        <p>加载服务者、需求、订单、消息和政策知识库。</p>
      </div>
    </div>
  );
}
