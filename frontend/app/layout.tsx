'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingBag, LogIn, Heart, User, LogOut, ChevronDown, Package, MapPin } from 'lucide-react';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [customerUser, setCustomerUser] = useState<any>(null);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkCustomerAuth = () => {
      const savedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customerUser') || 'null');
      const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
      if (savedUser && token) setCustomerUser(savedUser);
      else setCustomerUser(null);
    };

    const updateCounts = () => {
      setCartCount(JSON.parse(localStorage.getItem('cartItems') || '[]').length);
      setWishlistCount(JSON.parse(localStorage.getItem('wishlistItems') || '[]').length);
    };

    checkCustomerAuth();
    updateCounts();
    window.addEventListener('storage', () => { checkCustomerAuth(); updateCounts(); });
    const interval = setInterval(() => { checkCustomerAuth(); updateCounts(); }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setCustomerUser(null);
    setProfileDropdown(false);
    router.push('/auth');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
        
        {/* Dynamic Sports Ticker Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white text-[10px] sm:text-[11px] font-bold py-2 sm:py-2.5 px-3 sm:px-4 flex items-center justify-between tracking-wide uppercase shadow-sm gap-2 overflow-hidden">
          <span className="flex items-center gap-1.5 shrink-0">🔥 Code: <strong className="text-amber-400">WELCOME5</strong></span>
          <span className="text-amber-400 font-black truncate text-right">Free Express Shipping</span>
        </div>

        {/* Main Header / Navbar with Image Logo */}
        <div className="bg-white text-slate-900 sticky top-0 z-50 border-b border-slate-200 shadow-xs backdrop-blur-md bg-opacity-95">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4">
            
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <img 
                src="/navbar-logo.png" 
                alt="Track Hub Logo" 
                className="h-7 sm:h-8 w-auto object-contain transition group-hover:scale-105" 
              />
              <span className="text-base sm:text-xl font-black tracking-wider text-slate-900" style={{ fontFamily: "'Ethnocentric', sans-serif" }}>
                TRACK HUB
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-black text-slate-700 uppercase tracking-wider">
              <Link href="/shop?section=Men" className="hover:text-blue-600 transition">Men</Link>
              <Link href="/shop?section=Women" className="hover:text-blue-600 transition">Women</Link>
              <Link href="/shop?section=Boys" className="hover:text-blue-600 transition">Boys</Link>
              <Link href="/shop?section=New Arrivals" className="hover:text-blue-600 transition">New Arrivals</Link>
              <Link href="/shop?section=Sale" className="hover:text-red-600 transition">Sale</Link>
            </nav>

            <div className="flex items-center gap-4 shrink-0">
              <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center bg-slate-100 rounded-xl px-3.5 py-2 border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search sportswear..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs focus:outline-none text-slate-900 font-medium w-44"
                />
              </form>

              {customerUser ? (
                <div className="flex items-center gap-3">
                  <Link href="/wishlist" className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">{wishlistCount}</span>}
                  </Link>

                  <Link href="/cart" className="relative p-2.5 text-slate-950 hover:text-blue-600 rounded-xl transition">
                    <ShoppingBag className="w-4 h-4" />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-slate-950 text-amber-400 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                  </Link>

                  <div className="relative">
                    <button onClick={() => setProfileDropdown(!profileDropdown)} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span className="max-w-[90px] truncate">{customerUser.fullName || 'Account'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {profileDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl py-2 text-slate-900 border border-slate-200 z-50 text-xs font-semibold">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="font-black text-slate-900 truncate">{customerUser.fullName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{customerUser.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setProfileDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition">My Profile</Link>
                        <Link href="/profile?tab=orders" onClick={() => setProfileDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50 transition">Orders & History</Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-600 transition border-t border-slate-100">Sign Out</button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/cart" className="relative p-2.5 text-slate-950 hover:text-blue-600 rounded-xl transition">
                    <ShoppingBag className="w-4 h-4" />
                    {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-slate-950 text-amber-400 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
                  </Link>
                  <Link href="/auth" className="flex items-center gap-1.5 text-slate-950 hover:text-blue-600 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>

        <main className="flex-grow pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}