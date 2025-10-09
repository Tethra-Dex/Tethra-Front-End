'use client';

import { useState } from 'react';
const BottomTrading = () => {
  const [activeTab, setActiveTab] = useState('Positions');

  const tabs = ['Positions', 'Orders', 'Trades', 'Claims'];

  const renderContent = () => {
    switch (activeTab) {
      case 'Positions':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/30">
              </thead>
              <tbody>
                <tr className="border-t border-gray-700">
                  <td colSpan={8} className="text-center py-16 text-gray-500">
                    No open positions
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'Orders':
        return <div className="text-center py-16 text-gray-500">No open orders</div>;
      case 'Trades':
        return <div className="text-center py-16 text-gray-500">No trades found</div>;
      case 'Claims':
        return <div className="text-center py-16 text-gray-500">No claims available</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0B1017] border border-gray-700/50 rounded-md h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-700/50 px-4">
        <div className="flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === tab
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white border-b-2 border-transparent'
              }`}
            >
              {tab} {tab === 'Positions' && <span className="bg-gray-700 text-xs rounded-full px-2 py-0.5 ml-1.5">0</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-grow flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default BottomTrading;