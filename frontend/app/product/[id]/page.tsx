'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Heart, 
  Check, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Zap, 
  Layers, 
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product } from '../../components/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    checkWishlist();
  }, [id]);

  const checkWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      setIsWishlisted(saved.some((item: any) => item.id === id));
    } catch {
      setIsWishlisted(false);
    }
  };

  const applyProductData = (item: Product) => {
    setProduct(item);
    setSelectedImage(item.imageUrl || '/placeholder-product.svg');
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0]);
    }
    if (Array.isArray(item.colors) && item.colors.length > 0) {
      setSelectedColor(item.colors[0]);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/products/${id}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && data.product) {
          applyProductData(data.product);
          return;
        }
      }

      // Resilient Fallback: If single product endpoint is not yet live on deployed Render, check catalog list
      const listRes = await fetch(`${apiUrl}/api/products`).catch(() => null);
      if (listRes && listRes.ok) {
        const listData = await listRes.json();
        if (listData.success && Array.isArray(listData.products)) {
          const match = listData.products.find((p: any) => p.id === id);
          if (match) {
            applyProductData(match);
            return;
          }
        }
      }

      setError('Product not found in store catalog.');
    } catch (err: any) {
      console.error(err);
      setError('Unable to load product details. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('customerToken');
    if (!token) {
      router.push('/auth');
      return;
    }
    if (!product) return;

    try {
      let wishlist = JSON.parse(localStorage.getItem('wishlistItems') || '[]');
      if (isWishlisted) {
        wishlist = wishlist.filter((item: any) => item.id !== product.id);
        setIsWishlisted(false);
      } else {
        wishlist.push(product);
        setIsWishlisted(true);
      }
      localStorage.setItem('wishlistItems', JSON.stringify(wishlist));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = (redirectAfter = false) => {
    if (!product) return;
    if (typeof product.stock === 'number' && product.stock <= 0) {
      alert('This item is currently out of stock.');
      return;
    }

    try {
      let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      const existingIndex = cart.findIndex((item: any) => item.id === product.id);

      const cartItem = {
        ...product,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
        imageUrl: selectedImage || product.imageUrl
      };

      if (existingIndex !== -1) {
        const currentQty = cart[existingIndex].quantity || 1;
        const newQty = currentQty + quantity;
        if (typeof product.stock === 'number' && product.stock > 0 && newQty > product.stock) {
          alert(`You already have ${currentQty} in cart. Total cannot exceed available stock (${product.stock}).`);
          return;
        }
        cart[existingIndex].quantity = newQty;
      } else {
        cart.push({ ...cartItem, quantity });
      }

      localStorage.setItem('cartItems', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));

      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);

      if (redirectAfter) {
        router.push('/cart');
      }
    } catch (err) {
      console.error(err);
      alert('Could not update cart. Please try again.');
    }
  };

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="aspect-square bg-slate-200 rounded-3xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded w-28" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-24 bg-slate-200 rounded-2xl mt-4" />
              <div className="h-12 bg-slate-200 rounded-xl mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / Not Found State
  if (error || !product) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center space-y-5">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Product Not Found</h2>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {error || "The sportswear product you requested could not be located in our catalog."}
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/shop"
              className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition"
            >
              Browse Full Catalog
            </Link>
            <button
              type="button"
              onClick={fetchProduct}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
  const isLowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;
  const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 99;

  const hasSale = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
  const currentPrice = hasSale ? product.salePrice : product.price;
  const discountPct = hasSale ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;

  const galleryImages = [
    product.imageUrl,
    product.secondaryImageUrl
  ].filter(Boolean) as string[];

  const currentImageIdx = Math.max(0, galleryImages.indexOf(selectedImage));
  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    const prevIdx = currentImageIdx <= 0 ? galleryImages.length - 1 : currentImageIdx - 1;
    setSelectedImage(galleryImages[prevIdx]);
  };
  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    const nextIdx = (currentImageIdx + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-2 text-xs font-semibold text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-black transition">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Link href="/shop" className="hover:text-black transition">Catalog</Link>
          {product.category?.name && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <Link href={`/shop?categoryId=${product.categoryId || product.category.id}`} className="hover:text-black transition">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-slate-950 font-bold truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {/* Back Link */}
        <Link 
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-black mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square sm:aspect-[4/5] bg-neutral-100 rounded-3xl border border-neutral-200 overflow-hidden shadow-xs flex items-center justify-center p-4">
              {/* Badges */}
              {hasSale && !isOutOfStock && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-lg shadow-sm z-10 tracking-wider">
                  {discountPct}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-black uppercase px-3 py-1 rounded-lg shadow-sm z-10 tracking-wider">
                  Out of Stock
                </span>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/95 hover:bg-white text-black shadow-md transition active:scale-90 z-10"
              >
                <Heart 
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? 'text-red-600 fill-red-600' : 'text-slate-700 hover:text-red-500'
                  }`} 
                />
              </button>

              <img 
                src={selectedImage}
                alt={product.name}
                onError={() => setSelectedImage('/placeholder-product.svg')}
                className={`w-full h-full object-contain transition-all duration-300 ${
                  isOutOfStock ? 'grayscale opacity-60' : ''
                }`}
              />

              {/* Previous / Next Controls on Image (Desktop & Mobile) */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Show previous product image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center z-10 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Show next product image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-md flex items-center justify-center z-10 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        aria-label={`Show product image ${idx + 1}`}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          selectedImage === img ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip (when multiple images exist) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => {
                  const isActive = selectedImage === imgUrl;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`relative w-20 h-20 rounded-2xl border-2 bg-neutral-100 overflow-hidden shrink-0 transition cursor-pointer p-1 ${
                        isActive ? 'border-slate-950 ring-2 ring-slate-950/20' : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`View ${idx + 1}`} 
                        className="w-full h-full object-contain" 
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">
                        {idx === 0 ? 'Front' : 'Back'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Product Information & Purchase Controls */}
          <div className="space-y-6">
            {/* Header info */}
            <div className="space-y-2 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">
                  {product.brand || product.category?.name || 'Activewear'}
                </span>
                {product.subCategory?.name && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {product.subCategory.name}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-black text-slate-950">
                  ₹{currentPrice}
                </span>
                {hasSale && (
                  <span className="text-base text-gray-400 line-through font-semibold">
                    ₹{product.price}
                  </span>
                )}
                {hasSale && (
                  <span className="text-xs font-black text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full uppercase">
                    Save ₹{product.price - product.salePrice!}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium">Inclusive of all local taxes</p>
            </div>

            {/* Stock / Availability Status */}
            <div>
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Currently Out of Stock
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Only {product.stock} items left in stock — order soon!
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 text-green-800 border border-green-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  In Stock & Ready to Ship
                </div>
              )}
            </div>

            {/* Available Sizes (if present) */}
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Select Size</span>
                  {selectedSize && <span className="text-blue-600">Selected: {selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[44px] h-11 px-3.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                        selectedSize === s 
                          ? 'bg-slate-950 text-white border-slate-950 shadow-sm' 
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Available Colors (if present) */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>Color Option</span>
                  {selectedColor && <span className="text-blue-600 font-semibold">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c: string) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                        selectedColor === c 
                          ? 'bg-slate-950 text-white border-slate-950 shadow-sm' 
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Purchase Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-900">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center font-bold text-base hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition select-none"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xs font-black select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(prev => Math.min(maxStock, prev + 1))}
                    disabled={quantity >= maxStock || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center font-bold text-base hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md select-none ${
                    isOutOfStock
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : addedAnimation
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-950 hover:bg-slate-800 text-white active:scale-[0.99]'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Cart!
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </>
                  )}
                </button>

                {!isOutOfStock && (
                  <button
                    type="button"
                    onClick={() => handleAddToCart(true)}
                    className="py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-amber-400 hover:bg-amber-500 text-slate-950 transition shadow-md select-none"
                  >
                    Buy Now
                  </button>
                )}
              </div>
            </div>

            {/* Description & Overview */}
            <div className="border-t border-slate-200 pt-6 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Product Description
              </h3>
              <div className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-line">
                {product.description || "Premium athletic sportswear engineered for high-performance durability, sweat-wicking breathability, and superior athletic comfort."}
              </div>
            </div>

            {/* Sportswear Assurance Badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 text-center">
              <div className="p-3 rounded-2xl bg-white border border-slate-100 space-y-1">
                <Zap className="w-5 h-5 text-amber-500 mx-auto" />
                <p className="text-[10px] font-black uppercase text-slate-900">Quick Dry</p>
                <p className="text-[9px] text-gray-400">Micro-fiber weave</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 space-y-1">
                <Truck className="w-5 h-5 text-blue-600 mx-auto" />
                <p className="text-[10px] font-black uppercase text-slate-900">Express Ship</p>
                <p className="text-[9px] text-gray-400">Pan-India delivery</p>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 space-y-1">
                <ShieldCheck className="w-5 h-5 text-green-600 mx-auto" />
                <p className="text-[10px] font-black uppercase text-slate-900">100% Verified</p>
                <p className="text-[9px] text-gray-400">Authentic gear</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
