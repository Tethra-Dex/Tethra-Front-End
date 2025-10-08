import Image from 'next/image';
import { CandlestickChart } from 'lucide-react';

export default function DashboardTrade() {
  return (
    <aside className="flex flex-col items-start bg-black text-gray-300 w-full md:w-[220px] h-full p-5">
      <div className="flex items-center space-x-3 mb-10">
        <Image
          src="/images/logo.png"
          alt="Tethra Logo"
          width={28}
          height={28}
        />
        <span className="text-lg font-semibold text-white">Tethra</span>
      </div>


      <nav className="flex flex-col space-y-6">
        <button className="flex items-center space-x-3 text-white hover:text-blue-400 transition">
          <CandlestickChart className="w-5 h-5" />
          <span className="text-sm font-medium">Trade</span>
        </button>
      </nav>
    </aside>
  );
}
