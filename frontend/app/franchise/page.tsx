'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, PackageOpen, LayoutDashboard, LogOut, Lock, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FranchisePage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [franchiseOrders, setFranchiseOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>();
  const [loading, setLoading] = useState(true);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  useEffect(() => {
    const savedToken = localStorage.getItem('franchiseToken');
    const savedUser = JSON.parse(localStorage.getItem('franchiseUser') || 'null');

    if (savedToken && savedUser && savedUser.role === 'FRANCHISE') {
      setToken(savedToken);
      setUser(savedUser);
      fetchData(savedToken);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.user.role !== 'FRANCHISE') {
          setLoginError("Access Denied: Exclusive to Franchise Partners.");
          return;
        }
        localStorage.setItem('franchiseToken', data.token);
        localStorage.setItem('franchiseUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        fetchData(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Server connection error.');
    }
  };

  const fetchData = async (authToken: string) => {
    try {
      const prodRes = await fetch(`${apiUrl}/api/franchise/inventory`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.products);

      const ordRes = await fetch(`${apiUrl}/api/franchise/stock-orders`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const ordData = await ordRes.json();
      if (ordData.success) setFranchiseOrders(ordData.orders);
    } catch (err) { console.error(err); }
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setCart(prev => ({ ...prev, [productId]: Math.max(0, qty) }));
  };

  const handlePlaceStockOrder = async () => {
    const items = Object.entries(cart || {})
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([productId, quantity]) => {
        const prod = products.find(p => p.id === productId);
        return { productId, quantity, price: prod?.salePrice || prod?.price || 0 };
      });

    if (items.length === 0) {
      alert('Please select at least one product quantity to order.');
      return;
    }

    const totalAmount = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    try {
      const res = await fetch(`${apiUrl}/api/franchise/stock-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ items, totalAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert('Stock order submitted successfully! Track Hub Admin & Super Admin notified.');
        setCart({});
        fetchData(token!);
        setActiveTab('orders');
      } else { alert(data.error); }
    } catch (err) { alert('Error placing stock order.'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading Franchise Portal...</div>;

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 items-center justify-center shadow-lg mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black">Franchise Partner Portal</h1>
            <p className="text-xs text-gray-400">Manage local store inventory and order company stock.</p>
          </div>
          {loginError && <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded-xl font-medium">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Franchise Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="franchise@example.com" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider">
              Sign In as Franchise Partner
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalOrdersCount = franchiseOrders.length;
  const pendingOrdersCount = franchiseOrders.filter(o => o.status === 'PENDING' || o.status === 'PENDING_APPROVAL' || o.status === 'PROCESSING').length;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 font-sans flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-slate-950 text-white p-6 flex flex-col justify-between shrink-0 border-r border-white/10">
        <div className="space-y-8">
          <div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950">FRANCHISE HUB</span>
            <h2 className="text-lg font-black text-white mt-2">{user.fullName || 'Partner Store'}</h2>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" /> Overview & Summary
            </button>
            <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'inventory' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <PackageOpen className="w-4 h-4" /> Local Inventory & Reorder
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'orders' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <ShoppingBag className="w-4 h-4" /> Order History & Status
            </button>
          </nav>
        </div>
        <div className="pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 rounded-2xl text-xs font-bold hover:bg-red-600 hover:text-white transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-xl font-black text-slate-900">Franchise Management Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Stock Orders</span>
                <h3 className="text-3xl font-black text-slate-900">{totalOrdersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Pending Company Approvals</span>
                <h3 className="text-3xl font-black text-amber-600">{pendingOrdersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Company Catalog Items</span>
                <h3 className="text-3xl font-black text-slate-900">{products.length}</h3>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Local Inventory & Stock Requisition</h2>
              <button onClick={handlePlaceStockOrder} className="bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs uppercase shadow-md hover:bg-amber-500">
                Submit Stock Order to Admin
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products.map(p => (
                <div key={p.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50 space-y-3">
                  <img src={p.imageUrl} alt="" className="w-full h-36 object-cover rounded-xl border" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                    <p className="text-[11px] text-gray-500">MRP: ₹{p.price} | Offer: ₹{p.salePrice || p.price}</p>
                    <p className="text-[11px] font-bold text-blue-600 mt-1">Company Stock Available</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[11px] font-bold text-gray-600">Reorder Qty:</span>
                    <input 
                      type="number" 
                      min="0" 
                      value={cart?.[p.id] || 0} 
                      onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 0)} 
                      className="w-20 p-2 border rounded-xl text-xs text-center font-bold bg-white text-gray-900" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Stock Requisition Order History</h2>
            {franchiseOrders.length === 0 ? (
              <p className="text-xs text-gray-500">No stock orders placed yet.</p>
            ) : (
              franchiseOrders.map(ord => (
                <div key={ord.id} className="p-5 rounded-2xl border bg-gray-50 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Requisition ID #{ord.id.slice(-6).toUpperCase()}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase text-[10px]">{ord.status}</span>
                  </div>
                  <p className="text-gray-600">Total Amount: <b className="text-slate-900">₹{ord.totalAmount}</b> | Date: {new Date(ord.createdAt).toLocaleString()}</p>
                  <div className="pt-2 border-t space-y-1">
                    {ord.orderItems?.map((item: any) => (
                      <p key={item.id} className="text-[11px] text-gray-500">• {item.product?.name} x {item.quantity} Units (₹{item.price} each)</p>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}