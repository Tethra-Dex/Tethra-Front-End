'use client';

import React, { useState } from 'react';
import MarketOrder from './order-panel/MarketOrder';
import LimitOrder from './order-panel/LimitOrder';
import TapToTrade from './order-panel/TaptoTrade';

type ActiveTab = 'market' | 'limit' | 'tap';

const OrderPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('market');

  const renderContent = () => {
    switch (activeTab) {
      case 'market':
        return <MarketOrder />;
      case 'limit':
        return <LimitOrder />;
      case 'tap':
        return <TapToTrade />;
      default:
        return null;
    }
  };

  return (
    <div className="order-panel">
      <div className="order-panel-tabs">
        <button onClick={() => setActiveTab('market')} className={`tab-button ${activeTab === 'market' ? 'active' : ''}`}>Market</button>
        <button onClick={() => setActiveTab('limit')} className={`tab-button ${activeTab === 'limit' ? 'active' : ''}`}>Limit</button>
        <button onClick={() => setActiveTab('tap')} className={`tab-button ${activeTab === 'tap' ? 'active' : ''}`}>Tap</button>
      </div>
      <div className="order-panel-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default OrderPanel;