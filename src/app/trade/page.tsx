import TradingChart from '@/app/components/TradingChart'; 
import OrderPanel from '@/app/components/OrderPanel'; 

export default function TradePage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col md:flex-row w-full h-screen">
        <div className="flex-grow h-1/2 md:h-full">
          <TradingChart />
        </div>
        <div className="w-full md:w-[350px] border-l border-slate-700 h-1/2 md:h-full shrink-0">
          <OrderPanel />
        </div>
      </div>
    </main>
  );
}