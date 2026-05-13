import React from 'react';
import { tabs } from '../../features/mimi-dashboard/config/constants';
import type { TabKey } from '../../features/mimi-dashboard/model/types';

interface BottomTabBarProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <nav className="bottom-tabbar">
      {tabs.map((tab) => (
        <button
          className={['tab-item', activeTab === tab.key ? 'is-active' : ''].join(' ')}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          <span>{tab.icon}</span>
          <strong>{tab.label}</strong>
        </button>
      ))}
    </nav>
  );
}
