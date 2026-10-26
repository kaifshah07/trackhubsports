'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck, Trophy, RotateCw } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify-otp' | 'forgot' | 'reset'>('login');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    name: '', 
    surname: '', 
    phone: '', 
    otp: '', 
    newPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  const navigateByRole = (role?: string) => {
    if (role === 'SUPER_ADMIN') {
      router.push('/superadmin');
    } else if (role === 'ADMIN') {
      router.push('/admin');
    } else {
      router.push('/shop');
    }
  };

  const handleResendOtp = async () => {
    if (!formData.email) {
      alert("Please provide an email address first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        if (data.otp) {
          setFormData(prev => ({ ...prev, otp: data.otp }));
          alert(`New verification code: ${data.otp}\n(Code has been auto-filled for your convenience)`);
        } else {
          alert(data.message || "A new OTP has been sent to your email.");
        }
      } else {
        alert(data.error || "Failed to resend OTP.");
      }
    } catch (err) {
      alert("Network error: Could not reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match!");
          setLoading(false);
          return;
        }

        const fullName = `${formData.name} ${formData.surname}`.trim();
        const res = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password, 
            fullName, 
            phone: formData.phone 
          })
        });
        const data = await res.json();
        if (data.success) {
          if (data.otp) {
            setFormData(prev => ({ ...prev, otp: data.otp }));
            alert(`Account created! Verification code: ${data.otp}\n(Code auto-filled below for instant verification)`);
          } else {
            alert(data.message || "OTP sent to your email. Please verify to complete signup.");
          }
          setMode('verify-otp');
        } else {
          alert(data.error || 'Registration failed');
        }
      } else if (mode === 'verify-otp') {
        const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email.trim().toLowerCase(), 
            otp: formData.otp.trim() 
          })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          alert("Account verified & logged in successfully!");
          navigateByRole(data.user?.role);
        } else {
          alert(data.error || 'Invalid OTP');
        }
      } else if (mode === 'login') {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email.trim().toLowerCase(), 
            password: formData.password 
          })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          alert(data.message || 'Logged in successfully!');
          navigateByRole(data.user?.role);
        } else if (data.requiresVerification) {
          if (data.otp) {
            setFormData(prev => ({ ...prev, otp: data.otp }));
            alert(`Account requires verification. Your new OTP code is: ${data.otp}\n(Code auto-filled below)`);
          } else {
            alert(data.error || "Please verify your email with OTP before logging in.");
          }
          setMode('verify-otp');
        } else {
          alert(data.error || 'Login failed');
        }
      } else if (mode === 'forgot') {
        const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
        });
        const data = await res.json();
        if (data.success) {
          if (data.otp) {
            setFormData(prev => ({ ...prev, otp: data.otp }));
            alert(`Password reset code: ${data.otp}\n(Code auto-filled below)`);
          } else {
            alert(data.message || "Password reset OTP sent to your email.");
          }
          setMode('reset');
        } else {
          alert(data.error || 'Failed to send reset OTP');
        }
      } else if (mode === 'reset') {
        const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email.trim().toLowerCase(), 
            otp: formData.otp.trim(), 
            newPassword: formData.newPassword 
          })
        });
        const data = await res.json();
        if (data.success) {
          alert("Password successfully changed via OTP verification. Please login.");
          setMode('login');
        } else {
          alert(data.error || 'Password reset failed');
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    const email = prompt(`Enter your email for one-click ${provider} login/signup:`);
    const name = prompt(`Enter your Name:`) || 'Valued';
    const surname = prompt(`Enter your Surname:`) || 'Customer';
    if (!email) return;

    try {
      const res = await fetch(`${apiUrl}/api/auth/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), fullName: `${name} ${surname}`, provider })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(`Logged in successfully via ${provider}!`);
        navigateByRole(data.user?.role);
      } else {
        alert(data.error || 'Social login failed');
      }
    } catch (err) {
      alert("Social login connection error.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 pb-24 md:pb-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full space-y-6 border border-gray-100">
        
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 items-center justify-center text-gray-900 shadow-md mb-1">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {mode === 'login' && 'Sign In to Track Hub'}
            {mode === 'register' && 'Create Your Account'}
            {mode === 'verify-otp' && 'Email OTP Verification'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset' && 'Set New Password'}
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {mode === 'login' && 'Enter your credentials to access your sports orders'}
            {mode === 'register' && 'Join India’s premier sports merchandise platform'}
            {mode === 'verify-otp' && 'Enter the 6-digit verification code sent to your email'}
            {mode === 'forgot' && 'Enter your email address to receive reset instructions'}
            {mode === 'reset' && 'Enter your OTP code and new secure password'}
          </p>
        </div>

        {mode === 'verify-otp' && formData.email && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-0.5">
            <p className="text-[11px] text-slate-500 font-medium">Verifying account email</p>
            <p className="text-xs font-black text-slate-900 font-mono tracking-wide break-all">{formData.email}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Surname"
                    required
                    value={formData.surname}
                    onChange={e => setFormData({...formData, surname: e.target.value})}
                    className="w-full px-3 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'reset') && (
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="Email Address"
                required
                disabled={mode === 'reset'}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs disabled:bg-gray-100"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="Confirm Password"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {(mode === 'verify-otp' || mode === 'reset') && (
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter 6-digit Email OTP"
                required
                value={formData.otp}
                onChange={e => setFormData({...formData, otp: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 bg-white font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none shadow-xs text-center"
              />
            </div>
          )}

          {mode === 'reset' && (
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="password"
                placeholder="New Password"
                required
                value={formData.newPassword}
                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Sign In' :
              mode === 'register' ? 'Register & Send OTP' :
              mode === 'verify-otp' ? 'Verify OTP & Complete Signup' :
              mode === 'forgot' ? 'Send OTP Code' : 'Update Password'
            )} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'verify-otp' && (
          <div className="flex items-center justify-between pt-1 px-1 text-xs">
            <button
              type="button"
              disabled={loading}
              onClick={handleResendOtp}
              className="inline-flex items-center gap-1.5 text-blue-600 font-bold hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-center text-gray-400 uppercase font-extrabold tracking-wider">Or register instantly with one click</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleSocialLogin('Google')} className="py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-xs cursor-pointer">Google</button>
              <button onClick={() => handleSocialLogin('Apple')} className="py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-xs cursor-pointer">Apple</button>
              <button onClick={() => handleSocialLogin('Facebook')} className="py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition shadow-xs cursor-pointer">Facebook</button>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-gray-500 font-medium pt-2">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => setMode('register')} className="text-blue-600 font-bold hover:underline cursor-pointer">Register Now</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-blue-600 font-bold hover:underline cursor-pointer">Sign In</button></>
          )}
        </div>
      </div>
    </div>
  );
}
