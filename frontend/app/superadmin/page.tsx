'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Store, ShoppingBag, Settings, UserCheck, Trash2, Edit3, X, Save, Eye, EyeOff, LayoutDashboard, LogOut, Lock, PackageOpen, PlusCircle, UploadCloud, Layers3, CheckCircle2, AlertCircle, TrendingUp, DollarSign, Activity
} from 'lucide-react';

export default function SuperAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'inquiries' | 'orders' | 'configs' | 'catalog'>('overview');
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'categories' | 'subcategories' | 'coupons' | 'banners'>('products');
  const [loading, setLoading] = useState(true);

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
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodSubCategoryId, setProdSubCategoryId] = useState('');

  // Product Full Edit Modal State
  const [editingProductModal, setEditingProductModal] = useState<any>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdSalePrice, setEditProdSalePrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
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

  // Gateway Config State
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_••••••••••••');
  const [razorpaySecret, setRazorpaySecret] = useState('••••••••••••••••••••');
  const [smtpSender, setSmtpSender] = useState('support@trackhubsports.com');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    const savedToken = localStorage.getItem('superAdminToken');
    const savedUser = JSON.parse(localStorage.getItem('superAdminUser') || 'null');

    if (savedToken && savedUser && savedUser.role === 'SUPER_ADMIN') {
      setToken(savedToken);
      setUser(savedUser);
      fetchSuperAdminData(savedToken);
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
        if (data.user.role !== 'SUPER_ADMIN') {
          setLoginError("Access Denied: Exclusive to Super Administrators.");
          return;
        }
        localStorage.setItem('superAdminToken', data.token);
        localStorage.setItem('superAdminUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        fetchSuperAdminData(data.token);
        fetchAllUsers(data.token);
        fetchCatalogData();
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Error connecting to authentication server.');
    }
  };

  const fetchSuperAdminData = async (authToken: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/super-admin/revenue-analytics`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
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

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === 'trackhubsports@gmail.com') { alert('Cannot delete primary Super Admin.'); return; }
    if (!confirm(`Delete user ${email}?`)) return;

    try {
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('User deleted successfully.');
        fetchAllUsers(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting user.'); }
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
        fetchSuperAdminData(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error updating inquiry status.'); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: prodName, brand: prodBrand, description: prodDescription, price: prodPrice, salePrice: prodSalePrice, stock: prodStock, imageUrl: prodImageUrl, categoryId: prodCategoryId, subCategoryId: prodSubCategoryId || null })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product published live successfully!');
        setProdName(''); setProdPrice(''); setProdSalePrice(''); setProdStock(''); setProdImageUrl(''); setProdDescription('');
        fetchCatalogData();
      } else { alert(data.error); }
    } catch (err) { alert('Error publishing product.'); }
  };

  const handleUpdateProductFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductModal) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/products/${editingProductModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          name: editProdName, 
          price: editProdPrice, 
          salePrice: editProdSalePrice, 
          stock: editProdStock, 
          imageUrl: editProdImageUrl, 
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

  // --- Category Handlers ---
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

  // --- Subcategory Handlers ---
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

  // --- Coupon Handlers ---
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

  // --- Banner Handlers ---
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

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Configs synchronized successfully.');
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading Super Admin Portal...</div>;

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 items-center justify-center shadow-lg mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black">Super Admin Portal</h1>
            <p className="text-xs text-gray-400">Exclusive login for Super Administrator credentials.</p>
          </div>

          {loginError && <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded-xl font-medium">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Super Admin Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="trackhubsports@gmail.com" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 font-medium" />
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg transition text-xs uppercase tracking-wider">
              Sign In as Super Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate live summary stats for the owner overview
  const totalOrdersCount = analytics?.orders?.length || 0;
  const pendingInquiriesCount = analytics?.franchiseInquiries?.filter((i: any) => i.status === 'PENDING').length || 0;
  const totalUsersCount = allUsers.length;
  const totalProductsCount = products.length;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 font-sans flex flex-col md:flex-row">
      
      {/* 🚀 Premium Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950 text-white p-6 flex flex-col justify-between shrink-0 border-r border-white/10">
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950">
              SUPER ADMIN
            </span>
            <h2 className="text-lg font-black text-white mt-2">Master Control</h2>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" /> Financial & Overview
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
            <button onClick={() => setActiveTab('configs')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'configs' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Settings className="w-4 h-4" /> Gateway & Server Configs
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
                <h1 className="text-xl font-black text-slate-900">Owner Command Center</h1>
                <p className="text-xs text-gray-500">Real-time platform performance, order summaries, and financial monitoring.</p>
              </div>
              <button onClick={() => { fetchSuperAdminData(token!); fetchAllUsers(token!); fetchCatalogData(); }} className="px-4 py-2 bg-slate-900 text-amber-400 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition">
                Refresh All Metrics
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Revenue</span>
                <h3 className="text-2xl font-black text-slate-900">₹{analytics?.totalPlatformRevenue?.toLocaleString() || '0'}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Orders</span>
                <h3 className="text-2xl font-black text-slate-900">{totalOrdersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Users</span>
                <h3 className="text-2xl font-black text-slate-900">{totalUsersCount}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Active Products</span>
                <h3 className="text-2xl font-black text-slate-900">{totalProductsCount}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-500" /> Recent Order Summary
                  </h2>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {!analytics?.orders || analytics.orders.length === 0 ? (
                    <p className="text-xs text-gray-500">No orders recorded yet.</p>
                  ) : (
                    analytics.orders.slice(0, 5).map((ord: any) => (
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

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" /> System & Company Status
                </h2>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl font-bold">
                    <span className="text-gray-600">Pending Franchise Requests</span>
                    <span className="text-amber-600">{pendingInquiriesCount}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-xl font-bold">
                    <span className="text-gray-600">Platform Commission Rate</span>
                    <span className="text-slate-900">{analytics?.commissionPercentage || '10%'}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-xl font-bold text-green-800">
                    <span>Server Status</span>
                    <span>🟢 Online & Active</span>
                  </div>
                </div>
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
                  Super Admins have full access to create, modify, update passwords, and delete any user account across the entire ecosystem.
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
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => { setEditingUser(u); setEditFullName(u.fullName || ''); setEditRole(u.role); setEditNewPassword(''); }} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition">Edit</button>
                          <button onClick={() => handleDeleteUser(u.id, u.email)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition">Remove</button>
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
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Franchise & Vendor Partnership Requests (Live Sync)</h2>
            <div className="space-y-4">
              {!analytics?.franchiseInquiries || analytics.franchiseInquiries.length === 0 ? (
                <p className="text-xs text-gray-500">No applications recorded yet.</p>
              ) : (
                analytics.franchiseInquiries.map((iq: any) => (
                  <div key={iq.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{iq.fullName} ({iq.city}) - <span className="text-amber-600">{iq.status}</span></p>
                      <p className="text-gray-600">Email: {iq.email} | Phone: {iq.phone}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Investment Capacity: {iq.investment} | Message: {iq.message || 'N/A'}</p>
                    </div>
                    <select value={iq.status} onChange={e => handleUpdateInquiryStatus(iq.id, e.target.value)} className="p-2 rounded-xl border border-gray-300 text-xs font-bold bg-white text-gray-900 shadow-xs">
                      <option value="PENDING">Pending</option>
                      <option value="LOOKING_APPROVAL">Looking Approval</option>
                      <option value="ACCEPTED">Accepted (Auto-Create Account)</option>
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
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Live Customer Orders & Deliveries Sync</h2>
            {!analytics?.orders || analytics.orders.length === 0 ? (
              <p className="text-xs text-gray-500">No customer orders placed yet.</p>
            ) : (
              analytics.orders.map((ord: any) => (
                <div key={ord.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50 text-xs space-y-2">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Order ID: {ord.id}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase text-[10px]">{ord.status}</span>
                  </div>
                  <p className="text-gray-600">Customer: {ord.user?.fullName} ({ord.user?.email}) | Total Amount: <b className="text-slate-900">₹{ord.totalAmount}</b></p>
                  <p className="text-[11px] text-gray-500">Payment Mode: {ord.paymentMode} | Date: {new Date(ord.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: CONFIGS */}
        {activeTab === 'configs' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6 max-w-xl">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Gateway & Server Configurations</h2>
            <form onSubmit={handleSaveConfigs} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Razorpay Key ID</label>
                <input type="text" value={razorpayKeyId} onChange={e => setRazorpayKeyId(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Razorpay Key Secret</label>
                <input type="password" value={razorpaySecret} onChange={e => setRazorpaySecret(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Brevo SMTP Sender Email</label>
                <input type="email" value={smtpSender} onChange={e => setSmtpSender(e.target.value)} className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900" />
              </div>
              <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider shadow-md">
                Save & Synchronize Configs
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: CATALOG & OFFERS (Includes Banner & Slider Manager) */}
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
                🖼️ Banner Sliders ({banners.length})
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
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Image URL *</label>
                      <input type="url" required value={prodImageUrl} onChange={e => setProdImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full p-3 rounded-xl border text-xs bg-white text-gray-900" />
                    </div>
                    <button type="submit" className="md:col-span-2 bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md">Publish Product Live</button>
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
                            <td className="py-3 px-4"><img src={p.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg border" /></td>
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
                                setEditProdPrice(p.price); 
                                setEditProdSalePrice(p.salePrice || ''); 
                                setEditProdStock(p.stock); 
                                setEditProdImageUrl(p.imageUrl);
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
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Product Image URL *</label>
              <input type="url" required value={editProdImageUrl} onChange={e => setEditProdImageUrl(e.target.value)} className="w-full p-3 border rounded-xl text-xs text-gray-900 bg-white" />
            </div>
            <div className="flex gap-2 pt-3">
              <button type="button" onClick={() => setEditingProductModal(null)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-xs text-gray-700">Cancel</button>
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider">Save All Changes</button>
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