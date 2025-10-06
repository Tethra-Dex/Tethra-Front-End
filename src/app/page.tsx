'use client';

import Link from 'next/link';
import Image from 'next/image';
import TradingScene from './components/TradingScene'; 

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      
      <header className="absolute top-0 left-0 w-full z-20 p-4 md:px-8">
        <nav className="container mx-auto flex justify-between items-center">
          
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Tetra Finance Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-semibold text-xl hidden sm:block">
              Tethra Finance
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-gray-300">
            <Link href="/trade" className="hover:text-white transition-colors duration-200">
              Trade
            </Link>
            <Link href="#" className="hover:text-white transition-colors duration-200">
              About
            </Link>
            <Link href="#" className="hover:text-white transition-colors duration-200">
              Docs
            </Link>
          </div>
          <Link
            href="/trade"
            className="font-semibold text-white py-2 px-5 rounded-lg 
                       bg-gradient-to-br from-purple-600 to-blue-500 
                       hover:bg-gradient-to-bl focus:ring-4 focus:outline-none 
                       focus:ring-blue-300 dark:focus:ring-blue-800
                       transition-all duration-300 ease-in-out
                       hover:shadow-lg hover:shadow-blue-500/50"
          >
            Launch App
          </Link>

        </nav>
      </header>
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <TradingScene />
      </div>

      <div className="z-10 text-center flex flex-col items-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-2xl">
          Tethra Finance
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-xl">
          Tap-to-Trade Visual Grid Trading Protocol
        </p>
      </div>

     

      <div className="absolute bottom-8 right-8 z-10 text-gray-500 hidden md:block">
        Scroll to explore
      </div>
    </div>
  );
}