'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProblemSolution from './components/landing/ProblemSolution';
import Comparison from './components/landing/Comparison';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselProgress, setCarouselProgress] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Header visibility state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const slides = [
    {
      title: 'Real-Time Charts',
      description: 'Live market data with advanced technical indicators and trading tools',
      image: '/images/DEX.png'
    },
    {
      title: 'Tap to Position',
      description: 'Tap to trade to open position when the line crosses it',
      image: '/images/TapPosition.png'
    },
    {
      title: 'One Tap to Profit',
      description: 'Instantly profit with a single tap when the price line crosses your position',
      image: '/images/TapProfit.png'
    }
  ];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle header visibility based on user activity
  useEffect(() => {
    const resetInactivityTimer = () => {
      // Show header
      setIsHeaderVisible(true);

      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Only hide header if user has scrolled past hero section (more than 100px)
      if (window.scrollY > 100) {
        // Set new timer to hide header after 2 seconds of inactivity
        inactivityTimerRef.current = setTimeout(() => {
          setIsHeaderVisible(false);
        }, 2000);
      }
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);

    // Initialize timer
    resetInactivityTimer();

    return () => {
      // Cleanup
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('mousedown', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      opacity: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#06b6d4' : '#10b981',
        opacity: Math.random() * 0.5 + 0.1
      });
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - distance / 150) * 0.1;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Update and draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Carousel auto-transition with progress
  useEffect(() => {
    if (isCarouselPaused) return;
    
    setCarouselProgress(0);
    
    // Progress bar animation (100 steps in 3 seconds)
    const progressInterval = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 30);

    // Change slide after 3 seconds
    const slideInterval = setInterval(() => {
      setCurrentSlide((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [currentSlide, slides.length, isCarouselPaused]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
    setCarouselProgress(0);
  };

  return (
    <div className="w-full bg-black text-white overflow-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-30 flex justify-center transition-all duration-700 p-8 md:px-12 ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <nav
          className={`flex items-center justify-between transition-all duration-700 ${
            scrollY > 50
              ? 'bg-black/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-sm rounded-2xl px-6 py-3 max-w-5xl w-full'
              : 'bg-transparent border-transparent w-full px-0 py-0'
          }`}
        >
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Tethra Finance Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-semibold text-xl">
              Tethra Finance
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-gray-300">
            <Link href="/trade" className="hover:text-white transition-colors duration-200">
              Trade
            </Link>
            <Link href="#platform" className="hover:text-white transition-colors duration-200">
              Platform
            </Link>
            <Link href="#features" className="hover:text-white transition-colors duration-200">
              Features
            </Link>
          </div>

          <Link
            href="/trade"
            className="font-semibold text-white py-2 px-6 rounded-lg
                       bg-gradient-to-r from-cyan-500 to-emerald-500
                       hover:from-cyan-600 hover:to-emerald-600
                       transition-all duration-300 ease-in-out
                       hover:shadow-lg hover:shadow-cyan-500/30"
          >
            Launch App
          </Link>
        </nav>
      </header>

      {/* Hero Section with Layered Text */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Animated Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-0"
          style={{ opacity: 0.6 }}
        />

        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10"
            style={{
              animation: 'gradientShift 15s ease infinite',
            }}
          />
          <div 
            className="absolute w-full h-full bg-gradient-to-tl from-emerald-500/10 via-transparent to-cyan-500/10"
            style={{
              animation: 'gradientShift 20s ease infinite reverse',
            }}
          />
        </div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
              animation: 'gridMove 20s linear infinite',
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div 
            className="absolute w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl"
            style={{
              top: '10%',
              left: '10%',
              animation: 'float 20s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"
            style={{
              bottom: '10%',
              right: '10%',
              animation: 'float 25s ease-in-out infinite reverse',
            }}
          />
          <div 
            className="absolute w-64 h-64 rounded-full bg-cyan-500/10 blur-2xl"
            style={{
              top: '50%',
              right: '20%',
              animation: 'float 30s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl"
            style={{
              top: '30%',
              left: '60%',
              animation: 'float 35s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-2xl"
            style={{
              bottom: '30%',
              left: '30%',
              animation: 'float 28s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute w-12 h-12 border border-cyan-500/20 rotate-45"
            style={{
              top: '20%',
              left: '15%',
              animation: 'floatSlow 40s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-16 h-16 border border-emerald-500/20 rounded-full"
            style={{
              top: '70%',
              right: '25%',
              animation: 'floatSlow 45s ease-in-out infinite reverse',
            }}
          />
          <div 
            className="absolute w-10 h-10 border border-cyan-500/30"
            style={{
              top: '40%',
              right: '15%',
              animation: 'rotate 60s linear infinite, floatSlow 35s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-8 h-8 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rotate-12"
            style={{
              bottom: '40%',
              left: '20%',
              animation: 'floatSlow 50s ease-in-out infinite',
            }}
          />
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          {/* Left Side Decorative Lines */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-screen">
            {/* Vertical Lines - Much Longer - Animated */}
            <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute left-12 top-0 w-0.5 h-5/6 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute left-24 top-0 w-0.5 h-3/4 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute left-36 top-0 w-0.5 h-2/3 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>

            {/* Horizontal Lines - Much Longer */}
            <div className="absolute left-0 top-1/2 w-96 h-0.5 bg-gradient-to-r from-cyan-500/40 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute left-0 top-1/3 w-72 h-0.5 bg-gradient-to-r from-cyan-500/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute left-0 top-2/3 w-72 h-0.5 bg-gradient-to-r from-cyan-500/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute left-0 top-1/4 w-56 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent animate-pulse" style={{ animationDuration: '7s' }}></div>
            <div className="absolute left-0 top-3/4 w-56 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent animate-pulse" style={{ animationDuration: '8s' }}></div>

            {/* Corner Accent */}
            <div className="absolute left-0 top-1/2 w-4 h-4 border-l-2 border-t-2 border-cyan-500/50 animate-pulse"></div>
          </div>

          {/* Right Side Decorative Lines */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-screen">
            {/* Vertical Lines - Much Longer - Animated */}
            <div className="absolute right-0 top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-emerald-500/40 to-transparent animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute right-12 top-0 w-0.5 h-5/6 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute right-24 top-0 w-0.5 h-3/4 bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute right-36 top-0 w-0.5 h-2/3 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>

            {/* Horizontal Lines - Much Longer */}
            <div className="absolute right-0 top-1/2 w-96 h-0.5 bg-gradient-to-l from-emerald-500/40 to-transparent animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute right-0 top-1/3 w-72 h-0.5 bg-gradient-to-l from-emerald-500/30 to-transparent animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute right-0 top-2/3 w-72 h-0.5 bg-gradient-to-l from-emerald-500/30 to-transparent animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute right-0 top-1/4 w-56 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent animate-pulse" style={{ animationDuration: '7s' }}></div>
            <div className="absolute right-0 top-3/4 w-56 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent animate-pulse" style={{ animationDuration: '8s' }}></div>

            {/* Corner Accent */}
            <div className="absolute right-0 top-1/2 w-4 h-4 border-r-2 border-t-2 border-emerald-500/50 animate-pulse"></div>
          </div>

          {/* Subtle Corner Dots - Top Left */}
          <div className="absolute top-32 left-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/20"></div>
          </div>

          {/* Subtle Corner Dots - Top Right */}
          <div className="absolute top-32 right-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
          </div>

          {/* Subtle Corner Dots - Bottom Left */}
          <div className="absolute bottom-32 left-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-cyan-500/40"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-cyan-500/20"></div>
          </div>

          {/* Subtle Corner Dots - Bottom Right */}
          <div className="absolute bottom-32 right-32 flex gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
            <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
          </div>

          {/* Diagonal Lines - Top Left to Center */}
          <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent rotate-45 origin-left"></div>

          {/* Diagonal Lines - Top Right to Center */}
          <div className="absolute top-1/4 right-1/4 w-32 h-0.5 bg-gradient-to-l from-emerald-500/20 to-transparent -rotate-45 origin-right"></div>

          {/* Subtle Glow Spots */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>

          {/* Additional Decorative Elements */}

          {/* Grid Pattern Subtle */}
          <div className="absolute top-0 left-1/4 w-64 h-64 border border-cyan-500/10 rounded-lg rotate-12"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 border border-emerald-500/10 rounded-lg -rotate-12"></div>

          {/* Floating Circles - Top */}
          <div className="absolute top-24 left-1/3 w-2 h-2 rounded-full border border-cyan-500/30"></div>
          <div className="absolute top-32 left-1/3 translate-x-12 w-3 h-3 rounded-full border border-cyan-500/20"></div>
          <div className="absolute top-28 left-1/3 translate-x-24 w-1.5 h-1.5 rounded-full bg-cyan-500/20"></div>

          {/* Floating Circles - Bottom */}
          <div className="absolute bottom-24 right-1/3 w-2 h-2 rounded-full border border-emerald-500/30"></div>
          <div className="absolute bottom-32 right-1/3 -translate-x-12 w-3 h-3 rounded-full border border-emerald-500/20"></div>
          <div className="absolute bottom-28 right-1/3 -translate-x-24 w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>

          {/* Cross Pattern - Left */}
          <div className="absolute top-1/3 left-48">
            <div className="w-8 h-0.5 bg-cyan-500/20 absolute top-0 left-0"></div>
            <div className="w-0.5 h-8 bg-cyan-500/20 absolute top-0 left-0 translate-x-3.5"></div>
          </div>

          {/* Cross Pattern - Right */}
          <div className="absolute top-2/3 right-48">
            <div className="w-8 h-0.5 bg-emerald-500/20 absolute top-0 left-0"></div>
            <div className="w-0.5 h-8 bg-emerald-500/20 absolute top-0 left-0 translate-x-3.5"></div>
          </div>

          {/* Hexagon Outlines */}
          <div className="absolute top-1/4 right-1/3 w-16 h-16 border border-emerald-500/15 rotate-45"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-cyan-500/15 rotate-45"></div>

          {/* Small Dots Scattered */}
          <div className="absolute top-1/3 left-1/2 w-1 h-1 bg-cyan-500/30 rounded-full"></div>
          <div className="absolute top-2/3 left-2/3 w-1 h-1 bg-emerald-500/30 rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-cyan-500/20 rounded-full"></div>
          <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-emerald-500/20 rounded-full"></div>

          {/* Connecting Lines - Decorative */}
          <div className="absolute top-1/3 left-1/2 w-24 h-0.5 bg-gradient-to-r from-cyan-500/10 to-transparent rotate-12"></div>
          <div className="absolute bottom-1/3 right-1/2 w-24 h-0.5 bg-gradient-to-l from-emerald-500/10 to-transparent -rotate-12"></div>

          {/* Triangle Outlines */}
          <div className="absolute top-1/4 left-2/3 w-12 h-12 border-t border-l border-cyan-500/15 rotate-45"></div>
          <div className="absolute bottom-1/4 right-2/3 w-12 h-12 border-b border-r border-emerald-500/15 rotate-45"></div>
        </div>

        {/* TAP Text - Background Layer (Cyan - matching left logo) with Parallax */}
        <div 
          className={`absolute top-12 left-0 pointer-events-none select-none transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
          }`}
          style={{ 
            zIndex: 1,
            transform: `translateY(${scrollY * 0.3}px) translateX(${isLoaded ? 0 : '-5rem'})`,
            transitionDelay: '200ms',
          }}
        >
          <h2
            className="text-[12rem] md:text-[16rem] lg:text-[22rem] xl:text-[28rem] font-black leading-none text-[#06b6d4] opacity-70 hover:opacity-100 transition-opacity duration-500"
            style={{
              fontFamily: 'Arial Black, Impact, sans-serif',
              letterSpacing: '-0.05em',
              fontStretch: 'ultra-condensed',
              transform: 'scaleY(1.4) scaleX(0.7)',
              transformOrigin: 'top left',
              textShadow: '0 0 40px rgba(6, 182, 212, 0.3)',
            }}
          >
            TAP
          </h2>
        </div>

        {/* TRADE Text - Background Layer (Emerald - matching right logo) with Parallax */}
        <div 
          className={`absolute -bottom-4 right-0 pointer-events-none select-none transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
          }`}
          style={{ 
            zIndex: 1,
            transform: `translateY(${-scrollY * 0.3}px) translateX(${isLoaded ? 0 : '5rem'})`,
            transitionDelay: '300ms',
          }}
        >
          <h2
            className="text-[12rem] md:text-[16rem] lg:text-[22rem] xl:text-[28rem] font-black leading-none text-[#10b981] opacity-70 hover:opacity-100 transition-opacity duration-500"
            style={{
              fontFamily: 'Arial Black, Impact, sans-serif',
              letterSpacing: '-0.05em',
              fontStretch: 'ultra-condensed',
              transform: 'scaleY(1.4) scaleX(0.7)',
              transformOrigin: 'bottom right',
              textShadow: '0 0 40px rgba(16, 185, 129, 0.3)',
            }}
          >
            TRADE
          </h2>
        </div>

        {/* Center Content - Front Layer */}
        <div 
          className={`relative z-10 flex items-center justify-center min-h-screen -translate-x-48 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
          style={{
            transform: `translate(-3rem, ${scrollY * -0.1}px) scale(${isLoaded ? 1 : 0.75})`,
            transitionDelay: '100ms',
          }}
        >
          {/* Logo with dramatic effects */}
          <div className="relative group">
            {/* Animated Ring Around Logo */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-cyan-500/30 scale-125"
              style={{
                animation: 'rotate 20s linear infinite',
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-2 border-emerald-500/30 scale-150"
              style={{
                animation: 'rotate 30s linear infinite reverse',
              }}
            />

            {/* Outer Glow - Only on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/40 group-hover:to-emerald-500/40 blur-3xl transition-all duration-500 scale-150"></div>

            {/* Pulsing Background */}
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 blur-2xl"
              style={{
                animation: 'pulse 4s ease-in-out infinite',
              }}
            />

            {/* Logo */}
            <Image
              src="/images/logo.png"
              alt="Tethra Finance"
              width={450}
              height={450}
              className="relative drop-shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:drop-shadow-[0_0_80px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-700 cursor-pointer"
              priority
              style={{
                filter: 'drop-shadow(0 0 30px rgba(6,182,212,0.3)) drop-shadow(0 0 50px rgba(16,185,129,0.2))',
              }}
            />
          </div>
        </div>

        {/* Description Text - Bottom Left */}
        <div 
          className={`absolute bottom-16 left-16 max-w-2xl z-10 transition-all duration-1000 ${
            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
          }`}
          style={{
            transform: `translateY(${scrollY * -0.2}px) translateX(${isLoaded ? 0 : '-2.5rem'})`,
            transitionDelay: '400ms',
          }}
        >
          <div className="relative group">
            {/* Background blur box */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent backdrop-blur-sm rounded-lg group-hover:from-black/80 transition-all duration-300"></div>

            {/* Animated border */}
            <div className="absolute inset-0 rounded-lg">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-emerald-500/50 to-cyan-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  padding: '2px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />
            </div>

            {/* Text content */}
            <div className="relative p-8 border-l-4 border-cyan-500/50 group-hover:border-cyan-500 transition-all duration-300">
              <p className="text-base md:text-lg text-white leading-relaxed">
                Oracle-based perpetual trading protocol with tap-to-trade interface - making leveraged trading as intuitive as tapping a chart, powered by Pyth Network oracle and Account Abstraction.
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gray-400 text-sm font-medium">Scroll to explore</span>
          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Platform Preview Section with Carousel */}
      <section id="platform" className="relative z-20 bg-black py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Professional Trading Interface
            </h2>
            <p className="text-xl text-gray-400">
              Experience institutional-grade trading tools in a decentralized environment
            </p>
          </div>

          {/* Carousel Container */}
          <div 
            className="relative"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Slides */}
            <div className="relative min-h-[600px] overflow-hidden">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentSlide
                      ? 'opacity-100 translate-x-0 scale-100'
                      : 'opacity-0 translate-x-20 scale-95 pointer-events-none'
                  }`}
                >
                  <div className="relative group">
                    {/* Animated glow effect */}
                    <div 
                      className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-cyan-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    ></div>

                    {/* Screenshot */}
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 group-hover:border-cyan-500/60 group-hover:shadow-cyan-500/40 transition-all duration-500 group-hover:scale-[1.02]">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        width={1920}
                        height={1080}
                        className="w-full h-auto"
                        priority={index === 0}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                      {/* Interactive corner highlights */}
                      <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-cyan-500/0 group-hover:border-cyan-500/50 transition-all duration-500"></div>
                      <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-emerald-500/0 group-hover:border-emerald-500/50 transition-all duration-500"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Text Content Below Image */}
            <div className="text-center max-w-3xl mx-auto mt-8 min-h-[100px]">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 transition-all duration-500">
                {slides[currentSlide].title}
              </h3>
              <p className="text-base md:text-lg text-gray-400 transition-all duration-500">
                {slides[currentSlide].description}
              </p>
            </div>

            {/* Carousel Indicators - Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleSlideChange(index)}
                  className={`relative overflow-hidden transition-all duration-500 ease-in-out rounded-full ${
                    index === currentSlide
                      ? 'w-12 h-3'
                      : 'w-3 h-3 bg-gray-600 hover:bg-gray-400 hover:scale-110'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === currentSlide ? (
                    <>
                      {/* Background */}
                      <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                      {/* Progress bar */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-100 shadow-lg shadow-cyan-500/50"
                        style={{ width: `${carouselProgress}%` }}
                      ></div>
                    </>
                  ) : null}
                </button>
              ))}
            </div>

          </div>

          {/* Feature highlights below screenshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="group/card p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/50 hover:from-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                <div className="text-cyan-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative">Real-Time Charts</h3>
                <p className="text-gray-400 relative">Live market data with advanced technical indicators and trading tools</p>
              </div>

              <div className="group/card p-6 rounded-lg bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 hover:from-emerald-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                <div className="text-emerald-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative">One-Click Trading</h3>
                <p className="text-gray-400 relative">Execute trades instantly with our streamlined tap-to-trade interface</p>
              </div>

              <div className="group/card p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/50 hover:from-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                <div className="text-cyan-400 mb-2 transform group-hover/card:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 relative">Grid Management</h3>
                <p className="text-gray-400 relative">Manage multiple positions simultaneously with visual grid trading</p>
              </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="group/stat p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-center hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-emerald-500/0 group-hover/stat:from-cyan-500/10 group-hover/stat:to-emerald-500/5 transition-all duration-300"></div>
              <div className="relative text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                24/7
              </div>
              <div className="relative text-gray-400 text-lg group-hover/stat:text-gray-300 transition-colors duration-300">Automated Trading</div>
            </div>
            <div className="group/stat p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-center hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover/stat:from-emerald-500/10 group-hover/stat:to-cyan-500/5 transition-all duration-300"></div>
              <div className="relative text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                0%
              </div>
              <div className="relative text-gray-400 text-lg group-hover/stat:text-gray-300 transition-colors duration-300">Platform Fees</div>
            </div>
            <div className="group/stat p-8 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-center hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-emerald-500/0 group-hover/stat:from-cyan-500/10 group-hover/stat:to-emerald-500/5 transition-all duration-300"></div>
              <div className="relative text-5xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-2 group-hover/stat:scale-110 transition-transform duration-300">
                100%
              </div>
              <div className="relative text-gray-400 text-lg group-hover/stat:text-gray-300 transition-colors duration-300">Decentralized</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <ProblemSolution />
        <Comparison />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4 mt-20">
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

      {/* Custom Animations */}
      <style jsx global>{`
        /* Smooth scroll */
        html {
          scroll-behavior: smooth;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        body::-webkit-scrollbar {
          width: 8px;
        }

        body::-webkit-scrollbar-track {
          background: #000;
        }

        body::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #10b981);
          border-radius: 4px;
        }

        body::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #059669);
        }

        @keyframes gradientShift {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -40px) rotate(90deg);
          }
          50% {
            transform: translate(-30px, -20px) rotate(180deg);
          }
          75% {
            transform: translate(-10px, 30px) rotate(270deg);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        /* Enhance existing animations */
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Scroll-based animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        /* Glow effect */
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(6, 182, 212, 0.6), 0 0 60px rgba(16, 185, 129, 0.4);
          }
        }
      `}</style>
    </div>
  );
}