'use client';

import DashboardTrade from '../components/DashboardTrade';
import TradingChart from '../components/TradingChart';
import OrderPanel from '../components/OrderPanel';
import BottomTrading from '../components/BottomTrading';
import { MarketProvider } from '../contexts/MarketContext';
import { useSidebar } from '../contexts/SidebarContext';

export default function TradePage() {
  const { isExpanded } = useSidebar();

  return (
    <MarketProvider>
      <main className="h-screen bg-black text-white p-2">
        <div className="flex flex-col md:flex-row w-full h-full gap-2">
          <div className={`w-full shrink-0 transition-all duration-300 ${isExpanded ? 'md:w-[180px]' : 'md:w-[70px]'}`}>
            <DashboardTrade />
          </div>
          <div className="flex-grow flex flex-col gap-2">
            <div className="flex-grow h-[55%]">
              <TradingChart />
            </div>
            <div className="h-[30%]">
              <BottomTrading />
            </div>
          </div>
          <div className="w-full md:w-[400px] shrink-0">
            <OrderPanel />
          </div>
        </div>
      </main>
    </MarketProvider>
  );
}
