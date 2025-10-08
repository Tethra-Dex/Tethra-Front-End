import DashboardTrade from '../components/DashboardTrade';
import TradingChart from '../components/TradingChart';
import OrderPanel from '../components/OrderPanel';
import BottomTrading from '../components/BottomTrading';

export default function TradePage() {
  return (
    <main className="h-screen bg-black text-white p-2">
      <div className="flex flex-col md:flex-row w-full h-full gap-2">
        <div className="w-full md:w-[180px] shrink-0">
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
  );
}