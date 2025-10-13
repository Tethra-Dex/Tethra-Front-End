'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TradingScene from './components/TradingScene';
import ProblemSolution from './components/landing/ProblemSolution';
import KeyFeatures from './components/landing/KeyFeatures';
import HowItWorks from './components/landing/HowItWorks';
import Comparison from './components/landing/Comparison';
import CTASection from './components/landing/CTASection';

export default function LandingPage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [secondScrollProgress, setSecondScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = window.innerHeight;
      const currentScroll = window.scrollY;

      // First transition (0vh to 100vh)
      const progress = Math.min(currentScroll / scrollHeight, 1);
      setScrollProgress(progress);

      // Second transition (100vh to 200vh)
      const secondProgress = Math.min(Math.max((currentScroll - scrollHeight) / scrollHeight, 0), 1);
      setSecondScrollProgress(secondProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="w-full bg-black text-white">
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
      

      {/* Second Content Layer - Rest of sections - Fades in after first scroll completes */}
      <div className={`fixed inset-0 z-30 transition-opacity duration-700 ${secondScrollProgress > 0.5 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full h-full bg-black overflow-y-auto">
          <ProblemSolution />
          <Comparison />

          {/* Footer */}
          <footer className="border-t border-gray-800 py-8 px-4">
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/logo.png"
                    alt="Tethra Finance Logo"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                  <span className="text-gray-400">
                    © 2025 Tethra Finance. All rights reserved.
                  </span>
                </div>
                <div className="flex gap-6 text-gray-400">
                  <Link href="#" className="hover:text-white transition-colors">
                    Twitter
                  </Link>
                  <Link href="#" className="hover:text-white transition-colors">
                    Discord
                  </Link>
                  <Link href="#" className="hover:text-white transition-colors">
                    GitHub
                  </Link>
                  <Link href="#" className="hover:text-white transition-colors">
                    Docs
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Scroll trigger area - invisible but allows scrolling */}
      <div style={{ height: '300vh' }} />
    </div>
  );
}