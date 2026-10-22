'use client';

import React, { useState } from 'react';
import { Building2, Send, ShieldCheck } from 'lucide-react';

export default function FranchiseApplyPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [investment, setInvestment] = useState('₹5 Lakh - ₹10 Lakh');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/franchise/public-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, city, investment, message })
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to submit inquiry.');
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 text-gray-900 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-200 space-y-6">
        
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 items-center justify-center mb-1 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join Our Franchise Network</h1>
          <p className="text-xs text-gray-500 font-medium">
            Fill out the partnership form below. Your request will be sent directly to our expansion committee at trackhubsports@gmail.com.
          </p>
        </div>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl text-center space-y-3">
            <h3 className="font-black text-base">Inquiry Submitted Successfully!</h3>
            <p className="text-xs">Thank you for your interest. Once your application is reviewed and approved by our administration, login credentials will be issued to your email.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email Address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Phone Number"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Target City / Location"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={investment}
              onChange={e => setInvestment(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="₹5 Lakh - ₹10 Lakh">Investment Range: ₹5 Lakh - ₹10 Lakh</option>
              <option value="₹10 Lakh - ₹25 Lakh">Investment Range: ₹10 Lakh - ₹25 Lakh</option>
              <option value="₹25 Lakh+">Investment Range: ₹25 Lakh+</option>
            </select>

            <textarea
              placeholder="Tell us about your business experience or goals..."
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 bg-white font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Submitting Request...' : 'Submit Franchise Request'} <Send className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}