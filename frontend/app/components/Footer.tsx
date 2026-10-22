'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-300 font-sans border-t border-white/10 pt-12 pb-28 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <img 
              src="/footer-logo.png" 
              alt="Track Hub Logo" 
              className="h-7 sm:h-8 w-auto object-contain" 
            />
            <span className="text-base sm:text-lg font-black tracking-wider text-white" style={{ fontFamily: "'Ethnocentric', sans-serif" }}>
              TRACK HUB
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Engineered with advanced dry-fit moisture management fabric for cricket, football, running, and professional athletic training.
          </p>
          <div className="flex items-center gap-3 pt-2">
            {/* Instagram SVG */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-amber-400 hover:text-gray-950 text-white rounded-xl transition">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            {/* Facebook SVG */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-amber-400 hover:text-gray-950 text-white rounded-xl transition">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.59 0 9 1.581 9 4.75V8z"/></svg>
            </a>
            {/* YouTube SVG */}
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-amber-400 hover:text-gray-950 text-white rounded-xl transition">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            </a>
            {/* WhatsApp SVG */}
            <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-amber-400 hover:text-gray-950 text-white rounded-xl transition">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-2">Quick Navigation</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/shop" className="hover:text-amber-400 transition">Explore All Jerseys</Link></li>
            <li><Link href="/vendor-apply" className="hover:text-amber-400 transition">Become Our Vendor</Link></li>
            <li><Link href="/franchise-apply" className="hover:text-amber-400 transition">Take Our Franchise</Link></li>
            <li><Link href="/auth" className="hover:text-amber-400 transition">Sign In / Register</Link></li>
            <li><Link href="/cart" className="hover:text-amber-400 transition">Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Partnerships & Legal */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-2">Portals & Policy</h4>
          <ul className="space-y-2 text-xs">
            <li><Link href="/admin" className="hover:text-amber-400 transition">Admin / Portal Login</Link></li>
            <li><Link href="/vendor" className="hover:text-amber-400 transition">Vendor Dashboard</Link></li>
            <li><Link href="/franchise" className="hover:text-amber-400 transition">Franchise Portal</Link></li>
            <li><span className="text-gray-500 cursor-not-allowed">Privacy Policy</span></li>
            <li><span className="text-gray-500 cursor-not-allowed">Terms of Service</span></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-bold uppercase tracking-wider border-b border-white/10 pb-2">Headquarters</h4>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Khinvasara August Highstreet, Ulkanagri, Chhatrapati Sambhajinagar, Maharashtra</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>trackhubsports@gmail.com</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+91 95518 58310</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4 text-center">
        <p>© 2026 Track Hub Sports. All rights reserved.</p>
        <p className="flex items-center gap-1">Powered by <span className="text-amber-400 font-bold">SW Digital Hub</span></p>
      </div>
    </footer>
  );
}