'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from './components/ProductCard';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const categoryCards = [
  {
    name: 'T-Shirt',
    image: '/categories/t-shirt.png',
    href: '/shop?category=T-Shirt'
  },
  {
    name: 'Cap',
    image: '/categories/cap.png',
    href: '/shop?category=Cap'
  },
  {
    name: 'Polo',
    image: '/categories/polo.png',
    href: '/shop?category=Polo'
  },
  {
    name: 'Shorts',
    image: '/categories/shorts.png',
    href: '/shop?category=Shorts'
  },
  {
    name: 'Cut Sleeves',
    image: '/categories/cut-sleeves.png',
    href: '/shop?category=Cut Sleeves'
  },
  {
    name: 'Track Pant',
    image: '/categories/track-pant.png',
    href: '/shop?category=Track Pant'
  },
  {
    name: 'Jacket',
    image: '/categories/jacket.png',
    href: '/shop?category=Jacket'
  },
  {
    name: 'Other Sportswear',
    image: '/categories/other-sportswear.png',
    href: '/shop?category=Other Sportswear'
  }
];

export default function Home() {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartMap, setCartMap] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://track-hub-backend.onrender.com';

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  const loadWishlistFromStorage = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      setWishlistIds(new Set(saved.map((item: any) => item.id)));
    } catch {
      setWishlistIds(new Set());
    }
  };

  useEffect(() => {
    fetchHomeData();
    loadCartFromStorage();
    loadWishlistFromStorage();

    const handleStorageChange = () => {
      loadCartFromStorage();
      loadWishlistFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const bannerInterval = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(bannerInterval);
  }, [banners.length]);

  const loadCartFromStorage = () => {
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const map: { [key: string]: number } = {};
    savedCart.forEach((item: any) => { map[item.id] = item.quantity || 1; });
    setCartMap(map);
  };

  const fetchHomeData = async () => {
    try {
      const promoRes = await fetch(`${apiUrl}/api/promotions`);
      const promoData = await promoRes.json();
      if (promoData.success) setBanners(promoData.banners || []);

      const catRes = await fetch(`${apiUrl}/api/categories`);
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.categories || []);

      const prodRes = await fetch(`${apiUrl}/api/products`);
      const prodData = await prodRes.json();
      if (prodData.success && prodData.products) setProducts(prodData.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistClick = (product: any) => {
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) { router.push('/auth'); return; }
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

  const handleAddToCart = (product: any) => {
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
      setCartMap(prev => ({ ...prev, [product.id]: currentQty + 1 }));
    } else {
      cart.push({ ...product, quantity: 1 });
      setCartMap(prev => ({ ...prev, [product.id]: 1 }));
    }
    localStorage.setItem('cartItems', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  const handleUpdateQuantity = (product: any, delta: number) => {
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
        const updatedMap = { ...cartMap };
        delete updatedMap[product.id];
        setCartMap(updatedMap);
      } else {
        cart[index].quantity = newQty;
        setCartMap(prev => ({ ...prev, [product.id]: newQty }));
      }
      localStorage.setItem('cartItems', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || 
                            p.categoryId === selectedCategory ||
                            (p.category && p.category.name.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-20">
      
      {/* Professional Banner Slider */}
      {banners.length > 0 ? (
        <section className="relative bg-neutral-950 text-white overflow-hidden shadow-sm h-80 sm:h-[420px]">
          {banners.map((banner, idx) => (
            <Link
              key={banner.id || idx}
              href={banner.linkUrl || '/shop'}
              className={`absolute inset-0 transition-opacity duration-1000 block cursor-pointer group ${
                idx === currentBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent flex flex-col justify-end p-8 sm:p-14">
                <span className="bg-white text-black text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest w-fit mb-3">Featured Drop</span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white group-hover:text-amber-400 transition">{banner.title}</h2>
              </div>
            </Link>
          ))}
          {banners.length > 1 && (
            <>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentBannerIdx(prev => (prev === 0 ? banners.length - 1 : prev - 1));
                }} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black text-white transition cursor-pointer"
                aria-label="Previous banner"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentBannerIdx(prev => (prev + 1) % banners.length);
                }} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black text-white transition cursor-pointer"
                aria-label="Next banner"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="relative bg-neutral-950 text-white py-24 px-8 text-center space-y-3 border-b border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Engineered Performance</span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">PROFESSIONAL ACTIVEWEAR</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto font-medium">Engineered with precision dry-fit fabrics for unmatched athletic performance and comfort.</p>
        </section>
      )}

      {/* Restored 8 Category Cards Section */}
      <section id="category" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="text-center mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Category</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
          {categoryCards.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl transition hover:bg-slate-50/80 active:scale-95"
            >
              <div className="w-full aspect-[4/5] sm:aspect-square flex items-center justify-center p-1 sm:p-2 mb-2 sm:mb-3">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] sm:text-sm font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1 sm:line-clamp-none">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Product Feed with Categories Filter and Promo Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5 sm:pb-6">
          <div className="border-l-2 border-black pl-3">
            <h3 className="text-[10px] sm:text-[11px] font-black uppercase text-gray-400 tracking-widest">Store Catalog</h3>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">FEATURED SPORTS PRODUCTS</h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-black/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-xl bg-neutral-50 border border-black/10 text-xs text-black focus:outline-none focus:border-black font-medium" 
            />
          </div>
        </div>

        {/* Category Filter Pills on Homepage */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'ALL' ? 'bg-black text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            All ({products.length})
          </button>
          {categoryCards.map(c => {
            const count = products.filter(p => p.category?.name?.toLowerCase() === c.name.toLowerCase()).length;
            const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setSelectedCategory(c.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isSelected ? 'bg-black text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-black/10 p-3 sm:p-4 space-y-3 animate-pulse">
                <div className="aspect-square bg-neutral-200 rounded-xl" />
                <div className="h-3 bg-neutral-200 rounded w-1/3" />
                <div className="h-4 bg-neutral-200 rounded w-4/5" />
                <div className="h-4 bg-neutral-200 rounded w-1/4" />
                <div className="h-9 bg-neutral-200 rounded-xl mt-3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-neutral-50 rounded-2xl p-12 text-center border border-black/10 space-y-3">
            <h4 className="font-black text-sm text-black uppercase tracking-wider">No Products Found</h4>
            <p className="text-xs text-gray-500">
              {selectedCategory !== 'ALL'
                ? `There are currently no products under "${selectedCategory}".`
                : 'Try searching for something else or view all products in the shop.'}
            </p>
            {selectedCategory !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="inline-block mt-2 bg-black text-white text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
              >
                Show All Products
              </button>
            )}
            <Link href="/shop" className="inline-block mt-2 bg-black text-white text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-wider ml-2">
              Browse Full Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product, index) => {
              const qty = cartMap[product.id] || 0;
              const isTenthItem = (index + 1) % 10 === 0;

              return (
                <React.Fragment key={product.id}>
                  <ProductCard
                    product={product}
                    quantity={qty}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onWishlistClick={handleWishlistClick}
                    isWishlisted={wishlistIds.has(product.id)}
                  />

                  {/* Advertisement / Promo Banner Injected After Every 10 Products */}
                  {isTenthItem && (
                    <div className="col-span-full bg-black text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 my-2 sm:my-4 text-center md:text-left">
                      <div className="space-y-1.5 sm:space-y-2">
                        <span className="bg-white text-black text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest inline-block">Sponsored Advertisement</span>
                        <h3 className="text-lg sm:text-2xl font-black">CUSTOM TEAM OUTFITTING & BULK ORDERS</h3>
                        <p className="text-xs text-gray-400">Get customized jerseys with your team logo and names delivered within 5 days.</p>
                      </div>
                      <Link href="/shop" className="w-full sm:w-auto bg-white text-black font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition shrink-0 text-center">
                        Inquire Now
                      </Link>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
