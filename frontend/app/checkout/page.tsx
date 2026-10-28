'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowRight
} from 'lucide-react';

export default function CheckoutPage() {
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

  // On-page Order Confirmation Card State
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (savedCart.length === 0 && !confirmedOrder) {
      router.push('/cart');
      return;
    }
    setCartItems(savedCart);

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
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
  }, [router, apiUrl, confirmedOrder]);

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

    // Track payment completion state to eliminate modal.ondismiss race conditions
    let paymentCompleted = false;

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
          // Immediately set flag so modal.ondismiss does NOT treat this as a cancellation
          paymentCompleted = true;
          setLoadingOrder(true);

          try {
            // 4. Send payment credentials to backend for cryptographic signature verification and capture check
            const verifyRes = await fetch(`${apiUrl}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              setGatewayError(verifyData.error || 'Payment signature verification failed.');
              setLoadingOrder(false);
              return;
            }

            // 5. Verification confirmed: Clear cart only on genuine verified success
            localStorage.removeItem('cartItems');
            window.dispatchEvent(new Event('storage'));

            const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
            const confirmedOrderRecord = verifyData.order || {
              id: orderId,
              totalAmount: finalPayableAmount,
              paymentMode: 'RAZORPAY',
              status: 'CONFIRMED',
              createdAt: new Date().toISOString(),
              orderItems: cartItems
            };

            localStorage.setItem('customerOrders', JSON.stringify([confirmedOrderRecord, ...existingOrders]));

            // Set state to display on-page Order Confirmation Card
            setConfirmedOrder(confirmedOrderRecord);
            setCartItems([]);
          } catch (verifyErr: any) {
            console.error('Verification request error:', verifyErr);
            setGatewayError('Network error during payment verification. Please check your order history.');
          } finally {
            setLoadingOrder(false);
          }
        },
        modal: {
          ondismiss: async function () {
            // CRITICAL FIX: Only treat as cancellation if payment was NOT completed
            if (!paymentCompleted) {
              setLoadingOrder(false);
              try {
                await fetch(`${apiUrl}/api/payments/cancel-order`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ orderId })
                });
              } catch (e) {
                // Ignore dismissal background notification errors
              }
            }
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

  // If order is confirmed, display the rich On-Page Order Confirmation Card
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-10 pb-28 md:pb-10 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-green-100 text-green-700 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
              Payment Verified & Order Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-2">
              Thank You for Your Order!
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              We’ve received your payment and our fulfillment team is preparing your sportswear.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 text-left space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Order Reference</span>
                <p className="font-black text-slate-900 font-mono text-sm">
                  #{confirmedOrder.id ? confirmedOrder.id.slice(-8).toUpperCase() : 'ORD-CONFIRMED'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Amount Paid</span>
                <p className="font-black text-amber-600 text-base">
                  ₹{Number(confirmedOrder.totalAmount || finalPayableAmount).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-600" /> Delivery Address
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{fullName}</p>
                <p className="text-gray-600">{address}</p>
                <p className="text-gray-600">{city}, {state} - {pincode}</p>
                <p className="text-gray-600">Contact: {phone}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <Truck className="w-3 h-3 text-amber-600" /> Shipping Status
                </span>
                <p className="font-bold text-green-700 mt-0.5">Order Placed & Processing</p>
                <p className="text-gray-500 text-[11px] mt-1">
                  Estimated delivery in 3–5 business days. You will receive updates via email.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/profile?tab=orders"
              className="flex-1 py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" /> View My Orders
            </Link>
            <Link
              href="/shop"
              className="flex-1 py-3.5 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
