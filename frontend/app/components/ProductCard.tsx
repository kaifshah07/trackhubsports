'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  salePrice?: number | null;
  stock?: number;
  imageUrl: string;
  secondaryImageUrl?: string | null;
  targetSection?: string;
  category?: { id?: string; name: string };
  categoryId?: string;
  subCategory?: { id?: string; name: string };
  subCategoryId?: string;
  sizes?: string[];
  colors?: string[];
  brand?: string;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (product: Product, delta: number) => void;
  onWishlistClick: (product: Product) => void;
  isWishlisted?: boolean;
}

export default function ProductCard({
  product,
  quantity,
  onAddToCart,
  onUpdateQuantity,
  onWishlistClick,
  isWishlisted = false
}: ProductCardProps) {
  const router = useRouter();
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<0 | 1>(0);

  const primaryImage = primaryError || !product.imageUrl 
    ? '/placeholder-product.svg' 
    : product.imageUrl;

  const hasSecondary = Boolean(product.secondaryImageUrl && !secondaryError);
  const secondaryImage = hasSecondary ? (product.secondaryImageUrl as string) : null;
  const hasMultipleImages = Boolean(hasSecondary && secondaryImage && !primaryError);

  const isOutOfStock = typeof product.stock === 'number' && product.stock <= 0;
  const isLowStock = typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5;
  const maxStockReached = typeof product.stock === 'number' && product.stock > 0 && quantity >= product.stock;

  const hasSale = typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
  const currentPrice = hasSale ? product.salePrice : product.price;

  // Toggle between primary and secondary image
  const handleToggleImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex(prev => (prev === 0 ? 1 : 0));
  };

  const handleSelectImageIndex = (e: React.MouseEvent, index: 0 | 1) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveImageIndex(index);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    router.push(`/product/${product.id}`);
  };

  const showSecondary = hasMultipleImages && activeImageIndex === 1;

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-2xl border border-black/10 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group relative cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative aspect-square bg-[#f8f9fa] overflow-hidden select-none block">
        {/* Sale Badge */}
        {hasSale && !isOutOfStock && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md z-10 shadow-sm tracking-wider pointer-events-none">
            Sale
          </div>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-slate-900/95 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md z-10 shadow-sm tracking-wider pointer-events-none">
            Out of Stock
          </div>
        )}

        {/* Low Stock Badge */}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md z-10 shadow-sm tracking-wider pointer-events-none">
            Only {product.stock} Left
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onWishlistClick(product);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full bg-white/90 hover:bg-white text-black shadow-xs transition-transform active:scale-90 min-w-[34px] min-h-[34px] flex items-center justify-center z-20 cursor-pointer"
        >
          <Heart 
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors ${
              isWishlisted ? 'text-red-600 fill-red-600' : 'text-black fill-transparent hover:text-red-500'
            }`} 
          />
        </button>

        {/* Slide Buttons for Next / Prev Image */}
        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveImageIndex(0);
              }}
              aria-label="Show primary image"
              className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-black shadow-md flex items-center justify-center z-20 transition active:scale-90 cursor-pointer border border-black/10 ${
                activeImageIndex === 0 ? 'opacity-40 pointer-events-none' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setActiveImageIndex(1);
              }}
              aria-label="Show next image"
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white text-black shadow-md flex items-center justify-center z-20 transition active:scale-90 cursor-pointer border border-black/10 ${
                activeImageIndex === 1 ? 'opacity-40 pointer-events-none' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots Indicator for image sliding */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1.5 z-20 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-full">
            <button
              type="button"
              onClick={(e) => handleSelectImageIndex(e, 0)}
              aria-label="Show first image"
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                activeImageIndex === 0 ? 'bg-white w-2.5' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
            <button
              type="button"
              onClick={(e) => handleSelectImageIndex(e, 1)}
              aria-label="Show next image"
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                activeImageIndex === 1 ? 'bg-white w-2.5' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          </div>
        )}

        {/* Primary Image Link */}
        <Link 
          href={`/product/${product.id}`}
          className="w-full h-full block relative"
        >
          <img
            src={primaryImage}
            alt={product.name}
            onError={() => setPrimaryError(true)}
            className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${
              showSecondary ? 'opacity-0' : 'opacity-100'
            } ${isOutOfStock ? 'grayscale-40 opacity-80' : ''}`}
            loading="lazy"
          />

          {/* Secondary Image */}
          {hasMultipleImages && secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              onError={() => setSecondaryError(true)}
              className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-300 ${
                showSecondary ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${isOutOfStock ? 'grayscale-40 opacity-80' : ''}`}
              loading="lazy"
            />
          )}
        </Link>
      </div>

      {/* Product Details Area */}
      <div className="p-3 sm:p-4 flex flex-col flex-grow space-y-1 sm:space-y-1.5">
        <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">
          {product.category?.name || product.targetSection || 'Activewear'}
        </span>

        <Link 
          href={`/product/${product.id}`}
          className="font-bold text-black text-xs sm:text-xs line-clamp-2 min-h-[2rem] leading-tight hover:text-neutral-600 transition block cursor-pointer"
        >
          {product.name}
        </Link>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 pt-0.5 sm:pt-1">
          <span className="text-xs sm:text-sm font-black text-black">
            ₹{currentPrice}
          </span>
          {hasSale && (
            <span className="text-[10px] sm:text-xs text-neutral-400 line-through font-semibold">
              ₹{product.price}
            </span>
          )}
        </div>

        {/* Add to Cart Area */}
        <div className="mt-auto pt-2 sm:pt-2.5">
          {isOutOfStock ? (
            <button
              type="button"
              disabled
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="w-full bg-neutral-200 text-neutral-500 font-bold py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider cursor-not-allowed min-h-[38px] flex items-center justify-center select-none"
            >
              Out of Stock
            </button>
          ) : quantity === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-full bg-black hover:bg-neutral-800 active:scale-[0.98] text-white font-black py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-all duration-200 shadow-xs min-h-[38px] flex items-center justify-center cursor-pointer"
            >
              Add to Cart
            </button>
          ) : (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="flex items-center justify-between bg-black rounded-xl p-1 text-white font-black min-h-[38px] shadow-xs"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onUpdateQuantity(product, -1);
                }}
                aria-label="Decrease quantity"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-lg flex items-center justify-center text-xs transition select-none cursor-pointer"
              >
                -
              </button>
              <span className="text-xs px-2 font-black select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (maxStockReached) {
                    alert(`Maximum available stock (${product.stock}) reached for this item.`);
                    return;
                  }
                  onUpdateQuantity(product, 1);
                }}
                disabled={maxStockReached}
                aria-label="Increase quantity"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs transition select-none ${
                  maxStockReached 
                    ? 'bg-neutral-800/40 text-neutral-500 cursor-not-allowed' 
                    : 'bg-neutral-800 hover:bg-neutral-700 active:scale-95 cursor-pointer'
                }`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
