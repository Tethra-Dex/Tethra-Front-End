'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TradingScene from './components/TradingScene';

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = Math.min(currentScroll / scrollHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-black text-white">
      {/* Scroll trigger area - invisible but allows scrolling */}
      <div style={{ height: '200vh' }}>
        {/* Three.js Scene - Fixed position */}
        <div className="fixed top-0 left-0 w-full h-screen z-0">
          <TradingScene scrollProgress={scrollProgress} />
          {/* Vignette overlay for dramatic effect */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at center, transparent ${60 - scrollProgress * 40}%, black ${90 - scrollProgress * 20}%)`,
              opacity: scrollProgress * 0.8
            }}
          />
        </div>

        {/* Header */}
        <header className={`fixed top-0 left-0 w-full z-30 p-4 md:px-8 transition-opacity duration-300 ${scrollProgress > 0.5 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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

        {/* Landing Content - Fades out */}
        <div className={`fixed inset-0 z-10 flex flex-col items-center justify-center transition-opacity duration-500 ${scrollProgress > 0.3 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="text-center flex flex-col items-center p-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-2xl">
              Tethra Finance
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-xl">
              Tap-to-Trade Visual Grid Trading Protocol
            </p>
          </div>

          <div className="absolute bottom-8 right-8 text-gray-500 hidden md:block animate-bounce">
            Scroll to explore ↓
          </div>
        </div>

        {/* New Content - Fades in and overlays at the SAME position */}
        <div className={`fixed inset-0 z-20 overflow-y-auto transition-opacity duration-700 ${scrollProgress > 0.5 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="min-h-screen w-full bg-black">
            {/* Features Section */}
            <div className="container mx-auto px-4 py-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Trade Smarter, Not Harder
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Experience the future of decentralized trading with our innovative visual grid protocol
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                {/* Feature 1 */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Instant Execution</h3>
                  <p className="text-gray-400">
                    Execute trades instantly with our tap-to-trade interface. No complex forms, just click and trade.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-green-500 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Visual Grid Trading</h3>
                  <p className="text-gray-400">
                    See your trading strategy come to life with our innovative visual grid system.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Secure & Decentralized</h3>
                  <p className="text-gray-400">
                    Your assets stay in your wallet. Trade with confidence on a fully decentralized protocol.
                  </p>
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center mt-20 pb-20">
                <Link
                  href="/trade"
                  className="inline-block font-semibold text-white py-4 px-10 rounded-lg text-lg
                             bg-gradient-to-br from-purple-600 to-blue-500
                             hover:bg-gradient-to-bl focus:ring-4 focus:outline-none
                             focus:ring-blue-300 dark:focus:ring-blue-800
                             transition-all duration-300 ease-in-out
                             hover:shadow-lg hover:shadow-blue-500/50
                             transform hover:scale-105"
                >
                  Start Trading Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}