'use client';
import React, { useState } from 'react';

const MarketOrder: React.FC = () => {
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="grid grid-cols-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
        <button
          onClick={() => setOrderSide('buy')}
          className={`py-2 border-none rounded-md font-semibold cursor-pointer transition-colors ${
            orderSide === 'buy' ? 'bg-teal-500 text-white' : 'bg-transparent text-slate-400'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setOrderSide('sell')}
          className={`py-2 border-none rounded-md font-semibold cursor-pointer transition-colors ${
            orderSide === 'sell' ? 'bg-red-600 text-white' : 'bg-transparent text-slate-400'
          }`}
        >
          Sell
        </button>
      </div>

      <div>
        <label htmlFor="market-amount" className="text-sm text-slate-400 mb-2 block">Amount</label>
        <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md">
          <input id="market-amount" type="number" placeholder="0.00" className="bg-transparent border-none w-full p-2 text-white focus:ring-0 focus:outline-none" />
          <span className="px-3 font-semibold text-slate-200 border-l border-slate-700">BTC</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button className="bg-slate-700 text-slate-300 py-2 rounded-md cursor-pointer transition-colors hover:bg-slate-600">25%</button>
        <button className="bg-slate-700 text-slate-300 py-2 rounded-md cursor-pointer transition-colors hover:bg-slate-600">50%</button>
        <button className="bg-slate-700 text-slate-300 py-2 rounded-md cursor-pointer transition-colors hover:bg-slate-600">75%</button>
        <button className="bg-slate-700 text-slate-300 py-2 rounded-md cursor-pointer transition-colors hover:bg-slate-600">100%</button>
      </div>

      <button className={`py-3 border-none rounded-md text-white text-base font-bold cursor-pointer transition-opacity hover:opacity-90 ${
        orderSide === 'buy' ? 'bg-teal-500' : 'bg-red-600'
      }`}>
        {orderSide === 'buy' ? 'Buy BTC' : 'Sell BTC'}
      </button>

      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
        <div className="flex flex-col text-center gap-1"><span className="text-xs text-slate-400">Bought</span><span className="text-sm font-semibold">--</span></div>
        <div className="flex flex-col text-center gap-1"><span className="text-xs text-slate-400">Sold</span><span className="text-sm font-semibold">--</span></div>
        <div className="flex flex-col text-center gap-1"><span className="text-xs text-slate-400">Holding</span><span className="text-sm font-semibold">--</span></div>
        <div className="flex flex-col text-center gap-1"><span className="text-xs text-slate-400">PnL</span><span className="text-sm font-semibold">--</span></div>
      </div>
    </div>
  );
};

export default MarketOrder;