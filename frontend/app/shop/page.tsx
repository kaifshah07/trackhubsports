'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, ArrowUpDown, X, RefreshCw, AlertCircle } from 'lucide-react';
import ProductCard, { Product } from '../components/ProductCard';

const standardCategories = [
  'T-Shirt',
  'Round Neck T-Shirt',
  'Polo',
  'Shorts',
  'Cut Sleeves',
  'Track Pant',
  'Jacket',
  'Other Sportswear'
];

const subNavTabs = [
  'ALL',
  'T-SHIRT',
  'ROUND NECK T-SHIRT',
  'POLO',
  'SHORTS',
  'CUT SLEEVES',
  'TRACK PANT',
  'JACKET',
  'OTHER SPORTSWEAR'
];

function ShopContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');
  const [cartMap, setCartMap] = useState<{ [key: string]: number }>({});
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  useEffect(() => {
    fetchShopData();
    loadCartFromStorage();
    loadWishlistFromStorage();

    const handleStorageChange = () => {
      loadCartFromStorage();
      loadWishlistFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Synchronize URL parameters on mount and whenever searchParams change
  useEffect(() => {
    const catParam = searchParams.get('category') || searchParams.get('categoryId');
    if (catParam) {
      setSelectedCategory(catParam);
    } else {
      setSelectedCategory('ALL');
    }

    const qParam = searchParams.get('search') || searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const loadCartFromStorage = () => {
    try {
      const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const map: { [key: string]: number } = {};
      savedCart.forEach((item: any) => { map[item.id] = item.quantity || 1; });
      setCartMap(map);
    } catch {
      setCartMap({});
    }
  };

  const loadWishlistFromStorage = () => {
    try {
      const wishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      const idSet = new Set<string>(wishlist.map((item: any) => item.id));
      setWishlistIds(idSet);
    } catch {
      setWishlistIds(new Set());
    }
  };

  const fetchShopData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${apiUrl}/api/categories`).catch(() => null),
        fetch(`${apiUrl}/api/products`).catch(() => null)
      ]);

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.categories || []);
      }

      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.products)) {
          setProducts(prodData.products);
          setFilteredProducts(prodData.products);
        } else {
          setError(prodData.error || 'Failed to load products catalog.');
        }
      } else {
        setError('Could not connect to the product service. Please verify your connection.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while loading the catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Category selection handler with URL synchronization
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const params = new URLSearchParams(searchParams.toString());
    if (catName === 'ALL') {
      params.delete('category');
      params.delete('categoryId');
    } else {
      params.set('category', catName);
      params.delete('categoryId');
    }
    const newQuery = params.toString();
    router.push(newQuery ? `/shop?${newQuery}` : '/shop', { scroll: false });
  };

  // Real filtering logic
  useEffect(() => {
    let result = [...products];

    // 1. Target section filter
    const section = searchParams.get('section');
    if (section) {
      const secLower = section.toLowerCase();
      result = result.filter(p => 
        (p.targetSection && p.targetSection.toLowerCase() === secLower) || 
        (p.category?.name && p.category.name.toLowerCase() === secLower)
      );
    }

    // 2. Category filter (by Name or ID)
    if (selectedCategory !== 'ALL') {
      const sel = selectedCategory.toLowerCase();
      result = result.filter(p => 
        p.categoryId === selectedCategory || 
        (p.category && (
          p.category.id === selectedCategory ||
          p.category.name.toLowerCase() === sel
        ))
      );
    }

    // 3. Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.category?.name && p.category.name.toLowerCase().includes(q))
      );
    }

    // 4. Price Sorting
    if (sortBy === 'low-high') {
      result.sort((a, b) => (Number(a.salePrice || a.price)) - (Number(b.salePrice || b.price)));
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => (Number(b.salePrice || b.price)) - (Number(a.salePrice || a.price)));
    }

    setFilteredProducts(result);
  }, [searchQuery, selectedCategory, sortBy, products, searchParams]);

  const handleWishlistClick = (product: Product) => {
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      router.push('/auth');
      return;
    }
    let wishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
    const exists = wishlist.some((i: any) => i.id === product.id);
    if (exists) {
      wishlist = wishlist.filter((i: any) => i.id !== product.id);
    } else {
      wishlist.push(product);
    }
    localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
    loadWishlistFromStorage();
    window.dispatchEvent(new Event('storage'));
  };

  const handleAddToCart = (product: Product) => {
    if (typeof product.stock === 'number' && product.stock <= 0) {
      alert('This item is currently out of stock.');
      return;
    }
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existingIndex = cart.findIndex((item: any) => item.id === product.id);
    if (existingIndex !== -1) {
      const currentQty = cart[existingIndex].quantity || 1;
      if (typeof product.stock === 'number' && product.stock > 0 && currentQty + 1 > product.stock) {
        alert(`Maximum available stock (${product.stock}) reached for this item.`);
        return;
      }
      cart[existingIndex].quantity = currentQty + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cartItems', JSON.stringify(cart));
    setCartMap(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateQuantity = (product: Product, delta: number) => {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const index = cart.findIndex((item: any) => item.id === product.id);
    if (index !== -1) {
      const currentQty = cart[index].quantity || 1;
      const newQty = currentQty + delta;
      if (delta > 0 && typeof product.stock === 'number' && product.stock > 0 && newQty > product.stock) {
        alert(`Maximum available stock (${product.stock}) reached for this item.`);
        return;
      }
      if (newQty <= 0) {
        cart.splice(index, 1);
        setCartMap(prev => {
          const updated = { ...prev };
          delete updated[product.id];
          return updated;
        });
      } else {
        cart[index].quantity = newQty;
        setCartMap(prev => ({ ...prev, [product.id]: newQty }));
      }
      localStorage.setItem('cartItems', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSortBy('featured');
    router.push('/shop');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedCategory !== 'ALL' || 
    sortBy !== 'featured' || 
    Boolean(searchParams.get('section'));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* 8 Category Tabs Bar */}
      <div className="bg-black text-white border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-start sm:justify-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar text-xs font-black tracking-widest uppercase">
          {subNavTabs.map(tab => {
            const isSelected = 
              tab === 'ALL' 
                ? selectedCategory === 'ALL' 
                : selectedCategory.toUpperCase() === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectCategory(tab === 'ALL' ? 'ALL' : tab)}
                className={`pb-1 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isSelected ? 'border-amber-400 text-amber-400 font-extrabold' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Search, Filter Bar & Active Filter Chips */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200">
            <div className="flex items-center gap-3 flex-grow sm:max-w-xl">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-100 text-slate-900 hover:bg-neutral-200 transition shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-black" />
                <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
              </button>

              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, tag, or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-black text-xs bg-slate-50 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-black p-0.5 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <span className="text-gray-500 font-bold text-[11px] sm:text-xs">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
              </span>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="low-high">Price: Low to High</option>
                  <option value="high-low">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Active:</span>

              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-xs capitalize">
                  Category: {selectedCategory}
                  <button
                    type="button"
                    onClick={() => handleSelectCategory('ALL')}
                    aria-label="Remove category filter"
                    className="hover:text-amber-400 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                  Keyword: "{searchQuery}"
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Remove search filter"
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchParams.get('section') && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                  Section: {searchParams.get('section')}
                  <button
                    type="button"
                    onClick={() => router.push('/shop')}
                    aria-label="Remove section filter"
                    className="hover:text-red-600 cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-800 ml-1 underline cursor-pointer"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Main Grid & Filters Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
          {/* Collapsible Sidebar Filters */}
          {showFilters && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 space-y-6 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-black uppercase text-slate-900">
                <span>Categories</span>
                <button 
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="p-1 text-gray-400 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-bold">
                <button 
                  type="button"
                  onClick={() => handleSelectCategory('ALL')} 
                  className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                    selectedCategory === 'ALL' ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] opacity-70">({products.length})</span>
                </button>

                {standardCategories.map(catName => {
                  const count = products.filter(p => p.category?.name?.toLowerCase() === catName.toLowerCase()).length;
                  const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();
                  return (
                    <button 
                      key={catName} 
                      type="button"
                      onClick={() => handleSelectCategory(catName)} 
                      className={`w-full text-left px-3 py-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                        isSelected ? 'bg-black text-white font-extrabold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{catName}</span>
                      <span className="text-[10px] opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="w-full text-center py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-red-100"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}

          {/* Product Feed Grid */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl flex items-center justify-between gap-4 shadow-xs mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={fetchShopData}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {/* Loading State Skeleton */}
            {loading ? (
              <div className={`grid grid-cols-2 sm:grid-cols-2 ${showFilters ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3 sm:gap-6`}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3 animate-pulse">
                    <div className="aspect-square bg-slate-200 rounded-xl" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-9 bg-slate-200 rounded-xl mt-3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Verified Empty State (No products in selected category) */
              <div className="bg-white p-12 sm:p-16 text-center rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                    {selectedCategory !== 'ALL' 
                      ? `No Products Found in "${selectedCategory}"` 
                      : 'No Products Found'}
                  </h3>
                  <p className="text-gray-500 font-medium text-xs max-w-sm mx-auto">
                    {selectedCategory !== 'ALL'
                      ? `There are currently no activewear products listed under the "${selectedCategory}" category.`
                      : 'No activewear products matched your search terms or filter criteria.'}
                  </p>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-block bg-black hover:bg-neutral-800 text-white text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider transition cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              /* Product Grid with ProductCard */
              <div className={`grid grid-cols-2 sm:grid-cols-2 ${showFilters ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-3 sm:gap-6`}>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={cartMap[product.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onWishlistClick={handleWishlistClick}
                    isWishlisted={wishlistIds.has(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center font-bold text-xs text-slate-500 bg-slate-50">
        Loading Track Hub Catalog...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
