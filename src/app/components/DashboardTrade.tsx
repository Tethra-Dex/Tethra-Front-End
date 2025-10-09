import Image from 'next/image';
import { CandlestickChart, Database, Copy } from 'lucide-react';

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


      <nav className="flex flex-col space-y-6 flex-1">
        <a href='/trade' className="flex items-center space-x-3 text-white hover:text-blue-400 transition cursor-pointer">
          <CandlestickChart className="w-5 h-5" />
          <span className="text-sm font-medium">Trade</span>
        </a>
        <a href='/pools' className="flex items-center space-x-3 text-white hover:text-blue-400 transition cursor-pointer">
          <Database className="w-5 h-5" />
          <span className="text-sm font-medium">Pools</span>
        </a>
        <a href='/stake' className="flex items-center space-x-3 text-white hover:text-blue-400 transition cursor-pointer">
          <Database className="w-5 h-5" />
          <span className="text-sm font-medium">Stake</span>
        </a>
        <a href='/copy-trade' className="flex items-center space-x-3 text-white hover:text-blue-400 transition cursor-pointer">
          <Copy className="w-5 h-5" />
          <span className="text-sm font-medium">Copy Trade</span>
        </a>
      </nav>

      {/* Built on Base Badge */}
      <div className="mt-auto pt-6 border-t border-gray-800">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg px-3 py-2">
          <Image
            src="/images/base-logo.png"
            alt="Base Logo"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-xs font-semibold text-white">Built on Base</span>
        </div>
      </div>
    </aside>
  );
}