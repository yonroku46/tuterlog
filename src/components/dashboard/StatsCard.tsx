"use client";

import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  trendDown?: boolean;
}

const StatsCard = ({ title, value, icon, trend, trendUp, trendDown }: StatsCardProps) => {
  return (
    <div className="stats-card">
      <div className="icon-box">
        {icon}
      </div>
      <div className="info">
        <h3>{title}</h3>
        <div className="value">{value}</div>
        {trend && (
          <div className={`trend ${trendUp ? 'up' : trendDown ? 'down' : ''}`}>
            <span>{trendUp ? '↑' : trendDown ? '↓' : ''}</span>
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
