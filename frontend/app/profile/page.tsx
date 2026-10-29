'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Package,
  MapPin,
  Shield,
  Edit2,
  Save,
  Trash2,
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCw,
  Clock,
  ShieldCheck,
  Printer,
  Truck,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  Calendar,
  CreditCard,
  Tag,
  Search
} from 'lucide-react';

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

  // Order Tracking, Invoice & Filter States
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);
  const [expandedTrackingOrderId, setExpandedTrackingOrderId] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Change Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailExpirySeconds, setEmailExpirySeconds] = useState(300);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showEmailModal && emailStep === 2 && emailExpirySeconds > 0) {
      timer = setTimeout(() => setEmailExpirySeconds(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showEmailModal, emailStep, emailExpirySeconds]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const targetOrderId = searchParams.get('orderId');
    if (tab === 'orders' || targetOrderId) setActiveTab('orders');
    if (tab === 'address') setActiveTab('address');
    if (targetOrderId) setExpandedTrackingOrderId(targetOrderId);

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

  const openEmailModal = () => {
    setEmailStep(1);
    setCurrentPassword('');
    setNewEmail('');
    setEmailOtp('');
    setEmailError(null);
    setEmailSuccess(null);
    setShowEmailModal(true);
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailError(null);
    setEmailSuccess(null);
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailLoading(true);

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      router.push('/auth');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/customer/request-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newEmail: newEmail.trim().toLowerCase()
        })
      });

      const data = await res.json();
      if (data.success) {
        setEmailSuccess(data.message || `A verification code was dispatched to ${newEmail.trim().toLowerCase()}`);
        setEmailCooldown(60);
        setEmailExpirySeconds(300);
        setEmailStep(2);
      } else {
        setEmailError(data.error || 'Failed to initiate email change.');
      }
    } catch (err) {
      setEmailError('Network error: Could not connect to profile server.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmailChangeOtp = async () => {
    if (emailCooldown > 0) return;
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');

    try {
      const res = await fetch(`${apiUrl}/api/customer/resend-email-change-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (data.success) {
        setEmailSuccess(data.message || 'A new verification code has been dispatched.');
        setEmailCooldown(60);
        setEmailExpirySeconds(300);
      } else {
        setEmailError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setEmailError('Network error: Unable to reach server.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim()) {
      setEmailError('Please enter the 6-digit verification code.');
      return;
    }

    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(null);

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');

    try {
      const res = await fetch(`${apiUrl}/api/customer/verify-email-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: emailOtp.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        // Store updated token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('customerToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('customerUser', JSON.stringify(data.user));
        setUser(data.user);
        setEmailSuccess("Email address successfully updated!");
        setTimeout(() => {
          setShowEmailModal(false);
        }, 1500);
      } else {
        setEmailError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setEmailError('Network error: Failed to verify email code.');
    } finally {
      setEmailLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
                  <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer">
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
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-gray-700">Email Address</label>
                        <button
                          type="button"
                          onClick={openEmailModal}
                          className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3 h-3" /> Change Email
                        </button>
                      </div>
                      <input type="email" disabled value={user.email} className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 font-semibold" />
                    </div>
                    <button type="submit" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl uppercase tracking-wider shadow-md transition flex items-center gap-2 cursor-pointer">
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Full Name</span>
                      <p className="font-black text-slate-900 text-sm">{user.fullName}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      </div>
                      <p className="font-black text-slate-900 text-sm break-all">{user.email}</p>
                      <div>
                        <button
                          type="button"
                          onClick={openEmailModal}
                          className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" /> Change Email Address
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Phone Number</span>
                      <p className="font-black text-slate-900 text-sm">{user.phone || 'Not provided'}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border space-y-1">
                      <span className="text-gray-400 font-semibold uppercase text-[10px]">Account Security</span>
                      <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5 pt-1">
                        <ShieldCheck className="w-4 h-4 text-green-600" /> Protected with OTP Authentication
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ORDERS & HISTORY */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Search & Status Filters Header */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-500" /> My Orders & Track Records
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Track live package status, view dispatch records, and download official tax invoices.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'all', label: 'All Orders' },
                        { id: 'active', label: 'In Progress' },
                        { id: 'delivered', label: 'Delivered' },
                        { id: 'cancelled', label: 'Cancelled' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setOrderFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            orderFilter === tab.id
                              ? 'bg-slate-900 text-amber-400 shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by Order ID (#THS-...) or product title..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                {(() => {
                  const filteredOrders = orders.filter((ord: any) => {
                    if (orderFilter === 'active') {
                      if (!['PENDING', 'CONFIRMED', 'SHIPPED'].includes(ord.status)) return false;
                    } else if (orderFilter === 'delivered') {
                      if (ord.status !== 'DELIVERED') return false;
                    } else if (orderFilter === 'cancelled') {
                      if (ord.status !== 'CANCELLED') return false;
                    }

                    if (orderSearchQuery.trim()) {
                      const q = orderSearchQuery.toLowerCase();
                      const ordId = (ord.id || '').toLowerCase();
                      const hasItem = Array.isArray(ord.orderItems) && ord.orderItems.some((it: any) =>
                        (it.product?.name || '').toLowerCase().includes(q)
                      );
                      if (!ordId.includes(q) && !hasItem) return false;
                    }
                    return true;
                  });

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="bg-white p-10 sm:p-14 text-center space-y-3 rounded-3xl border border-gray-200 shadow-sm">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                          <Package className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900">No Orders Found</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto font-medium">
                          {orderSearchQuery || orderFilter !== 'all'
                            ? 'No orders match your filter criteria. Try resetting the search query.'
                            : 'You have not placed any orders yet. Discover our latest sportswear and gear.'}
                        </p>
                        <Link
                          href="/shop"
                          className="inline-block bg-slate-900 text-amber-400 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-800 transition"
                        >
                          Explore Store
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredOrders.map((ord: any, idx: number) => {
                        const orderCode = ord.id ? ord.id.slice(-8).toUpperCase() : `ORD-${idx + 1}`;
                        const isExpanded = expandedTrackingOrderId === ord.id;
                        const status = ord.status || 'CONFIRMED';

                        const isCancelled = status === 'CANCELLED';
                        const isPending = status === 'PENDING';
                        const isConfirmed = ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(status);
                        const isShipped = ['SHIPPED', 'DELIVERED'].includes(status);
                        const isDelivered = status === 'DELIVERED';

                        const shippingMeta = typeof ord.shippingAddress === 'object' && ord.shippingAddress !== null
                          ? ord.shippingAddress
                          : {};

                        const courierName = shippingMeta.courierName || 'Track Hub Express Logistics';
                        const awbCode = shippingMeta.awbCode || (isShipped ? `THS-AWB-${orderCode}` : 'Awaiting Dispatch');
                        const trackingUrl = shippingMeta.trackingUrl;
                        const estimatedDelivery = shippingMeta.estimatedDelivery || '3-5 Business Days';

                        return (
                          <div
                            key={ord.id || idx}
                            className="bg-white rounded-3xl border border-gray-200 shadow-xs hover:shadow-md transition overflow-hidden"
                          >
                            {/* Order Card Header */}
                            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-gray-50/80 to-white">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-mono text-xs sm:text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    #THS-{orderCode}
                                  </span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full uppercase text-[10px] font-black tracking-wider ${
                                      status === 'DELIVERED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : status === 'SHIPPED'
                                        ? 'bg-blue-100 text-blue-800'
                                        : status === 'CONFIRMED'
                                        ? 'bg-green-100 text-green-800'
                                        : status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  Placed on {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedOrderForInvoice(ord)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 text-xs font-bold transition shadow-2xs cursor-pointer"
                                  title="View and print tax invoice"
                                >
                                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Invoice / Bill</span>
                                </button>
                                <button
                                  onClick={() => setExpandedTrackingOrderId(isExpanded ? null : ord.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>{isExpanded ? 'Hide Track Record' : 'Track Package'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Summary Bar */}
                            <div className="px-5 sm:px-6 py-3 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-gray-100">
                              <div className="flex items-center gap-4 text-gray-600">
                                <div>
                                  <span className="text-gray-400 text-[11px] block">Total Amount</span>
                                  <b className="text-slate-900 font-black text-sm">₹{Number(ord.totalAmount).toFixed(2)}</b>
                                </div>
                                <div className="h-6 w-px bg-gray-200" />
                                <div>
                                  <span className="text-gray-400 text-[11px] block">Payment Method</span>
                                  <span className="font-bold text-slate-700">{ord.paymentMode || 'Online (Razorpay)'}</span>
                                </div>
                                {Array.isArray(ord.orderItems) && (
                                  <>
                                    <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                                    <div className="hidden sm:block">
                                      <span className="text-gray-400 text-[11px] block">Package Items</span>
                                      <span className="font-bold text-slate-700">{ord.orderItems.length} items</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Est. Delivery: <b>{estimatedDelivery}</b></span>
                              </div>
                            </div>

                            {/* Collapsible Live Tracking Stepper & Record */}
                            {isExpanded && (
                              <div className="p-5 sm:p-7 bg-amber-50/20 border-b border-gray-200/80 space-y-6">
                                {isCancelled ? (
                                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <div>
                                      <p className="font-black text-sm">Order Cancelled</p>
                                      <p className="text-[11px] text-red-600 mt-0.5">This order was cancelled. If you have any questions or require a refund status update, please contact support.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-amber-600" /> Live Package Tracking Stepper
                                      </h4>
                                      <span className="text-[11px] font-bold text-gray-500">
                                        Courier: <b className="text-slate-800">{courierName}</b>
                                      </span>
                                    </div>

                                    {/* 4-Stage Stepper Progress Bar */}
                                    <div className="relative py-3">
                                      <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                                        {/* Step 1: Placed */}
                                        <div className="flex flex-col items-center">
                                          <div className="w-9 h-9 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-xs mb-1.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                          </div>
                                          <span className="text-[11px] font-bold text-slate-900">Order Placed</span>
                                          <span className="text-[9px] text-gray-400">Received</span>
                                        </div>

                                        {/* Step 2: Confirmed */}
                                        <div className="flex flex-col items-center">
                                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-xs mb-1.5 transition ${
                                            isConfirmed ? 'bg-green-600 text-white' : isPending ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-gray-200 text-gray-400'
                                          }`}>
                                            {isConfirmed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                          </div>
                                          <span className={`text-[11px] font-bold ${isConfirmed ? 'text-slate-900' : 'text-gray-400'}`}>Confirmed</span>
                                          <span className="text-[9px] text-gray-400">{isConfirmed ? 'Payment Verified' : 'Processing'}</span>
                                        </div>

                                        {/* Step 3: Shipped */}
                                        <div className="flex flex-col items-center">
                                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-xs mb-1.5 transition ${
                                            isShipped ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                                          }`}>
                                            <Truck className="w-4 h-4" />
                                          </div>
                                          <span className={`text-[11px] font-bold ${isShipped ? 'text-slate-900' : 'text-gray-400'}`}>In Transit</span>
                                          <span className="text-[9px] text-gray-400">{isShipped ? 'Dispatched' : 'Handover Soon'}</span>
                                        </div>

                                        {/* Step 4: Delivered */}
                                        <div className="flex flex-col items-center">
                                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shadow-xs mb-1.5 transition ${
                                            isDelivered ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                                          }`}>
                                            <Package className="w-4 h-4" />
                                          </div>
                                          <span className={`text-[11px] font-bold ${isDelivered ? 'text-emerald-700' : 'text-gray-400'}`}>Delivered</span>
                                          <span className="text-[9px] text-gray-400">{isDelivered ? 'Completed' : 'Expected soon'}</span>
                                        </div>
                                      </div>

                                      {/* Connector Line behind */}
                                      <div className="absolute top-[28px] left-[12%] right-[12%] h-1 bg-gray-200 -z-0">
                                        <div
                                          className="h-full bg-slate-900 transition-all duration-500"
                                          style={{
                                            width: isDelivered ? '100%' : isShipped ? '66%' : isConfirmed ? '33%' : '5%'
                                          }}
                                        />
                                      </div>
                                    </div>

                                    {/* Courier Dispatch & AWB Card */}
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                                      <div className="space-y-0.5">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">AWB Tracking Number</span>
                                        <p className="font-mono font-black text-slate-900 text-sm">{awbCode}</p>
                                        <p className="text-[11px] text-gray-500 font-medium">Logistics Partner: {courierName}</p>
                                      </div>
                                      {trackingUrl && (
                                        <a
                                          href={trackingUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-xs transition"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          <span>Track on Courier Site</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Order Items List */}
                            <div className="p-5 sm:p-6 space-y-3">
                              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400">Items in this shipment</span>
                              {Array.isArray(ord.orderItems) && ord.orderItems.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                  {ord.orderItems.map((item: any, iIdx: number) => {
                                    const prod = item.product || {};
                                    return (
                                      <div key={item.id || iIdx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {prod.imageUrl ? (
                                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <Package className="w-5 h-5 text-gray-400" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-900 leading-snug">{prod.name || 'Athletic Sportswear'}</p>
                                            <p className="text-[11px] text-gray-500">Qty: {item.quantity} × ₹{Number(item.price).toFixed(2)}</p>
                                          </div>
                                        </div>
                                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">Product details archived.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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

      {/* OFFICIAL TAX INVOICE & ORDER RECORD MODAL */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOrderForInvoice(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Official Tax Invoice & Order Record
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-1">TRACK HUB SPORTS</h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Premium Sportswear, Performance Apparel & Equipment<br />
                  support@trackhubsports.com | www.trackhubsports.com
                </p>
              </div>
              <div className="sm:text-right text-xs">
                <p className="font-mono font-bold text-slate-900">
                  INVOICE: THS-INV-{selectedOrderForInvoice.id ? selectedOrderForInvoice.id.slice(-8).toUpperCase() : 'REC'}
                </p>
                <p className="text-gray-500 font-medium">
                  Date: {selectedOrderForInvoice.createdAt ? new Date(selectedOrderForInvoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800">
                  {selectedOrderForInvoice.status === 'DELIVERED' ? 'COMPLETED & DELIVERED' : 'PAID & CONFIRMED'}
                </span>
              </div>
            </div>

            {/* Bill To & Order Summary Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Customer & Delivery To:</span>
                <p className="font-bold text-slate-900">{user?.fullName || 'Valued Customer'}</p>
                <p className="text-gray-600">{user?.email}</p>
                {user?.phone && <p className="text-gray-600">Phone: {user.phone}</p>}
                {selectedOrderForInvoice.shippingAddress && (
                  <p className="text-gray-600 text-[11px] mt-1">
                    {typeof selectedOrderForInvoice.shippingAddress === 'string'
                      ? selectedOrderForInvoice.shippingAddress
                      : `${selectedOrderForInvoice.shippingAddress.address || ''}, ${selectedOrderForInvoice.shippingAddress.city || ''} ${selectedOrderForInvoice.shippingAddress.postalCode || ''}`}
                  </p>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">Payment & Dispatch Info:</span>
                <p className="text-gray-600">
                  Order Reference: <b className="font-mono text-slate-900">#THS-{selectedOrderForInvoice.id ? selectedOrderForInvoice.id.slice(-8).toUpperCase() : 'REF'}</b>
                </p>
                <p className="text-gray-600">
                  Payment Mode: <b className="text-slate-900">{selectedOrderForInvoice.paymentMode || 'Online (Razorpay)'}</b>
                </p>
                {selectedOrderForInvoice.shippingAddress?.courierName && (
                  <p className="text-gray-600">
                    Carrier: <b className="text-slate-900">{selectedOrderForInvoice.shippingAddress.courierName}</b>
                  </p>
                )}
                {selectedOrderForInvoice.shippingAddress?.awbCode && (
                  <p className="text-gray-600 font-mono text-[11px]">
                    AWB: <b className="text-slate-900">{selectedOrderForInvoice.shippingAddress.awbCode}</b>
                  </p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-slate-800">
                  {Array.isArray(selectedOrderForInvoice.orderItems) && selectedOrderForInvoice.orderItems.length > 0 ? (
                    selectedOrderForInvoice.orderItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.product?.name || 'Athletic Wear'}</td>
                        <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right">₹{Number(item.price).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-950">₹{(Number(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-center text-gray-500 italic">Sportswear Order Items</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Invoice Calculations */}
              <div className="bg-gray-50 p-4 border-t border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedOrderForInvoice.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Applicable Taxes (GST):</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between font-black text-slate-950 text-sm pt-2 border-t border-gray-200">
                  <span>Grand Total Paid:</span>
                  <span className="text-base text-amber-600">₹{Number(selectedOrderForInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Note & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-[11px] text-gray-400 italic text-center sm:text-left">
                Computer-generated tax invoice. No signature required.
              </p>
              <div className="flex items-center gap-2 w-full sm:w-auto print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE EMAIL SECURE MODAL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={closeEmailModal}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {emailStep === 1 ? 'Change Email Address' : 'Verify New Email'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {emailStep === 1
                  ? 'For security, please enter your current password and proposed new email address.'
                  : `Enter the 6-digit verification code dispatched to ${newEmail}.`}
              </p>
            </div>

            {/* Error & Success Alerts */}
            {emailError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{emailSuccess}</span>
              </div>
            )}

            {/* STEP 1 FORM */}
            {emailStep === 1 && (
              <form onSubmit={handleRequestEmailChange} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">New Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="new.email@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={closeEmailModal}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {emailLoading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2 FORM */}
            {emailStep === 2 && (
              <form onSubmit={handleVerifyEmailChange} className="space-y-4 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                  <p className="text-[11px] text-slate-500 font-medium">Verification Code sent to</p>
                  <p className="text-xs font-black text-slate-900 font-mono tracking-wide break-all">{newEmail}</p>
                  <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-700 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Valid for: {formatTimer(emailExpirySeconds)}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1 text-center">Enter 6-digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={emailOtp}
                    onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3.5 border border-gray-300 font-bold text-lg text-slate-900 text-center tracking-widest rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    disabled={emailLoading || emailCooldown > 0}
                    onClick={handleResendEmailChangeOtp}
                    className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${emailLoading ? 'animate-spin' : ''}`} />
                    {emailCooldown > 0 ? `Resend code in ${emailCooldown}s` : 'Resend code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailStep(1)}
                    className="text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={closeEmailModal}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    {emailLoading ? 'Verifying...' : 'Verify & Update Email'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
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
