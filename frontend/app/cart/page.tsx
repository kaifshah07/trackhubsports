'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Trash2, ArrowLeft, Lock } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCart);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = (item.quantity || 1) + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('cartItems', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('cartItems', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + (Number(curr.salePrice || curr.price) * (curr.quantity || 1)), 0);

  const handleCheckout = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      alert('Please sign in to proceed with secure checkout.');
      router.push('/auth');
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" /> Shopping Cart
          </h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">🛒</div>
            <h3 className="text-lg font-black text-slate-900">Your cart is empty</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">Add items to your cart and they will be safely saved here.</p>
            <Link href="/" className="inline-block bg-slate-900 text-amber-400 font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md">
              Explore Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <img 
                    src={item.imageUrl || '/placeholder-product.svg'} 
                    alt={item.name} 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-product.svg'; }} 
                    className="w-20 h-20 object-contain p-1 rounded-xl border bg-gray-50" 
                  />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</h4>
                    <p className="text-xs font-black text-amber-600 mt-1">₹{item.salePrice || item.price}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-gray-100">-</button>
                        <span className="px-3 text-xs font-black">{item.quantity || 1}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-gray-100">+</button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6 h-fit">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Order Summary</h3>
              <div className="space-y-3 text-xs border-b pb-4">
                <div className="flex justify-between font-medium text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-600">
                  <span>Shipping</span>
                  <span className="font-bold text-green-600">FREE</span>
                </div>
              </div>
              <div className="flex justify-between font-black text-base text-slate-900">
                <span>Total Amount</span>
                <span>₹{subtotal}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" /> Proceed to Checkout
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}