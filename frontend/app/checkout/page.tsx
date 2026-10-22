'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Tag, MapPin, CreditCard, CheckCircle2, Lock } from 'lucide-react';

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

  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (savedCart.length === 0) {
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

    // Fetch active coupons created from Admin/SuperAdmin dashboards
    fetch(`${apiUrl}/api/promotions`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.coupons) {
          setCoupons(data.coupons);
        }
      })
      .catch(err => console.error('Error fetching coupons:', err));
  }, [router, apiUrl]);

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
    setPincode(val);
    if (val.length === 6) {
      setLoadingPincode(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data && data[0]?.Status === 'Success') {
          const details = data[0].PostOffice[0];
          setCity(details.District);
          setState(details.State);
        } else {
          alert('Invalid Pincode or details not found.');
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
  };

  const handleApplyCustomCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const found = coupons.find(c => c.code.toUpperCase() === couponCodeInput.trim().toUpperCase());
    if (found) {
      handleApplyCoupon(found);
      alert(`Coupon ${found.code} applied! ${found.discountPct}% OFF`);
    } else {
      alert('Invalid coupon code.');
    }
  };

  const discountedTotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Number((discountedTotal * 0.18).toFixed(2)); // 18% GST calculation
  const finalPayableAmount = Number((discountedTotal + gstAmount).toFixed(2));

  // ==================== REAL RAZORPAY CHECKOUT HANDLER ====================
  const handleRazorpayPayment = async () => {
    setGatewayError(null);

    if (!fullName.trim() || !phone.trim() || !address.trim() || !pincode.trim() || !city.trim() || !state.trim()) {
      alert('Please fill in all delivery address fields before proceeding.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      router.push('/cart');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      alert('Please sign in to complete your checkout.');
      router.push('/auth');
      return;
    }

    // Prevent duplicate clicks
    if (loadingOrder) return;
    setLoadingOrder(true);

    try {
      // 1. Load Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setGatewayError('Unable to load Razorpay payment gateway script. Please check your internet connection and try again.');
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
        alert(errorMsg);
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
          color: '#0f172a' // slate-900 brand header
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          setLoadingOrder(true);
          try {
            // 4. Send payment credentials to backend for cryptographic signature verification
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
              alert(`Payment verification failed: ${verifyData.error || 'Invalid signature'}`);
              setLoadingOrder(false);
              return;
            }

            // 5. Verification successful: Clear cart and update local history cache
            localStorage.removeItem('cartItems');
            window.dispatchEvent(new Event('storage'));

            const existingOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
            localStorage.setItem('customerOrders', JSON.stringify([verifyData.order, ...existingOrders]));

            alert('Payment verified successfully! Your order has been placed.');
            router.push('/profile?tab=orders');
          } catch (verifyErr: any) {
            console.error('Verification request error:', verifyErr);
            alert('A network error occurred while verifying your payment. Please check your order history.');
            router.push('/profile?tab=orders');
          } finally {
            setLoadingOrder(false);
          }
        },
        modal: {
          ondismiss: async function () {
            setLoadingOrder(false);
            // Notify server that customer dismissed checkout without completing payment
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
              // Ignore background dismissal notification failures
            }
          }
        }
      };

      // 4. Instantiate and open official Razorpay Checkout modal
      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (failureResponse: any) {
        console.error('Razorpay payment failed:', failureResponse.error);
        const failDesc = failureResponse.error?.description || 'Transaction was declined by issuing bank.';
        setGatewayError(`Payment Failed: ${failDesc}`);
        alert(`Payment Failed: ${failDesc}`);
        setLoadingOrder(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout processing error:', err);
      const msg = err.message || 'An unexpected error occurred while initiating checkout.';
      setGatewayError(msg);
      alert(msg);
      setLoadingOrder(false);
    }
  };

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
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold space-y-1">
            <p className="font-bold uppercase tracking-wider text-red-800">Payment Gateway Notice</p>
            <p>{gatewayError}</p>
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
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pincode (6 digits) *</label>
                  <input type="text" maxLength={6} required value={pincode} onChange={e => handlePincodeChange(e.target.value)} placeholder="431001" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-bold tracking-widest" />
                  {loadingPincode && <span className="text-[10px] text-blue-600 font-bold mt-1 block">Auto-fetching location...</span>}
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">City *</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} placeholder="Chhatrapati Sambhajinagar" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">State *</label>
                  <input type="text" required value={state} onChange={e => setState(e.target.value)} placeholder="Maharashtra" className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium" />
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
                <button type="submit" className="bg-slate-900 text-amber-400 font-black px-6 py-3 rounded-xl uppercase tracking-wider hover:bg-slate-800 transition">Apply</button>
              </form>

              {coupons.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Available Promos:</p>
                  <div className="flex flex-wrap gap-2">
                    {coupons.map(cp => (
                      <button key={cp.id} type="button" onClick={() => handleApplyCoupon(cp)} className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition ${selectedCoupon?.id === cp.id ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs' : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'}`}>
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
