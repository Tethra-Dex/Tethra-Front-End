'use client';
import React, { useState } from 'react';

const LimitOrder: React.FC = () => {
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="trade-form">
      <div className="buy-sell-toggle">
        <button
          onClick={() => setOrderSide('buy')}
          className={`toggle-button buy ${orderSide === 'buy' ? 'active' : ''}`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`toggle-button sell ${orderSide === 'sell' ? 'active' : ''}`}
        >
          Sell
        </button>
      </div>
      <div className="form-group">
        <label htmlFor="limit-price">Limit Price</label>
        <div className="amount-input-wrapper">
          <input id="limit-price" type="number" placeholder="70000.00" className="input-field" />
          <span className="token-selector">USDT</span>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="limit-amount">Amount</label>
        <div className="amount-input-wrapper">
          <input id="limit-amount" type="number" placeholder="0.00" className="input-field" />
          <span className="token-selector">BTC</span>
        </div>
      </div>
      <div className="preset-buttons">
        <button>25%</button>
        <button>50%</button>
        <button>75%</button>
        <button>100%</button>
      </div>
      <button className={`action-button ${orderSide}`}>
        {orderSide === 'buy' ? 'Buy Limit' : 'Sell Limit'}
      </button>
    </div>
  );
};

export default LimitOrder;