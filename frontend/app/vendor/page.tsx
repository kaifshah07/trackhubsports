'use client';

import React, { useState, useEffect } from 'react';
import { PackageOpen, LayoutDashboard, LogOut, Lock, PlusCircle, Layers3, Edit3, X, Trash2 } from 'lucide-react';

export default function VendorPage() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'categories'>('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Category & Subcategory Form
  const [catName, setCatName] = useState('');
  const [subCatName, setSubCatName] = useState('');
  const [subCatCategoryId, setSubCatCategoryId] = useState('');

  // Product Form
  const [prodName, setProdName] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodSalePrice, setProdSalePrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodSubCategoryId, setProdSubCategoryId] = useState('');

  // Product Edit Modal State
  const [editingProductModal, setEditingProductModal] = useState<any>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdSalePrice, setEditProdSalePrice] = useState('');
  const [editProdStock, setEditProdStock] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdCategoryId, setEditProdCategoryId] = useState('');
  const [editProdSubCategoryId, setEditProdSubCategoryId] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://trackhubsports.onrender.com';

  useEffect(() => {
    const savedToken = localStorage.getItem('vendorToken');
    const savedUser = JSON.parse(localStorage.getItem('vendorUser') || 'null');

    if (savedToken && savedUser && savedUser.role === 'VENDOR') {
      setToken(savedToken);
      setUser(savedUser);
      fetchData(savedToken);
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
        if (data.user.role !== 'VENDOR') {
          setLoginError("Access Denied: Exclusive to Brand Vendors.");
          return;
        }
        localStorage.setItem('vendorToken', data.token);
        localStorage.setItem('vendorUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        fetchData(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch (err) {
      setLoginError('Server connection error.');
    }
  };

  const fetchData = async (authToken: string) => {
    try {
      const catRes = await fetch(`${apiUrl}/api/categories`);
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.categories);

      const subRes = await fetch(`${apiUrl}/api/subcategories`);
      const subData = await subRes.json();
      if (subData.success) setSubCategories(subData.subCategories);

      // Fetch ONLY this vendor's own products
      const prodRes = await fetch(`${apiUrl}/api/vendor/products`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.products);

      const anaRes = await fetch(`${apiUrl}/api/vendor/analytics`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const anaData = await anaRes.json();
      if (anaData.success) setAnalytics(anaData.analytics);
    } catch (err) { console.error(err); }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/vendor/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: catName })
      });
      const data = await res.json();
      if (data.success) {
        alert('Category added successfully!');
        setCatName('');
        fetchData(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error adding category.'); }
  };

  const handleCreateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatCategoryId) { alert('Select parent category.'); return; }
    try {
      const res = await fetch(`${apiUrl}/api/vendor/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: subCatName, categoryId: subCatCategoryId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Subcategory added successfully!');
        setSubCatName(''); setSubCatCategoryId('');
        fetchData(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error adding subcategory.'); }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api/vendor/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: prodName, description: prodDescription, price: prodPrice, salePrice: prodSalePrice, stock: prodStock, imageUrl: prodImageUrl, categoryId: prodCategoryId, subCategoryId: prodSubCategoryId || null })
      });
      const data = await res.json();
      if (data.success) {
        alert('Product published live to public customer storefront!');
        setProdName(''); setProdPrice(''); setProdSalePrice(''); setProdStock(''); setProdImageUrl(''); setProdDescription('');
        fetchData(token!);
        setActiveTab('overview');
      } else { alert(data.error); }
    } catch (err) { alert('Error publishing product.'); }
  };

  const handleUpdateProductFull = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductModal) return;
    try {
      const res = await fetch(`${apiUrl}/api/vendor/products/${editingProductModal.id}`, {
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
        fetchData(token!);
      } else { alert(data.error || 'Failed to update product.'); }
    } catch (err) { alert('Error updating product.'); }
  };

  const handleDeleteVendorProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/vendor/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Product deleted successfully.');
        fetchData(token!);
      } else { alert(data.error); }
    } catch (err) { alert('Error deleting product.'); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading Vendor Portal...</div>;

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 items-center justify-center shadow-lg mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black">Brand Vendor Portal</h1>
            <p className="text-xs text-gray-400">Manage your products and view revenue analytics.</p>
          </div>
          {loginError && <div className="bg-red-500/10 border border-red-500 text-red-400 text-xs p-3 rounded-xl font-medium">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Vendor Email</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="vendor@example.com" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Password</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••••••" className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white" />
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider">
              Sign In as Brand Vendor
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 font-sans flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-slate-950 text-white p-6 flex flex-col justify-between shrink-0 border-r border-white/10">
        <div className="space-y-8">
          <div>
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950">VENDOR HUB</span>
            <h2 className="text-lg font-black text-white mt-2">{user.fullName || 'Brand Partner'}</h2>
            <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'overview' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard className="w-4 h-4" /> Revenue & Overview
            </button>
            <button onClick={() => setActiveTab('catalog')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'catalog' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <PlusCircle className="w-4 h-4" /> Publish Products Live
            </button>
            <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition ${activeTab === 'categories' ? 'bg-amber-400 text-slate-950 shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <Layers3 className="w-4 h-4" /> Categories & Subcategories
            </button>
          </nav>
        </div>
        <div className="pt-6 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/10 text-red-400 rounded-2xl text-xs font-bold hover:bg-red-600 hover:text-white transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-xl font-black text-slate-900">Vendor Revenue Command Center</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Total Gross Sales</span>
                <h3 className="text-2xl font-black text-slate-900">₹{analytics?.totalSales?.toLocaleString() || '0'}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Platform Commission Cut ({analytics?.commissionPct || 10}%)</span>
                <h3 className="text-2xl font-black text-red-600">-₹{analytics?.platformCut?.toLocaleString() || '0'}</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border space-y-2">
                <span className="text-xs text-gray-500 font-semibold uppercase">Net Vendor Earnings</span>
                <h3 className="text-2xl font-black text-green-600">₹{analytics?.netVendorRevenue?.toLocaleString() || '0'}</h3>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">My Live Products ({products.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl border bg-gray-50 space-y-3">
                    <img src={p.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl border" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                      <p className="text-[11px] text-gray-500">Price: ₹{p.price} | Stock: {p.stock} Units</p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => { 
                        setEditingProductModal(p); 
                        setEditProdName(p.name); 
                        setEditProdPrice(p.price); 
                        setEditProdSalePrice(p.salePrice || ''); 
                        setEditProdStock(p.stock); 
                        setEditProdImageUrl(p.imageUrl);
                        setEditProdCategoryId(p.categoryId || '');
                        setEditProdSubCategoryId(p.subCategoryId || '');
                      }} className="flex-1 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold text-center">Edit Details</button>
                      <button onClick={() => handleDeleteVendorProduct(p.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6 max-w-2xl">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Publish New Product Live</h2>
            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name *</label>
                <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Pro Jersey" className="w-full p-3 border rounded-xl bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Regular MRP (₹) *</label>
                <input type="number" required value={prodPrice} onChange={e => setProdPrice(e.target.value)} placeholder="1499" className="w-full p-3 border rounded-xl bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Offer Price (₹)</label>
                <input type="number" value={prodSalePrice} onChange={e => setProdSalePrice(e.target.value)} placeholder="899" className="w-full p-3 border rounded-xl bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Initial Stock *</label>
                <input type="number" required value={prodStock} onChange={e => setProdStock(e.target.value)} placeholder="100" className="w-full p-3 border rounded-xl bg-white text-gray-900" />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Category *</label>
                <select value={prodCategoryId} onChange={e => setProdCategoryId(e.target.value)} required className="w-full p-3 border rounded-xl bg-white text-gray-900 font-bold">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Subcategory</label>
                <select value={prodSubCategoryId} onChange={e => setProdSubCategoryId(e.target.value)} className="w-full p-3 border rounded-xl bg-white text-gray-900">
                  <option value="">Select Subcategory</option>
                  {subCategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Product Image URL *</label>
                <input type="url" required value={prodImageUrl} onChange={e => setProdImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full p-3 border rounded-xl bg-white text-gray-900" />
              </div>
              <button type="submit" className="md:col-span-2 bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider shadow-md">
                Publish Product Live
              </button>
            </form>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 max-w-xl">
            <form onSubmit={handleCreateCategory} className="bg-white p-8 rounded-3xl border space-y-4">
              <h2 className="text-sm font-black uppercase text-slate-900">Create Main Category</h2>
              <input type="text" required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category Name" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
              <button type="submit" className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase">Add Category</button>
            </form>

            <form onSubmit={handleCreateSubCategory} className="bg-white p-8 rounded-3xl border space-y-4">
              <h2 className="text-sm font-black uppercase text-slate-900">Create Subcategory</h2>
              <select value={subCatCategoryId} onChange={e => setSubCatCategoryId(e.target.value)} required className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900 font-bold">
                <option value="">Select Parent Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" required value={subCatName} onChange={e => setSubCatName(e.target.value)} placeholder="Subcategory Name" className="w-full p-3 border rounded-xl text-xs bg-white text-gray-900" />
              <button type="submit" className="w-full bg-amber-400 text-slate-950 py-3.5 rounded-xl font-black text-xs uppercase">Add Subcategory</button>
            </form>
          </div>
        )}
      </main>

      {/* EDIT PRODUCT MODAL */}
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
              <button type="submit" className="flex-1 bg-amber-400 text-slate-950 py-3 rounded-xl font-black text-xs uppercase tracking-wider">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}