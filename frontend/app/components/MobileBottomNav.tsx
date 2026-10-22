'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
        setCartCount(Array.isArray(savedCart) ? savedCart.length : 0);
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    const interval = setInterval(updateCount, 1000);
    return () => {
      window.removeEventListener('storage', updateCount);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      label: 'Category',
      href: '/shop',
      icon: LayoutGrid,
      isActive: pathname === '/shop'
    },
    {
      label: 'My Bag',
      href: '/cart',
      icon: ShoppingBag,
      isActive: pathname === '/cart',
      badge: cartCount
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname === '/profile' || pathname === '/auth'
    }
  ];

  return (
    <div 
      className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50 md:hidden pointer-events-auto"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <nav 
        aria-label="Mobile Navigation"
        className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-slate-200/90 px-3 py-2 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={item.isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-all group"
            >
              {item.isActive ? (
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-extrabold text-orange-600 mt-0.5">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center relative text-slate-700 hover:text-slate-950">
                  <div className="relative p-1">
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 bg-slate-950 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 mt-0.5">
                    {item.label}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
