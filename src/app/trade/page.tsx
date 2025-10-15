'use client';

import DashboardTrade from '../components/DashboardTrade';
import TradingChart from '../components/TradingChart';
import OrderPanel from '../components/OrderPanel';
import BottomTrading from '../components/BottomTrading';
import { MarketProvider } from '../contexts/MarketContext';
import { GridTradingProvider } from '../contexts/GridTradingContext';
import { useSidebar } from '../contexts/SidebarContext';

export default function TradePage() {
  const { isExpanded } = useSidebar();

  return (
    <MarketProvider>
      <GridTradingProvider>
        <main className="bg-black text-white h-screen flex flex-col" style={{ padding: '0.5rem' }}>
        <div className="flex flex-col md:flex-row w-full flex-1" style={{ gap: '0.5rem', minHeight: 0 }}>
          {/* Left Sidebar - Full height */}
          <div
            className="shrink-0 transition-all duration-300 flex flex-col"
            style={{
              width: isExpanded ? '12vw' : '5vw',
              minWidth: isExpanded ? '120px' : '50px',
              maxWidth: isExpanded ? '200px' : '80px',
            }}
          >
            <DashboardTrade />
          </div>

          {/* Center - Chart and Bottom Trading with flexible heights */}
          <div className="flex-1 flex flex-col min-w-0" style={{ gap: '0.5rem', minHeight: 0 }}>
            {/* Trading Chart - Flexible height, takes 60% of available space */}
            <div
              className="flex-1"
              style={{
                minHeight: '400px',
                maxHeight: '70vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <TradingChart />
            </div>
            {/* Bottom Trading - Flexible height, takes remaining space */}
            <div
              className="flex-1"
              style={{
                minHeight: '200px',
                maxHeight: '40vh'
              }}
            >
              <BottomTrading />
            </div>
          </div>

          {/* Right Order Panel - Full height */}
          <div
            className="shrink-0 flex flex-col"
            style={{
              width: '26vw',
              minWidth: '280px',
              maxWidth: '450px',
            }}
          >
            <OrderPanel />
          </div>
        </div>
      </main>
      </GridTradingProvider>
    </MarketProvider>
  );
}
