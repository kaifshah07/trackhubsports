'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Package, MapPin, Shield, Edit2, Save, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

function ProfileContent() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'address'>('profile');
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders') setActiveTab('orders');
    if (tab === 'address') setActiveTab('address');

    const savedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customerUser') || 'null');
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');

    if (!savedUser || !token) {
      router.push('/auth');
      return;
    }

    setUser(savedUser);
    setFullName(savedUser.fullName || '');
    setPhone(savedUser.phone || '');

    const savedAddresses = JSON.parse(localStorage.getItem('savedAddresses') || '[]');
    setAddresses(savedAddresses);

    const savedOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
    setOrders(savedOrders);

    // Sync live customer orders from server database
    fetch(`${apiUrl}/api/customer/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          localStorage.setItem('customerOrders', JSON.stringify(data.orders));
        }
      })
      .catch(err => console.error('Failed to sync orders from backend:', err));
  }, [searchParams, router, apiUrl]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...user, fullName, phone };
    localStorage.setItem('user', JSON.stringify(updated));
    localStorage.setItem('customerUser', JSON.stringify(updated));
    setUser(updated);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;
    const updated = [...addresses, newAddress];
    setAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    setNewAddress('');
    alert('Address saved successfully!');
  };

  const handleDeleteAddress = (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    setAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Account Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Sidebar Tabs */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm h-fit">
            <div className="p-3 sm:p-4 border-b border-gray-100 mb-2">
              <p className="text-xs text-gray-500 font-semibold">Hello,</p>
              <h3 className="font-black text-slate-900 text-sm truncate">{user.fullName}</h3>
            </div>
            
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'profile' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <User className="w-4 h-4 flex-shrink-0" /> Personal Info
              </button>
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Package className="w-4 h-4 flex-shrink-0" /> Orders ({orders.length})
              </button>
              <button 
                onClick={() => setActiveTab('address')} 
                className={`flex-shrink-0 md:w-full flex items-center justify-center md:justify-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'address' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <MapPin className="w-4 h-4 flex-shrink-0" /> Addresses
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            
            {/* TAB 1: PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Personal Information</h2>
                  <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                    <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg text-xs">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 border rounded-xl bg-white font-semibold text-gray-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border rounded-xl bg-white font-semibold text-gray-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Email (Cannot be changed)</label>
                      <input type="email" disabled value={user.email} className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 font-semibold" />
                    </div>
                    <button type="submit" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl uppercase tracking-wider shadow-md transition flex items-center gap-2">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Full Name</span>
                      <p className="font-black text-slate-900 text-sm">{user.fullName}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</span>
                      <p className="font-black text-slate-900 text-sm">{user.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Phone Number</span>
                      <p className="font-black text-slate-900 text-sm">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDERS & HISTORY */}
            {activeTab === 'orders' && (
              <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">My Orders & Purchase History</h2>
                {orders.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center space-y-3 bg-gray-50 rounded-2xl border">
                    <p className="text-xs text-gray-500 font-semibold">You have not placed any orders yet.</p>
                    <Link href="/shop" className="inline-block bg-slate-900 text-amber-400 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider">
                      Explore Store
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord, i) => {
                      const statusColor = 
                        ord.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        ord.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800';

                      return (
                        <div key={ord.id || i} className="p-4 sm:p-5 rounded-2xl border bg-gray-50 text-xs space-y-3">
                          <div className="flex justify-between items-center font-bold text-slate-900 border-b pb-2">
                            <span>Order #{ord.id ? ord.id.slice(-8).toUpperCase() : `ORD-${i + 1}`}</span>
                            <span className={`px-2.5 py-0.5 rounded uppercase text-[10px] font-black ${statusColor}`}>
                              {ord.status || 'CONFIRMED'}
                            </span>
                          </div>
                          <div className="flex flex-wrap justify-between items-center gap-2 text-gray-600">
                            <p>
                              Total Amount: <b className="text-slate-900 font-black">₹{Number(ord.totalAmount).toFixed(2)}</b> 
                              {ord.paymentMode ? ` via ${ord.paymentMode}` : ''}
                            </p>
                            <span className="text-[11px] text-gray-400">
                              {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>

                          {/* Order Items list if available */}
                          {Array.isArray(ord.orderItems) && ord.orderItems.length > 0 && (
                            <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ordered Items:</p>
                              {ord.orderItems.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex justify-between items-center text-[11px] text-gray-700">
                                  <span>{item.product?.name || 'Sportswear Item'} <span className="text-gray-400 font-bold">x{item.quantity}</span></span>
                                  <span className="font-semibold text-slate-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === 'address' && (
              <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Manage Saved Delivery Addresses</h2>
                
                <form onSubmit={handleAddAddress} className="space-y-3 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Add New Delivery Address</label>
                    <textarea 
                      required 
                      rows={2} 
                      placeholder="House No, Street, City, Pincode, Landmark..." 
                      value={newAddress} 
                      onChange={e => setNewAddress(e.target.value)} 
                      className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-medium" 
                    />
                  </div>
                  <button type="submit" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition">
                    Save Address
                  </button>
                </form>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-xs font-bold uppercase text-gray-500">Your Saved Addresses</h3>
                  {addresses.length === 0 ? (
                    <p className="text-xs text-gray-400">No addresses saved yet.</p>
                  ) : (
                    addresses.map((addr, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border bg-gray-50 flex items-center justify-between text-xs">
                        <p className="font-semibold text-gray-800">{addr}</p>
                        <button onClick={() => handleDeleteAddress(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center font-bold text-xs">Loading Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
