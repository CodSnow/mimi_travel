import React from 'react';

interface TopBarProps {
  title: string;
  onRefresh: () => void;
}

export function TopBar({ title, onRefresh }: TopBarProps) {
  return (
    <header className="top-bar">
      <div>
        <span className="eyebrow">咪咪出行 H5</span>
        <h1>{title}</h1>
      </div>
      <button className="ghost-btn" onClick={onRefresh} type="button">
        刷新
      </button>
    </header>
  );
}
