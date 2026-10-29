'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Store, ShoppingBag, Settings, UserCheck, Trash2, Edit3, X, Save, Eye, EyeOff, LayoutDashboard, LogOut, Lock, PackageOpen, PlusCircle, UploadCloud, Layers3, CheckCircle2, AlertCircle,
  Truck, ExternalLink, Calendar, Search, ChevronDown, ChevronUp, Clock, Package
} from 'lucide-react';


interface AdminOrderCardProps {
  ord: any;
  apiUrl: string;
  token: string;
  onUpdated: () => void;
}

function AdminOrderCard({ ord, apiUrl, token, onUpdated }: AdminOrderCardProps) {
  const shipping = (typeof ord.shippingAddress === 'object' && ord.shippingAddress !== null) ? ord.shippingAddress : {};
  const [status, setStatus] = useState(ord.status || 'CONFIRMED');
  const [courierName, setCourierName] = useState(shipping.courierName || '');
  const [awbCode, setAwbCode] = useState(shipping.awbCode || '');
  const [trackingUrl, setTrackingUrl] = useState(shipping.trackingUrl || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(shipping.estimatedDelivery || '');
  const [updating, setUpdating] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const handleSave = async (newStatus?: string) => {
    setUpdating(true);
    const targetStatus = newStatus || status;
    try {
      const res = await fetch(`${apiUrl}/api/admin/orders/${ord.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          courierName,
          awbCode,
          trackingUrl,
          estimatedDelivery
        })
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus) setStatus(newStatus);
        alert(`Order #${ord.id.slice(-8).toUpperCase()} updated successfully!`);
        onUpdated();
      } else {
        alert(data.error || 'Failed to update order');
      }
    } catch (err: any) {
      alert('Error updating order: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = 
    status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
    status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
    status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
    status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
    'bg-red-100 text-red-800';

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-gray-50/70 text-xs space-y-4 shadow-2xs hover:shadow-xs transition">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-200 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">
              #THS-{ord.id ? ord.id.slice(-8).toUpperCase() : 'ORD'}
            </span>
            <span className={`px-2 py-0.5 rounded uppercase text-[10px] font-black ${statusColor}`}>
              {status}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            Order ID: <span className="font-mono text-gray-700">{ord.id}</span>
          </p>
        </div>

        <div className="text-right">
          <p className="font-black text-slate-900 text-sm">₹{Number(ord.totalAmount).toFixed(2)}</p>
          <span className="text-[11px] text-gray-400 font-medium">
            {ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-IN') : 'Recent'}
          </span>
        </div>
      </div>

      {/* Customer & Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Customer</span>
          <p className="font-bold text-slate-900">{ord.user?.fullName || 'Guest Customer'}</p>
          <p className="text-gray-600 font-medium">{ord.user?.email || 'N/A'}</p>
          <p className="text-[11px] text-gray-500 mt-1">Payment: <b>{ord.paymentMode || 'Online'}</b></p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-0.5">Delivery Address</span>
          {typeof ord.shippingAddress === 'object' && ord.shippingAddress !== null ? (
            <p className="text-gray-700 leading-relaxed text-[11px]">
              {ord.shippingAddress.address || 'Street address'}<br />
              {ord.shippingAddress.city ? `${ord.shippingAddress.city}, ` : ''}{ord.shippingAddress.postalCode || ''}
              {ord.shippingAddress.phone ? ` | Phone: ${ord.shippingAddress.phone}` : ''}
            </p>
          ) : (
            <p className="text-gray-700 text-[11px]">{String(ord.shippingAddress || 'Address on file')}</p>
          )}
        </div>
      </div>

      {/* Ordered Products Dropdown */}
      {Array.isArray(ord.orderItems) && ord.orderItems.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowItems(!showItems)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>{ord.orderItems.length} Ordered Item{ord.orderItems.length > 1 ? 's' : ''}</span>
            {showItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showItems && (
            <div className="mt-2 divide-y divide-gray-200 border border-gray-200 rounded-xl bg-white p-2.5 space-y-1.5">
              {ord.orderItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-1.5 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{item.product?.name || 'Athletic Wear'}</span>
                    <span className="text-gray-500 font-semibold ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logistics & Tracking Controls */}
      <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 space-y-3">
        <span className="text-[10px] uppercase font-black tracking-wider text-amber-900 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" /> Order Fulfillment & Live Tracking Update
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">Courier Partner</label>
            <input
              type="text"
              placeholder="e.g. BlueDart / Delhivery"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">AWB / Tracking Code</label>
            <input
              type="text"
              placeholder="e.g. AWB12345678"
              value={awbCode}
              onChange={(e) => setAwbCode(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-slate-900 font-mono focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">Estimated Delivery</label>
            <input
              type="text"
              placeholder="e.g. 3-4 Days / Nov 2"
              value={estimatedDelivery}
              onChange={(e) => setEstimatedDelivery(e.target.value)}
              className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
          <input
            type="text"
            placeholder="Courier Tracking URL (optional: https://...)"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            className="w-full sm:flex-1 p-2 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-amber-400 outline-none"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {status !== 'SHIPPED' && status !== 'DELIVERED' && status !== 'CANCELLED' && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleSave('SHIPPED')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Dispatch (Shipped)
              </button>
            )}

            {status === 'SHIPPED' && (
              <button
                type="button"
                disabled={updating}
                onClick={() => handleSave('DELIVERED')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
              >
                Mark Delivered
              </button>
            )}

            <button
              type="button"
              disabled={updating}
              onClick={() => handleSave()}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-black transition disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
            >
              {updating ? 'Saving...' : 'Save Logistics'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'inquiries' | 'orders' | 'catalog'>('overview');
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'categories' | 'subcategories' | 'coupons' | 'banners'>('products');
  const [loading, setLoading] = useState(true);

  // Orders Filter & Search States
  const [adminOrderSearchQuery, setAdminOrderSearchQuery] = useState('');
  const [adminOrderFilterStatus, setAdminOrderFilterStatus] = useState('ALL');

  // Users Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');

  // Account Generation Form State
  const [targetEmail, setTargetEmail] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [targetFullName, setTargetFullName] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [targetRole, setTargetRole] = useState('ADMIN');
  const [creating, setCreating] = useState(false);

  // Catalog States
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('Track Hub Sports');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodSecondaryImageUrl, setProdSecondaryImageUrl] = useState('');
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [uploadErrorPrimary, setUploadErrorPrimary] = useState('');
  const [uploadErrorSecondary, setUploadErrorSecondary] = useState('');
  const [isPublishingProduct, setIsPublishingProduct] = useState(false);
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodSubCategoryId, setProdSubCategoryId] = useState('');

  // Product Full Edit Modal State
  const [editingProductModal, setEditingProductModal] = useState<any>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDescription, setEditProdDescription] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdSalePrice, setEditProdSalePrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdSecondaryImageUrl, setEditProdSecondaryImageUrl] = useState('');
  const [editUploadingPrimary, setEditUploadingPrimary] = useState(false);
  const [editUploadingSecondary, setEditUploadingSecondary] = useState(false);
  const [editUploadErrorPrimary, setEditUploadErrorPrimary] = useState('');
  const [editUploadErrorSecondary, setEditUploadErrorSecondary] = useState('');
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [editProdCategoryId, setEditProdCategoryId] = useState('');
  const [editProdSubCategoryId, setEditProdSubCategoryId] = useState('');

  // Category & Subcategory Form & Edit Modals
  const [catName, setCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editCatName, setEditCatName] = useState('');

  const [subCatName, setSubCatName] = useState('');
  const [subCatCategoryId, setSubCatCategoryId] = useState('');
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);
  const [editSubCatName, setEditSubCatName] = useState('');
  const [editSubCatCategoryId, setEditSubCatCategoryId] = useState('');

  // Coupon & Banner Form & Edit States
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('');
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [editCouponCode, setEditCouponCode] = useState('');
  const [editCouponDiscount, setEditCouponDiscount] = useState('');

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerLink, setBannerLink] = useState('/shop');
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [editBannerTitle, setEditBannerTitle] = useState('');
  const [editBannerImage, setEditBannerImage] = useState('');
  const [editBannerLink, setEditBannerLink] = useState('/shop');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadErrorBanner, setUploadErrorBanner] = useState('');
  const [editUploadingBanner, setEditUploadingBanner] = useState(false);
  const [editUploadErrorBanner, setEditUploadErrorBanner] = useState('');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

    if (savedToken && savedUser && (savedUser.role === 'ADMIN' || savedUser.role === 'SUPER_ADMIN')) {
      setToken(savedToken);
      setUser(savedUser);
      fetchAdminDashboardData(savedToken);
      fetchAllUsers(savedToken);
      fetchCatalogData();
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success) {
        if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
          setLoginError("Access Denied: Exclusive to Administrators.");
          return;
        }
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        fetchAdminDashboardData(data.token);
        fetchAllUsers(data.token);
        fetchCatalogData();
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication server.');
    }
  };

  const fetchAdminDashboardData = async (authToken: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/dashboard-data`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) setDashboardData(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchAllUsers = async (authToken: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) setAllUsers(data.users);
    } catch (err) { console.error(err); }
  };

  const fetchCatalogData = async () => {
    try {
      const catRes = await fetch(`${apiUrl}/api/categories`);
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.categories);

      const subRes = await fetch(`${apiUrl}/api/subcategories`);
      const subData = await subRes.json();
      if (subData.success) setSubCategories(subData.subCategories);

      const prodRes = await fetch(`${apiUrl}/api/products`);
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.products);

      const promoRes = await fetch(`${apiUrl}/api/promotions`);
      const promoData = await promoRes.json();
      if (promoData.success) {
        setCoupons(promoData.coupons || []);
        setBanners(promoData.banners || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: targetEmail, password: targetPassword, fullName: targetFullName, phone: targetPhone, targetRole })
      });
      const data = await res.json();
      if (data.success) {
        alert(`${targetRole} account successfully created!`);
        setTargetEmail(''); setTargetPassword(''); setTargetFullName(''); setTargetPhone('');
        fetchAllUsers(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Server error.'); } finally { setCreating(false); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ fullName: editFullName, role: editRole, newPassword: editNewPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('User updated successfully!');
        setEditingUser(null); setEditNewPassword('');
        fetchAllUsers(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error updating user.'); }
  };

  const handleUpdateInquiryStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Inquiry updated to ${status}!`);
        fetchAdminDashboardData(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error updating inquiry status.'); }
  };

  const handleUploadImageFile = async (
    file: File, 
    onSuccess: (url: string) => void, 
    setUploading: (val: boolean) => void, 
    setError: (err: string) => void
  ) => {
    setError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Unsupported format. Please select a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('Image size exceeds the 25 MB limit.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${apiUrl}/api/admin/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        onSuccess(data.imageUrl);
      } else {
        setError(data.error || 'Upload failed. Please verify storage configuration.');
      }
    } catch (err: any) {
      setError('Network error while uploading image. Please check connection.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodImageUrl) {
      alert('Please upload or provide a primary product image.');
      return;
    }
    setIsPublishingProduct(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: prodName, 
          brand: prodBrand, 
          description: prodDescription, 
          price: prodPrice, 
          salePrice: prodSalePrice, 
          stock: prodStock, 
          imageUrl: prodImageUrl, 
          secondaryImageUrl: prodSecondaryImageUrl || null,
          categoryId: prodCategoryId, 
          subCategoryId: prodSubCategoryId || null 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product published live successfully!');
        setProdName(''); 
        setProdPrice(''); 
        setProdSalePrice(''); 
        setProdStock(''); 
        setProdImageUrl(''); 
        setProdSecondaryImageUrl('');
        setProdDescription('');
        setUploadErrorPrimary('');
        setUploadErrorSecondary('');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error publishing product.'); }
    finally {
      setIsPublishingProduct(false);
    }
  };

  const handleUpdateProductFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductModal) return;
    if (!editProdImageUrl) {
      alert('Primary product image is required.');
      return;
    }
    setIsUpdatingProduct(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${editingProductModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: editProdName, 
          description: editProdDescription,
          price: editProdPrice, 
          salePrice: editProdSalePrice, 
          stock: editProdStock, 
          imageUrl: editProdImageUrl, 
          secondaryImageUrl: editProdSecondaryImageUrl || null,
          categoryId: editProdCategoryId, 
          subCategoryId: editProdSubCategoryId || null 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product updated successfully!');
        setEditingProductModal(null);
        fetchCatalogData();
      } else { alert(data.error || 'Failed to update product.'); }
    } catch (err) { alert('Error updating product.'); }
    finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Product deleted.');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting product.'); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: catName })
      });
      const data = await res.json();
      if (data.success) {
        alert('Category added!');
        setCatName('');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error adding category.'); }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editCatName })
      });
      const data = await res.json();
      if (data.success) {
        alert('Category updated!');
        setEditingCategory(null);
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error updating category.'); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Category deleted.');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting category.'); }
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatCategoryId) { alert('Select parent category.'); return; }
    try {
      const res = await fetch(`${apiUrl}/api/admin/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: subCatName, categoryId: subCatCategoryId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subcategory added!');
        setSubCatName(''); setSubCatCategoryId('');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error adding subcategory.'); }
  };

  const handleUpdateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/subcategories/${editingSubCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: editSubCatName, categoryId: editSubCatCategoryId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subcategory updated!');
        setEditingSubCategory(null);
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error updating subcategory.'); }
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm('Delete subcategory?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/subcategories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Subcategory deleted.');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting subcategory.'); }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/admin/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, discountPct: couponDiscount })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Coupon ${couponCode.toUpperCase()} generated!`);
        setCouponCode(''); setCouponDiscount('');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error creating coupon.'); }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: editCouponCode, discountPct: editCouponDiscount })
      });
      const data = await res.json();
      if (data.success) {
        alert('Coupon updated successfully!');
        setEditingCoupon(null);
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error updating coupon.'); }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Coupon deleted.');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting coupon.'); }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage) {
      alert('Please upload a banner image.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/admin/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: bannerTitle, imageUrl: bannerImage, linkUrl: bannerLink || '/shop' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Banner published!');
        setBannerTitle(''); setBannerImage(''); setBannerLink('/shop');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error publishing banner.'); }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    if (!editBannerImage) {
      alert('Please upload a banner image.');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/api/admin/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: editBannerTitle, imageUrl: editBannerImage, linkUrl: editBannerLink || '/shop' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Banner updated successfully!');
        setEditingBanner(null);
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error updating banner.'); }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Banner deleted.');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting banner.'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading Admin Portal...</div>;

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 items-center justify-center shadow-lg mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black">Admin Portal</h1>
            <p className="text-xs text-gray-400">Exclusive login for Administrator credentials.</p>
          </div>

          {loginError && <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded-xl font-medium">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Admin Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="admin@trackhubsports.com" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium" />
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition text-xs uppercase tracking-wider">
              Sign In as Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalOrdersCount = dashboardData?.orders?.length || 0;
  const pendingInquiriesCount = dashboardData?.franchiseInquiries?.filter((i: any) => i.status === 'PENDING').length || 0;
  const totalProductsCount = products.length;
  const totalUsersCount = allUsers.length;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* Admin Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950 text-white p-6 flex flex-col justify-between shrink-0 border-r border-white/10">
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950">
              ADMIN CONTROL
            </span>
            <h2 className="text-lg font-black text-white mt-2">Operations Hub</h2>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" /> Overview
            </button>
            <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'accounts' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Users className="w-4 h-4" /> Admin & User Accounts
            </button>
            <button onClick={() => setActiveTab('inquiries')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'inquiries' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Store className="w-4 h-4" /> Vendor & Franchise Requests
            </button>
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'orders' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <ShoppingBag className="w-4 h-4" /> Orders & Deliveries
            </button>
            <button onClick={() => setActiveTab('catalog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'catalog' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <PackageOpen className="w-4 h-4" /> Catalog & Offers
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-2xl text-xs font-bold transition border border-red-500/20">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900">Operational Dashboard</h1>
                <p className="text-xs text-gray-500">Monitor store orders, inventory, and pending partnership requests.</p>
              </div>
              <button onClick={() => { fetchAdminDashboardData(token!); fetchAllUsers(token!); fetchCatalogData(); }} className="px-4 py-2 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition">
                Refresh Metrics
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Orders</span>
                <h3 className="text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Users</span>
                <h3 className="text-2xl font-black text-slate-900">{totalUsersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Pending Inquiries</span>
                <h3 className="text-2xl font-black text-slate-900">{pendingInquiriesCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Active Products</span>
                <h3 className="text-2xl font-black text-slate-900">{totalProductsCount}</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Recent Orders Summary</h2>
              <div className="space-y-3">
                {!dashboardData?.orders || dashboardData.orders.length === 0 ? (
                  <p className="text-xs text-gray-500">No orders recorded yet.</p>
                ) : (
                  dashboardData.orders.slice(0, 5).map((ord: any) => (
                    <div key={ord.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">Order #{ord.id.slice(-6).toUpperCase()} - <span className="text-gray-600">{ord.user?.fullName || 'Customer'}</span></p>
                        <p className="text-[11px] text-gray-500">{new Date(ord.createdAt).toLocaleString()} | Mode: {ord.paymentMode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">₹{ord.totalAmount}</p>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">{ord.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" /> Create Official Accounts
                </h2>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Target Role</label>
                    <select value={targetRole} onChange={e => setTargetRole(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 text-xs font-semibold bg-white text-gray-900">
                      <option value="ADMIN">Operational Admin</option>
                      <option value="VENDOR">Vendor / Brand Partner</option>
                      <option value="FRANCHISE">Franchise Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Full Name / Brand Name</label>
                    <input type="text" required value={targetFullName} onChange={e => setTargetFullName(e.target.value)} placeholder="e.g. Apex Sports" className="w-full p-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Email Address</label>
                    <input type="email" required value={targetEmail} onChange={e => setTargetEmail(e.target.value)} placeholder="partner@example.com" className="w-full p-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Temporary Password</label>
                    <input type="text" required value={targetPassword} onChange={e => setTargetPassword(e.target.value)} placeholder="TempPass@123" className="w-full p-3 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white" />
                  </div>
                  <button type="submit" disabled={creating} className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition text-xs uppercase tracking-wider disabled:opacity-50">
                    {creating ? 'Creating Account...' : `Create ${targetRole} Account`}
                  </button>
                </form>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-500" /> Privilege Overview
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Administrators have full access to create, modify, and update passwords for staff, vendor, and franchise accounts.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Existing System Users</h2>
                <button onClick={() => fetchAllUsers(token!)} className="text-xs font-bold text-blue-600 hover:underline">Refresh List</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{u.fullName || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-gray-600">{u.email}</td>
                        <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800">{u.role}</span></td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => { setEditingUser(u); setEditFullName(u.fullName || ''); setEditRole(u.role); setEditNewPassword(''); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Franchise & Vendor Partnership Requests</h2>
            <div className="space-y-4">
              {!dashboardData?.franchiseInquiries || dashboardData.franchiseInquiries.length === 0 ? (
                <p className="text-xs text-gray-500">No applications recorded yet.</p>
              ) : (
                dashboardData.franchiseInquiries.map((iq: any) => (
                  <div key={iq.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{iq.fullName} ({iq.city}) - <span className="text-amber-600">{iq.status}</span></p>
                      <p className="text-gray-600">Email: {iq.email} | Phone: {iq.phone}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Investment Capacity: {iq.investment} | Message: {iq.message || 'N/A'}</p>
                    </div>
                    <select value={iq.status} onChange={e => handleUpdateInquiryStatus(iq.id, e.target.value)} className="p-2 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 shadow-xs">
                      <option value="PENDING">Pending</option>
                      <option value="LOOKING_APPROVAL">Looking Approval</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="DENIED">Denied</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-amber-500" /> Customer Orders & Logistics Management
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Update customer order statuses, assign courier partners, and attach AWB tracking codes.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAdminOrderFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      adminOrderFilterStatus === st
                        ? 'bg-slate-900 text-amber-400 shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Order ID, Customer Name, Email, or AWB tracking code..."
                value={adminOrderSearchQuery}
                onChange={(e) => setAdminOrderSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition"
              />
              {adminOrderSearchQuery && (
                <button
                  onClick={() => setAdminOrderSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Orders Listing */}
            {!dashboardData?.orders || dashboardData.orders.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 text-xs">
                No customer orders placed yet.
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.orders
                  .filter((ord: any) => {
                    if (adminOrderFilterStatus !== 'ALL' && ord.status !== adminOrderFilterStatus) return false;
                    if (adminOrderSearchQuery.trim()) {
                      const q = adminOrderSearchQuery.toLowerCase();
                      const idMatch = (ord.id || '').toLowerCase().includes(q);
                      const nameMatch = (ord.user?.fullName || '').toLowerCase().includes(q);
                      const emailMatch = (ord.user?.email || '').toLowerCase().includes(q);
                      const awbMatch = (ord.shippingAddress?.awbCode || '').toLowerCase().includes(q);
                      if (!idMatch && !nameMatch && !emailMatch && !awbMatch) return false;
                    }
                    return true;
                  })
                  .map((ord: any) => (
                    <AdminOrderCard
                      key={ord.id}
                      ord={ord}
                      apiUrl={apiUrl}
                      token={token!}
                      onUpdated={() => fetchAdminDashboardData(token!)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CATALOG & OFFERS (Includes Banner & Slider Manager) */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex-wrap">
              <button onClick={() => setCatalogSubTab('products')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${catalogSubTab === 'products' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                📦 Products & Stock ({products.length})
              </button>
              <button onClick={() => setCatalogSubTab('categories')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${catalogSubTab === 'categories' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                📂 Categories ({categories.length})
              </button>
              <button onClick={() => setCatalogSubTab('subcategories')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${catalogSubTab === 'subcategories' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                📑 Subcategories ({subCategories.length})
              </button>
              <button onClick={() => setCatalogSubTab('coupons')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${catalogSubTab === 'coupons' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                🏷️ Coupons ({coupons.length})
              </button>
              <button onClick={() => setCatalogSubTab('banners')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${catalogSubTab === 'banners' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                🖼️ Banners ({banners.length})
              </button>
            </div>

            {/* 1. PRODUCTS & STOCK */}
            {catalogSubTab === 'products' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-amber-500" /> Publish Product (Image URL, Subcategory & Inventory)
                  </h2>
                  <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Name *</label>
                      <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Pro Dry-Fit T-Shirt" className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Regular MRP (₹) *</label>
                      <input type="number" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="1499" className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Selling Offer Price (₹)</label>
                      <input type="number" value={prodSalePrice} onChange={e => setProdSalePrice(e.target.value)} placeholder="899" className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Initial Stock Quantity *</label>
                      <input type="number" required value={prodStock} onChange={e => setProdStock(e.target.value)} placeholder="50" className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Category *</label>
                      <select value={prodCategoryId} onChange={e => setProdCategoryId(e.target.value)} required className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900">
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Subcategory</label>
                      <select value={prodSubCategoryId} onChange={e => setProdSubCategoryId(e.target.value)} className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900">
                        <option value="">Select Subcategory</option>
                        {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Description</label>
                      <textarea rows={2} value={prodDescription} onChange={e => setProdDescription(e.target.value)} placeholder="Enter product specifications, dry-fit fabric details, etc." className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    {/* Primary Product Image */}
                    <div className="p-4 border rounded-2xl bg-gray-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-gray-700">Primary Image *</label>
                        {prodImageUrl && <span className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full">Ready</span>}
                      </div>
                      <div className="flex items-start gap-3">
                        {prodImageUrl ? (
                          <div className="relative w-16 h-16 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                            <img src={prodImageUrl} alt="Primary preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImageFile(file, setProdImageUrl, setUploadingPrimary, setUploadErrorPrimary);
                            }}
                            disabled={uploadingPrimary}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                          />
                          <input 
                            type="url" 
                            required 
                            value={prodImageUrl} 
                            onChange={e => setProdImageUrl(e.target.value)} 
                            placeholder="Or paste primary image URL *" 
                            className="w-full p-2 border rounded-xl text-[11px] bg-white text-gray-900" 
                          />
                        </div>
                      </div>
                      {uploadingPrimary && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading primary image...</p>}
                      {uploadErrorPrimary && <p className="text-[10px] text-red-600 font-semibold">{uploadErrorPrimary}</p>}
                    </div>

                    {/* Secondary Product Image */}
                    <div className="p-4 border rounded-2xl bg-gray-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-gray-700">Secondary Image (Optional)</label>
                        {prodSecondaryImageUrl && (
                          <button type="button" onClick={() => setProdSecondaryImageUrl('')} className="text-[10px] text-red-600 font-bold hover:underline">Clear</button>
                        )}
                      </div>
                      <div className="flex items-start gap-3">
                        {prodSecondaryImageUrl ? (
                          <div className="relative w-16 h-16 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                            <img src={prodSecondaryImageUrl} alt="Secondary preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1.5">
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImageFile(file, setProdSecondaryImageUrl, setUploadingSecondary, setUploadErrorSecondary);
                            }}
                            disabled={uploadingSecondary}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                          />
                          <input 
                            type="url" 
                            value={prodSecondaryImageUrl} 
                            onChange={e => setProdSecondaryImageUrl(e.target.value)} 
                            placeholder="Or paste secondary image URL (optional)" 
                            className="w-full p-2 border rounded-xl text-[11px] bg-white text-gray-900" 
                          />
                        </div>
                      </div>
                      {uploadingSecondary && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading secondary image...</p>}
                      {uploadErrorSecondary && <p className="text-[10px] text-red-600 font-semibold">{uploadErrorSecondary}</p>}
                    </div>

                    <button 
                      type="submit" 
                      disabled={isPublishingProduct || uploadingPrimary || uploadingSecondary}
                      className="md:col-span-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition"
                    >
                      {isPublishingProduct ? 'Publishing Product...' : (uploadingPrimary || uploadingSecondary) ? 'Uploading Image...' : 'Publish Product Live'}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Live Inventory & Stock Manager</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b text-gray-400 font-bold"><th className="py-3 px-4">Image</th><th>Name</th><th>Category</th><th>Stock Level</th><th className="text-right">Action</th></tr></thead>
                      <tbody className="divide-y">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <img src={p.imageUrl || '/placeholder-product.svg'} alt={p.name} className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-gray-50" />
                                {p.secondaryImageUrl && (
                                  <img src={p.secondaryImageUrl} alt="2nd view" title="Secondary view" className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-gray-50" />
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-gray-900">{p.name}</td>
                            <td className="py-3 px-4 text-gray-600">{p.category?.name || 'General'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${p.stock < 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-800'}`}>
                                {p.stock} Units {p.stock < 10 ? '⚠️ Low Stock' : ''}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button onClick={() => { 
                                setEditingProductModal(p); 
                                setEditProdName(p.name); 
                                setEditProdDescription(p.description || '');
                                setEditProdPrice(p.price); 
                                setEditProdSalePrice(p.salePrice || ''); 
                                setEditProdStock(p.stock); 
                                setEditProdImageUrl(p.imageUrl);
                                setEditProdSecondaryImageUrl(p.secondaryImageUrl || '');
                                setEditUploadErrorPrimary('');
                                setEditUploadErrorSecondary('');
                                setEditProdCategoryId(p.categoryId || '');
                                setEditProdSubCategoryId(p.subCategoryId || '');
                              }} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">Edit Details</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CATEGORIES */}
            {catalogSubTab === 'categories' && (
              <div className="space-y-8">
                <form onSubmit={handleCreateCategory} className="bg-white p-8 rounded-3xl border space-y-4 max-w-xl">
                  <h2 className="text-sm font-black uppercase text-slate-900">Add Main Category</h2>
                  <input type="text" required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category Name" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
                  <button type="submit" className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase">Add Category</button>
                </form>

                <div className="bg-white p-8 rounded-3xl border space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-900">Existing Categories Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b text-gray-400 font-bold"><th className="py-3 px-4">Category Name</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
                      <tbody className="divide-y">
                        {categories.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-bold text-gray-900">{c.name}</td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button onClick={() => { setEditingCategory(c); setEditCatName(c.name); }} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">Edit</button>
                              <button onClick={() => handleDeleteCategory(c.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SUBCATEGORIES */}
            {catalogSubTab === 'subcategories' && (
              <div className="space-y-8">
                <form onSubmit={handleCreateSubCategory} className="bg-white p-8 rounded-3xl border space-y-4 max-w-xl">
                  <h2 className="text-sm font-black uppercase text-slate-900">Add Subcategory</h2>
                  <select value={subCatCategoryId} onChange={e => setSubCatCategoryId(e.target.value)} required className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-bold">
                    <option value="">Select Parent Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="text" required value={subCatName} onChange={e => setSubCatName(e.target.value)} placeholder="Subcategory Name" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
                  <button type="submit" className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase">Add Subcategory</button>
                </form>

                <div className="bg-white p-8 rounded-3xl border space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-900">Existing Subcategories Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b text-gray-400 font-bold"><th className="py-3 px-4">Subcategory Name</th><th>Parent Category</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
                      <tbody className="divide-y">
                        {subCategories.map(sc => (
                          <tr key={sc.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-bold text-gray-900">{sc.name}</td>
                            <td className="py-3 px-4 text-gray-600">{sc.category?.name || 'Unassigned'}</td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button onClick={() => { setEditingSubCategory(sc); setEditSubCatName(sc.name); setEditSubCatCategoryId(sc.categoryId); }} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">Edit</button>
                              <button onClick={() => handleDeleteSubCategory(sc.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. COUPONS */}
            {catalogSubTab === 'coupons' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border space-y-6 max-w-xl">
                  <h2 className="text-sm font-black uppercase text-slate-900">Create Discount Coupon</h2>
                  <form onSubmit={handleCreateCoupon} className="space-y-4">
                    <input type="text" required value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="SPORTS20" className="w-full p-3 border rounded-xl text-xs uppercase bg-white text-gray-900 font-bold" />
                    <input type="number" required value={couponDiscount} onChange={e => setCouponDiscount(e.target.value)} placeholder="Discount %" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
                    <button type="submit" className="w-full bg-slate-900 text-amber-400 py-3.5 rounded-xl font-bold text-xs uppercase">Generate Coupon</button>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl border space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-900">Active Coupons Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b text-gray-400 font-bold"><th className="py-3 px-4">Coupon Code</th><th>Discount %</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
                      <tbody className="divide-y">
                        {coupons.map(cp => (
                          <tr key={cp.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-black text-slate-900 tracking-wider">{cp.code}</td>
                            <td className="py-3 px-4 font-bold text-amber-600">{cp.discountPct}% OFF</td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button onClick={() => { setEditingCoupon(cp); setEditCouponCode(cp.code); setEditCouponDiscount(cp.discountPct); }} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">Edit</button>
                              <button onClick={() => handleDeleteCoupon(cp.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. BANNERS & SLIDERS MANAGER */}
            {catalogSubTab === 'banners' && (
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border space-y-6 max-w-xl">
                  <h2 className="text-sm font-black uppercase text-slate-900">Publish Homepage Banner / Slider</h2>
                  <form onSubmit={handleCreateBanner} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Title *</label>
                      <input type="text" required value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} placeholder="Summer Championship Drop" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Redirect Link (e.g. /shop or /shop?section=Sale)</label>
                      <input type="text" value={bannerLink} onChange={e => setBannerLink(e.target.value)} placeholder="/shop or /shop?section=Sale" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-mono" />
                    </div>
                    <div className="p-4 border rounded-2xl bg-gray-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-gray-700">Banner Image *</label>
                        {bannerImage && (
                          <button type="button" onClick={() => setBannerImage('')} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {bannerImage ? (
                          <div className="relative w-28 h-16 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                            <img src={bannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-28 h-16 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                        )}
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImageFile(file, setBannerImage, setUploadingBanner, setUploadErrorBanner);
                            }}
                            disabled={uploadingBanner}
                            className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                          />
                        </div>
                      </div>
                      {uploadingBanner && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading banner image...</p>}
                      {uploadErrorBanner && <p className="text-[10px] text-red-600 font-semibold">{uploadErrorBanner}</p>}
                    </div>
                    <button type="submit" disabled={uploadingBanner} className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider disabled:opacity-50 transition">
                      {uploadingBanner ? 'Uploading Banner...' : 'Publish Banner Live'}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl border space-y-6">
                  <h2 className="text-sm font-black uppercase text-slate-900">Active Banner Sliders Management</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead><tr className="border-b text-gray-400 font-bold"><th className="py-3 px-4">Preview</th><th>Banner Title</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
                      <tbody className="divide-y">
                        {banners.map(bn => (
                          <tr key={bn.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4"><img src={bn.imageUrl} alt="" className="w-16 h-10 object-cover rounded-lg border shadow-xs" /></td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900">{bn.title}</div>
                              <div className="text-[10px] text-blue-600 font-mono mt-0.5">{bn.linkUrl || '/shop'}</div>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button onClick={() => { setEditingBanner(bn); setEditBannerTitle(bn.title); setEditBannerImage(bn.imageUrl); setEditBannerLink(bn.linkUrl || '/shop'); }} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">Edit</button>
                              <button onClick={() => handleDeleteBanner(bn.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-lg font-bold">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FULL PRODUCT DETAILS EDIT MODAL */}
      {editingProductModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleUpdateProductFull} className="bg-white w-full max-w-lg p-8 rounded-3xl space-y-4 shadow-2xl my-8">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit Product Details & Stock</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Name *</label>
              <input type="text" required value={editProdName} onChange={e => setEditProdName(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Description</label>
              <textarea rows={3} value={editProdDescription} onChange={e => setEditProdDescription(e.target.value)} placeholder="Enter detailed product description..." className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Regular MRP (₹) *</label>
                <input type="number" required value={editProdPrice} onChange={e => setEditProdPrice(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Offer Price (₹)</label>
                <input type="number" value={editProdSalePrice} onChange={e => setEditProdSalePrice(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Stock Quantity *</label>
                <input type="number" required value={editProdStock} onChange={e => setEditProdStock(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Category *</label>
                <select value={editProdCategoryId} onChange={e => setEditProdCategoryId(e.target.value)} required className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-bold">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Subcategory</label>
              <select value={editProdSubCategoryId} onChange={e => setEditProdSubCategoryId(e.target.value)} className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900">
                <option value="">Select Subcategory</option>
                {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
            </div>
            {/* Edit Primary Image */}
            <div className="p-3.5 border rounded-2xl bg-gray-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-gray-700">Primary Product Image *</label>
                {editProdImageUrl && <span className="text-[10px] text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <div className="flex items-start gap-3">
                {editProdImageUrl ? (
                  <div className="relative w-14 h-14 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                    <img src={editProdImageUrl} alt="Edit primary" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImageFile(file, setEditProdImageUrl, setEditUploadingPrimary, setEditUploadErrorPrimary);
                    }}
                    disabled={editUploadingPrimary}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  <input 
                    type="url" 
                    required 
                    value={editProdImageUrl} 
                    onChange={e => setEditProdImageUrl(e.target.value)} 
                    placeholder="Primary Image URL *" 
                    className="w-full p-2 border rounded-xl text-xs bg-white text-gray-900" 
                  />
                </div>
              </div>
              {editUploadingPrimary && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading primary image...</p>}
              {editUploadErrorPrimary && <p className="text-[10px] text-red-600 font-semibold">{editUploadErrorPrimary}</p>}
            </div>

            {/* Edit Secondary Image */}
            <div className="p-3.5 border rounded-2xl bg-gray-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-gray-700">Secondary Image (Optional)</label>
                {editProdSecondaryImageUrl && (
                  <button type="button" onClick={() => setEditProdSecondaryImageUrl('')} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
                )}
              </div>
              <div className="flex items-start gap-3">
                {editProdSecondaryImageUrl ? (
                  <div className="relative w-14 h-14 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                    <img src={editProdSecondaryImageUrl} alt="Edit secondary" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImageFile(file, setEditProdSecondaryImageUrl, setEditUploadingSecondary, setEditUploadErrorSecondary);
                    }}
                    disabled={editUploadingSecondary}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                  <input 
                    type="url" 
                    value={editProdSecondaryImageUrl} 
                    onChange={e => setEditProdSecondaryImageUrl(e.target.value)} 
                    placeholder="Secondary Image URL (optional)" 
                    className="w-full p-2 border rounded-xl text-xs bg-white text-gray-900" 
                  />
                </div>
              </div>
              {editUploadingSecondary && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading secondary image...</p>}
              {editUploadErrorSecondary && <p className="text-[10px] text-red-600 font-semibold">{editUploadErrorSecondary}</p>}
            </div>

            <div className="flex gap-2 pt-3">
              <button 
                type="button" 
                onClick={() => setEditingProductModal(null)} 
                disabled={isUpdatingProduct || editUploadingPrimary || editUploadingSecondary}
                className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdatingProduct || editUploadingPrimary || editUploadingSecondary}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-slate-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-50 transition"
              >
                {isUpdatingProduct ? 'Saving Changes...' : (editUploadingPrimary || editUploadingSecondary) ? 'Uploading Image...' : 'Save All Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateCategory} className="bg-white w-full max-w-sm p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit Main Category</h3>
            <input type="text" required value={editCatName} onChange={e => setEditCatName(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-bold" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingCategory(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* SUBCATEGORY EDIT MODAL */}
      {editingSubCategory && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateSubCategory} className="bg-white w-full max-w-md p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit Subcategory</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Parent Category</label>
              <select value={editSubCatCategoryId} onChange={e => setEditSubCatCategoryId(e.target.value)} required className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-bold">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Subcategory Name</label>
              <input type="text" required value={editSubCatName} onChange={e => setEditSubCatName(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-bold" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingSubCategory(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* COUPON EDIT MODAL */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateCoupon} className="bg-white w-full max-w-sm p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit Discount Coupon</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Coupon Code</label>
              <input type="text" required value={editCouponCode} onChange={e => setEditCouponCode(e.target.value)} className="w-full p-3 border rounded-xl text-xs uppercase text-gray-900 bg-white font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Discount %</label>
              <input type="number" required value={editCouponDiscount} onChange={e => setEditCouponDiscount(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingCoupon(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* BANNER EDIT MODAL */}
      {editingBanner && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateBanner} className="bg-white w-full max-w-md p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit Homepage Banner</h3>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Title</label>
              <input type="text" required value={editBannerTitle} onChange={e => setEditBannerTitle(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Banner Redirect Link</label>
              <input type="text" value={editBannerLink} onChange={e => setEditBannerLink(e.target.value)} placeholder="/shop or /shop?section=Sale" className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white font-mono" />
            </div>
            <div className="p-4 border rounded-2xl bg-gray-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-gray-700">Banner Image *</label>
                {editBannerImage && (
                  <button type="button" onClick={() => setEditBannerImage('')} className="text-[10px] text-red-600 font-bold hover:underline">Remove</button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {editBannerImage ? (
                  <div className="relative w-28 h-16 rounded-xl border bg-white overflow-hidden shrink-0 shadow-xs">
                    <img src={editBannerImage} alt="Banner preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-28 h-16 rounded-xl border border-dashed border-gray-300 bg-white flex items-center justify-center shrink-0 text-gray-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadImageFile(file, setEditBannerImage, setEditUploadingBanner, setEditUploadErrorBanner);
                    }}
                    disabled={editUploadingBanner}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                  />
                </div>
              </div>
              {editUploadingBanner && <p className="text-[10px] text-amber-600 font-bold animate-pulse">Uploading banner image...</p>}
              {editUploadErrorBanner && <p className="text-[10px] text-red-600 font-semibold">{editUploadErrorBanner}</p>}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingBanner(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" disabled={editUploadingBanner} className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs disabled:opacity-50">
                {editUploadingBanner ? 'Uploading...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateUser} className="bg-white w-full max-w-md p-8 rounded-3xl space-y-4 shadow-2xl">
            <h3 className="text-sm font-black uppercase text-slate-900">Edit User Account</h3>
            <input type="text" required value={editFullName} onChange={e => setEditFullName(e.target.value)} placeholder="Full Name" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
            <select value={editRole} onChange={e => setEditRole(e.target.value)} className="w-full p-3 border rounded-xl text-xs bg-white font-bold text-gray-900">
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN</option>
              <option value="VENDOR">VENDOR</option>
              <option value="FRANCHISE">FRANCHISE</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
            <input type="text" value={editNewPassword} onChange={e => setEditNewPassword(e.target.value)} placeholder="New Password (optional)" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}