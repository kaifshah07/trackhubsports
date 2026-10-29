'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Tag,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Package,
  Truck,
  ArrowRight,
  Printer,
  Clock,
  FileText,
  RotateCw,
  ExternalLink
} from 'lucide-react';

function CheckoutContent() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Address fields with Pincode Auto-Sync
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  // Confirmed Order & Pending Verification States
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [pendingVerification, setPendingVerification] = useState<any | null>(null);
  const [verifyingNotice, setVerifyingNotice] = useState<string | null>(null);

  // Guard refs to prevent concurrent or duplicate verification calls
  const isVerifyingRef = useRef(false);
  const verifiedPaymentIdRef = useRef<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  // 1. Initial Mount & Order State Restoration
  useEffect(() => {
    // A. Check if the user already has a confirmed order (e.g. page refresh, back navigation, or orderId in URL)
    const urlOrderId = searchParams.get('orderId');
    const cachedConfirmed = sessionStorage.getItem('latestConfirmedOrder');

    if (cachedConfirmed) {
      try {
        const parsed = JSON.parse(cachedConfirmed);
        if (!urlOrderId || parsed.id === urlOrderId) {
          setConfirmedOrder(parsed);
          return;
        }
      } catch (e) {
        // Ignore cache parsing error
      }
    }

    // If orderId is in URL, fetch confirmed order from backend
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (urlOrderId && token) {
      fetch(`${apiUrl}/api/customer/orders/${urlOrderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order && data.order.status === 'CONFIRMED') {
            setConfirmedOrder(data.order);
            sessionStorage.setItem('latestConfirmedOrder', JSON.stringify(data.order));
            return;
          }
        })
        .catch(err => console.error('Error restoring confirmed order:', err));
    }

    // B. Check for pending verification in sessionStorage
    const savedPending = sessionStorage.getItem('pendingVerification');
    if (savedPending) {
      try {
        const parsedPending = JSON.parse(savedPending);
        setPendingVerification(parsedPending);
      } catch (e) {
        // Ignore
      }
    }

    // C. Handle redirect callbacks from 3D Secure / mobile bank redirect
    const rzpPaymentId = searchParams.get('razorpay_payment_id');
    const rzpOrderId = searchParams.get('razorpay_order_id');
    const rzpSignature = searchParams.get('razorpay_signature');
    const activeOrderId = searchParams.get('orderId') || sessionStorage.getItem('activeCheckoutOrderId');

    if (rzpPaymentId && rzpOrderId && rzpSignature && activeOrderId) {
      executeVerification({
        orderId: activeOrderId,
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: rzpSignature
      });
      return;
    }

    // D. Validate Cart & User Authentication
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (savedCart.length === 0 && !confirmedOrder && !cachedConfirmed && !urlOrderId && !savedPending) {
      router.push('/cart');
      return;
    }
    setCartItems(savedCart);

    if (!token) {
      router.push('/auth');
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('customerUser') || '{}');
    if (savedUser?.fullName) setFullName(savedUser.fullName);
    if (savedUser?.phone) setPhone(savedUser.phone);
    if (savedUser?.email) setUserEmail(savedUser.email);

    // Fetch active promotions
    fetch(`${apiUrl}/api/promotions`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.coupons) {
          setCoupons(data.coupons);
        }
      })
      .catch(err => console.error('Error fetching coupons:', err));
  }, [router, apiUrl, searchParams]);

  // 2. Auto-retry pending verification with backoff if network glitched
  useEffect(() => {
    let retryTimer: NodeJS.Timeout;
    if (pendingVerification && !confirmedOrder && !isVerifyingRef.current) {
      retryTimer = setTimeout(() => {
        executeVerification(pendingVerification);
      }, 5000);
    }
    return () => clearTimeout(retryTimer);
  }, [pendingVerification, confirmedOrder]);

  // Dynamically load the official Razorpay Checkout SDK script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Auto-sync City and State when 6-digit Pincode is entered
  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setPincode(cleaned);
    if (cleaned.length === 6) {
      setLoadingPincode(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        const data = await res.json();
        if (data && data[0]?.Status === 'Success') {
          const details = data[0].PostOffice[0];
          setCity(details.District);
          setState(details.State);
        } else {
          setGatewayError('Pincode details not found. You can enter your City and State manually.');
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + (Number(curr.salePrice || curr.price) * (curr.quantity || 1)), 0);

  const handleApplyCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    const disc = Number(((subtotal * coupon.discountPct) / 100).toFixed(2));
    setDiscountAmount(disc);
    setGatewayError(null);
  };

  const handleApplyCustomCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const found = coupons.find(c => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase());
    if (found) {
      handleApplyCoupon(found);
    } else {
      setGatewayError('Invalid coupon code entered.');
    }
  };

  const discountedTotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Number((discountedTotal * 0.18).toFixed(2)); // 18% GST calculation
  const finalPayableAmount = Number((discountedTotal + gstAmount).toFixed(2));

  // ==================== IDEMPOTENT ATOMIC VERIFICATION HANDLER ====================
  const executeVerification = async (credentials: {
    orderId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    // 1. Guard against duplicate concurrent calls
    if (isVerifyingRef.current) return;
    if (verifiedPaymentIdRef.current === credentials.razorpay_payment_id && confirmedOrder) {
      return;
    }

    isVerifyingRef.current = true;
    setLoadingOrder(true);
    setGatewayError(null);
    setVerifyingNotice('Verifying payment signature with Razorpay and updating fulfillment records...');

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');

    try {
      const verifyRes = await fetch(`${apiUrl}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(credentials)
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success && verifyData.order) {
        // Genuine confirmation success: Mark verified
        verifiedPaymentIdRef.current = credentials.razorpay_payment_id;
        setPendingVerification(null);
        sessionStorage.removeItem('pendingVerification');
        sessionStorage.removeItem('activeCheckoutOrderId');

        const confirmedRecord = verifyData.order;

        // Clear cart only after verified backend confirmation
        localStorage.removeItem('cartItems');
        window.dispatchEvent(new Event('storage'));

        // Cache confirmed order for page refreshes and profile history
        sessionStorage.setItem('latestConfirmedOrder', JSON.stringify(confirmedRecord));
        const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
        const updatedOrders = [confirmedRecord, ...existingOrders.filter((o: any) => o.id !== confirmedRecord.id)];
        localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));

        // Update URL cleanly with orderId for bookmarking/refreshing without reload
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', `/checkout?orderId=${confirmedRecord.id}`);
        }

        setConfirmedOrder(confirmedRecord);
        setCartItems([]);
      } else if (verifyRes.status === 400 || (verifyData && verifyData.success === false && !verifyData.error?.includes('network'))) {
        // Verification explicitly rejected by server (e.g. invalid signature, amount mismatch)
        setGatewayError(verifyData.error || 'Payment signature verification was declined by server.');
        setPendingVerification(null);
        sessionStorage.removeItem('pendingVerification');
      } else {
        // Uncertain result (e.g. 502 Bad Gateway, 504 Timeout, cold start)
        throw new Error(verifyData?.error || 'Verification server responded with uncertain status.');
      }
    } catch (err: any) {
      console.warn('Payment verification pending resolution:', err);
      // Payment succeeded at Razorpay, but server verification is delayed or network timed out.
      // Do NOT tell customer payment failed! Show pending-verification state with safe manual retry.
      const pendingRecord = {
        ...credentials,
        timestamp: Date.now()
      };
      setPendingVerification(pendingRecord);
      sessionStorage.setItem('pendingVerification', JSON.stringify(pendingRecord));
      setGatewayError(null);
    } finally {
      isVerifyingRef.current = false;
      setLoadingOrder(false);
      setVerifyingNotice(null);
    }
  };

  // ==================== REAL RAZORPAY CHECKOUT HANDLER ====================
  const handleRazorpayPayment = async () => {
    setGatewayError(null);

    if (!fullName.trim() || !phone.trim() || !address.trim() || !pincode.trim() || !city.trim() || !state.trim()) {
      setGatewayError('Please complete all delivery address fields before proceeding to payment.');
      return;
    }

    if (cartItems.length === 0) {
      setGatewayError('Your cart is empty.');
      router.push('/cart');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      router.push('/auth');
      return;
    }

    if (loadingOrder) return;
    setLoadingOrder(true);

    try {
      // 1. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setGatewayError('Unable to load Razorpay payment gateway script. Please check your internet connection.');
        setLoadingOrder(false);
        return;
      }

      // 2. Request backend to validate items, stock, prices, and create the Razorpay order
      const createOrderRes = await fetch(`${apiUrl}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity || 1,
            size: item.selectedSize || item.size || null,
            color: item.selectedColor || item.color || null
          })),
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            pincode: pincode.trim(),
            city: city.trim(),
            state: state.trim()
          },
          couponCode: selectedCoupon?.code || null
        })
      });

      const orderData = await createOrderRes.json();

      if (!orderData.success) {
        const errorMsg = orderData.error || 'Failed to initialize payment order on server.';
        setGatewayError(errorMsg);
        setLoadingOrder(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = orderData;

      // Track active orderId in sessionStorage for redirect recovery
      sessionStorage.setItem('activeCheckoutOrderId', orderId);

      // 3. Configure official Razorpay Checkout options
      const options = {
        key: keyId,
        amount: amount, // in paise
        currency: currency || 'INR',
        name: 'Track Hub Sports',
        description: `Order #${orderId.slice(-6).toUpperCase()}`,
        image: '/logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: fullName.trim(),
          contact: phone.trim(),
          email: userEmail || ''
        },
        theme: {
          color: '#0f172a'
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          // Send payment credentials to backend for cryptographic signature verification and capture check
          await executeVerification({
            orderId: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        modal: {
          ondismiss: function () {
            // Dismissing the modal resets loading state without prematurely cancelling the order
            setLoadingOrder(false);
          }
        }
      };

      // 4. Instantiate and open official Razorpay Checkout modal
      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (failureResponse: any) {
        console.error('Razorpay payment failed:', failureResponse.error);
        const failDesc = failureResponse.error?.description || 'Payment was declined or cancelled by the user.';
        setGatewayError(`Payment Failed: ${failDesc}`);
        setLoadingOrder(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout processing error:', err);
      const msg = err.message || 'An unexpected error occurred while initiating checkout.';
      setGatewayError(msg);
      setLoadingOrder(false);
    }
  };

  // ==================== VIEW 1: CONFIRMED ORDER RECORD ====================
  if (confirmedOrder) {
    const orderItemsList = Array.isArray(confirmedOrder.orderItems) && confirmedOrder.orderItems.length > 0
      ? confirmedOrder.orderItems
      : cartItems;

    const estDeliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return (
      <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">

          {/* Celebratory Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-700 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-3.5 py-1 rounded-full border border-green-200">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> Payment Verified & Order Confirmed
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-1">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
              We have received your payment. Your order has been placed in our fulfillment system and is being packed.
            </p>
          </div>

          {/* Live Order Tracking Stepper */}
          <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Reference</span>
                <p className="text-sm sm:text-base font-black text-amber-400 font-mono">
                  #{confirmedOrder.id ? confirmedOrder.id.slice(-8).toUpperCase() : 'ORD-CONFIRMED'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Delivery</span>
                <p className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {estDeliveryDate}
                </p>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="relative py-2">
              <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md mb-1.5">
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">Order Placed</span>
                  <span className="text-[9px] text-slate-400">Completed</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md mb-1.5">
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">Payment Confirmed</span>
                  <span className="text-[9px] text-emerald-400 font-bold">Verified</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs mb-1.5">
                    3
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">Processing</span>
                  <span className="text-[9px] text-slate-400">In Fulfillment</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold flex items-center justify-center text-xs mb-1.5">
                    4
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">Delivered</span>
                  <span className="text-[9px] text-slate-500">Track Hub Express</span>
                </div>
              </div>

              {/* Connecting Stepper Bar */}
              <div className="absolute top-[22px] left-[12%] right-[12%] h-1 bg-slate-800 -z-0">
                <div className="h-full bg-amber-400 w-1/2 transition-all duration-500" />
              </div>
            </div>
          </div>

          {/* Delivery Address & Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Delivery Address Card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Delivery Address
              </h3>
              <p className="font-bold text-slate-900 text-sm">{fullName || confirmedOrder.shippingAddress?.fullName || 'Customer'}</p>
              <p className="text-gray-600">{address || confirmedOrder.shippingAddress?.address}</p>
              <p className="text-gray-600">
                {(city || confirmedOrder.shippingAddress?.city)}, {(state || confirmedOrder.shippingAddress?.state)} - <b className="text-slate-900">{(pincode || confirmedOrder.shippingAddress?.pincode)}</b>
              </p>
              <p className="text-gray-500 font-medium pt-1">Phone: <b className="text-slate-800">{(phone || confirmedOrder.shippingAddress?.phone)}</b></p>
            </div>

            {/* Payment Summary Card */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-green-600" /> Payment & Billing
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Method:</span>
                <span className="font-bold text-slate-800">Razorpay Online</span>
              </div>
              {(confirmedOrder.paymentId || (confirmedOrder.shippingAddress as any)?.razorpayPaymentId) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">
                    {confirmedOrder.paymentId || (confirmedOrder.shippingAddress as any)?.razorpayPaymentId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment Status:</span>
                <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-[10px]">PAID & VERIFIED</span>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                <span className="font-bold text-slate-900">Total Paid:</span>
                <span className="font-black text-amber-600 text-base">₹{Number(confirmedOrder.totalAmount || finalPayableAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Itemized Product Record */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 text-left space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
              <span>Itemized Order Record</span>
              <span className="text-[11px] font-semibold text-gray-500">{orderItemsList.length} {orderItemsList.length === 1 ? 'Item' : 'Items'}</span>
            </h3>

            <div className="divide-y divide-gray-200/80 max-h-56 overflow-y-auto pr-1">
              {orderItemsList.map((item: any, idx: number) => {
                const prod = item.product || item;
                const itemPrice = Number(item.price || prod.salePrice || prod.price || 0);
                const qty = item.quantity || 1;
                return (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-10 h-10 object-cover rounded-xl border shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0 text-slate-600 font-bold text-[10px]">
                          THS
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate text-[11px]">{prod.name || 'Sportswear Item'}</p>
                        <p className="text-[10px] text-gray-500">Qty: <b className="text-slate-800">{qty}</b> × ₹{itemPrice.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-xs shrink-0">₹{(itemPrice * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3.5 px-5 rounded-xl border border-gray-300 hover:bg-gray-50 text-slate-900 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / Save Receipt
            </button>
            <Link
              href={`/profile?tab=orders&orderId=${confirmedOrder.id || ''}`}
              className="flex-1 py-3.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" /> Track in My Orders
            </Link>
            <Link
              href="/shop"
              className="py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Store
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // ==================== VIEW 2: PENDING VERIFICATION SCREEN ====================
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
            <Clock className="w-9 h-9 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
              Payment Acknowledged — Verifying Order
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 pt-1">
              Payment Received at Razorpay
            </h1>
            <p className="text-xs text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
              Your payment of <b className="text-slate-900">₹{finalPayableAmount.toFixed(2)}</b> was acknowledged by Razorpay. We are connecting with our fulfillment database to confirm your order. Your money is completely safe.
            </p>
          </div>

          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-gray-600">
              <span>Order Reference:</span>
              <span className="font-bold text-slate-900">#THS-{pendingVerification.orderId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Razorpay Payment ID:</span>
              <span className="font-bold text-slate-900">{pendingVerification.razorpay_payment_id}</span>
            </div>
          </div>

          {verifyingNotice && (
            <p className="text-xs text-amber-700 font-semibold flex items-center justify-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 animate-spin" /> {verifyingNotice}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={loadingOrder}
              onClick={() => executeVerification(pendingVerification)}
              className="flex-1 py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loadingOrder ? 'animate-spin' : ''}`} />
              <span>{loadingOrder ? 'Checking Status...' : 'Check Verification Status'}</span>
            </button>
            <Link
              href="/profile?tab=orders"
              className="py-3 px-5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5"
            >
              <span>View My Orders</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==================== VIEW 3: CHECKOUT FORM ====================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Secure Checkout</h1>
            <p className="text-xs text-gray-500 font-medium">Complete your order with Razorpay secure payment gateway</p>
          </div>
        </div>

        {gatewayError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-red-800">Payment Notice</p>
              <p>{gatewayError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

          {/* Left Column: Delivery Address & Pincode Sync */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Shipping Address Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode (6 digits) *</label>
                  <input type="text" maxLength={6} required value={pincode} onChange={e => handlePincodeChange(e.target.value)} placeholder="Pincode" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-bold tracking-widest" />
                  {loadingPincode && <span className="text-[10px] text-blue-600 font-bold mt-1 block">Auto-fetching location...</span>}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input type="text" required value={state} onChange={e => setState(e.target.value)} placeholder="State" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Street Address / Landmark *</label>
                  <textarea required rows={2} value={address} onChange={e => setAddress(e.target.value)} placeholder="House No, Building, Street Name..." className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
              </div>
            </div>

            {/* Coupons Section */}
            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" /> Apply Available Coupons
              </h2>

              <form onSubmit={handleApplyCustomCoupon} className="flex gap-2 text-xs">
                <input type="text" value={couponCodeInput} onChange={e => setCouponCodeInput(e.target.value)} placeholder="Enter coupon code..." className="flex-1 p-3 border rounded-xl bg-white uppercase font-bold text-gray-900" />
                <button type="submit" className="bg-slate-900 text-amber-400 font-black px-6 py-3 rounded-xl uppercase tracking-wider hover:bg-slate-800 transition cursor-pointer">Apply</button>
              </form>

              {coupons.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Available Promos:</p>
                  <div className="flex flex-wrap gap-2">
                    {coupons.map(cp => (
                      <button key={cp.id} type="button" onClick={() => handleApplyCoupon(cp)} className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer ${selectedCoupon?.id === cp.id ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'}`}>
                        {cp.code} ({cp.discountPct}% OFF)
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Final Price Calculation */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-sm space-y-6 h-fit">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Price Details</h3>

            <div className="space-y-3 text-xs border-b pb-4">
              <div className="flex justify-between font-medium text-gray-600">
                <span>Bag Subtotal ({cartItems.length} items)</span>
                <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-bold text-green-600">
                  <span>Coupon Discount ({selectedCoupon?.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-gray-600">
                <span>GST (18%)</span>
                <span className="font-bold text-slate-900">+₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-bold text-green-600">FREE</span>
              </div>
            </div>

            <div className="flex justify-between font-black text-base text-slate-900">
              <span>Final Payable Amount</span>
              <span className="text-amber-600">₹{finalPayableAmount.toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={loadingOrder}
              onClick={handleRazorpayPayment}
              className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> {loadingOrder ? 'Connecting to Razorpay...' : `Pay ₹${finalPayableAmount.toFixed(2)} via Razorpay`}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-semibold pt-2">
              <ShieldCheck className="w-4 h-4 text-green-600" /> 256-Bit SSL Encrypted Razorpay Checkout
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-xs">Loading Secure Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
