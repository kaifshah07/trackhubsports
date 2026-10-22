'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = () => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      setWishlist(savedWishlist);
    } catch {
      setWishlist([]);
    }
  };

  const handleRemoveFromWishlist = (id: string) => {
    const updated = wishlist.filter(item => item.id !== id);
    setWishlist(updated);
    localStorage.setItem('wishlistItems', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddToCart = (product: any) => {
    try {
      let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existing = cart.find((item: any) => item.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cartItems', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" /> My Wishlist
            </h1>
          </div>
          <Link href="/cart" className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm">
            <ShoppingBag className="w-4 h-4" /> Go to Cart
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">❤️</div>
            <h3 className="text-lg font-black text-slate-900">Your wishlist is empty</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">Explore our store and click the heart icon on any sports gear to save items for later.</p>
            <Link href="/" className="inline-block bg-slate-900 text-amber-400 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlist.map(product => (
              <div key={product.id} className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between group">
                <div>
                  <div className="relative aspect-square bg-[#f8f9fa] overflow-hidden flex items-center justify-center p-2">
                    <Link href={`/product/${product.id}`} className="w-full h-full block">
                      <img 
                        src={product.imageUrl || '/placeholder-product.svg'} 
                        alt={product.name} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-product.svg'; }}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300" 
                      />
                    </Link>
                    <button 
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      aria-label="Remove from wishlist"
                      className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-full shadow-md transition min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="p-3 sm:p-5 space-y-1 sm:space-y-2">
                    <Link href={`/product/${product.id}`} className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 min-h-[2rem] leading-tight hover:text-neutral-600 block transition">
                      {product.name}
                    </Link>
                    <p className="text-xs sm:text-base font-black text-slate-900">₹{product.salePrice || product.price}</p>
                  </div>
                </div>
                <div className="p-3 sm:p-5 pt-0">
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 min-h-[38px] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
