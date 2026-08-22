import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, X, Package, 
  Tag, IndianRupee, Layers, AlertCircle, CheckCircle, PackageMinus, Plus, Image as ImageIcon, Save, Check
} from 'lucide-react';
import './AdminProducts.css';

const CATEGORY_OPTIONS = [
  'Grocery & Kitchen',
  'Snacks & Drinks',
  'Beauty & Personal Care',
  'Fashion',
  'Electronics',
  'Mobiles',
  'Furniture',
  'Shoes',
  'Toys'
];

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    category: 'Grocery & Kitchen',
    price: '',
    discountPrice: '',
    originalPrice: '',
    stock: 50,
    brand: '',
    sku: '',
    image: '',
    description: '',
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/products');
      const data = await res.json();
      
      const formatted = Array.isArray(data) ? data.map(p => ({
        id: p._id,
        _id: p._id,
        title: p.title,
        name: p.title,
        seller: 'Store Admin',
        category: p.category || 'Grocery & Kitchen',
        price: p.price,
        discountPrice: p.discountPrice,
        originalPrice: p.originalPrice,
        brand: p.brand || '',
        sku: p.sku || '',
        stock: p.stock !== undefined ? p.stock : 0,
        isApproved: p.isApproved !== false,
        status: p.status || (p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'Active'),
        img: p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
        image: p.image,
        description: p.description || ''
      })) : [];
      setProducts(formatted);
    } catch(err) {
      console.error('Error loading products in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingId(p.id);
    setFormData({
      title: p.title || p.name || '',
      category: p.category || 'Grocery & Kitchen',
      price: p.price || '',
      discountPrice: p.discountPrice || p.price || '',
      originalPrice: p.originalPrice || p.price || '',
      stock: p.stock !== undefined ? p.stock : 50,
      brand: p.brand || '',
      sku: p.sku || '',
      image: p.img || p.image || '',
      description: p.description || '',
      status: p.status || 'Active'
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      alert('Please fill product title and price');
      return;
    }

    try {
      setSaving(true);
      const url = editingId 
        ? `http://localhost:5000/api/products/${editingId}`
        : 'http://localhost:5000/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsFormModalOpen(false);
        setFormData(initialForm);
        setEditingId(null);
        await fetchProducts();
      } else {
        const err = await res.json();
        alert(`Failed to save product: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Server error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
        if (selectedProduct?.id === id) {
          setIsDetailModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);
  const handleCategoryFilter = (e) => setCategoryFilter(e.target.value);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openDetailModal = (product) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };
  
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedProduct(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Low Stock': return 'status-low';
      case 'Out of Stock': return 'status-out';
      case 'Hidden': return 'status-hidden';
      default: return 'status-active';
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'Active').length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 15).length,
    outOfStock: products.filter(p => p.stock === 0).length,
  };

  return (
    <div className="admin-products-page">
      {/* Header Section */}
      <div className="products-header">
        <div className="header-title">
          <h1>Products Catalog</h1>
          <p>Add, edit, manage inventory & prices directly</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={handleOpenAddModal}
            className="btn-primary" 
            style={{ 
              backgroundColor: '#0c831f', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 18px', 
              borderRadius: '8px', 
              fontWeight: '600', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Add New Product
          </button>
          
          <div className="search-box">
            <Search size={18} className="icon" />
            <input 
              type="text" 
              placeholder="Search products, brand..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="filter-dropdown">
            <Layers size={18} className="icon" />
            <select value={categoryFilter} onChange={handleCategoryFilter}>
              <option value="All">All Categories</option>
              {CATEGORY_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-dropdown">
            <Filter size={18} className="icon" />
            <select value={statusFilter} onChange={handleStatusFilter}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Stats Cards */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Products</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Active Items</p>
            <h3 className="stat-value">{stats.active}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Low Stock (&lt; 15)</p>
            <h3 className="stat-value">{stats.lowStock}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-red">
            <PackageMinus size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Out of Stock</p>
            <h3 className="stat-value">{stats.outOfStock}</h3>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="products-card card">
        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading products catalog...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="empty-icon" />
              <h3>No Products Found</h3>
              <p>Click "Add New Product" to stock your store catalog.</p>
            </div>
          ) : (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Info</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <img src={product.img} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                        <div>
                          <p className="product-name" style={{ fontWeight: '600', margin: 0 }}>{product.name}</p>
                          <p className="product-id" style={{ fontSize: '12px', color: '#666', margin: 0 }}>{product.brand || 'No Brand'}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="category-tag">{product.category}</span></td>
                    <td><span style={{ fontSize: '13px', color: '#555', fontFamily: 'monospace' }}>{product.sku || 'N/A'}</span></td>
                    <td><span className="price-text" style={{ fontWeight: '700' }}>₹{product.discountPrice || product.price}</span></td>
                    <td>
                      <span className={`stock-text ${product.stock === 0 ? 'text-red font-bold' : product.stock < 15 ? 'text-orange font-bold' : 'text-green'}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" title="View Details" onClick={() => openDetailModal(product)}>
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon edit" title="Edit Product" onClick={() => handleOpenEditModal(product)}>
                          <Edit size={18} />
                        </button>
                        <button className="btn-icon delete" title="Delete Product" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setIsFormModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Product Title *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Fresh Red Apple (Shimla)" 
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Category *</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Brand</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FreshFarm, boAt, Nivea" 
                    value={formData.brand} 
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Original Price (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="99" 
                    value={formData.price} 
                    onChange={e => setFormData({ ...formData, price: e.target.value, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Discounted / Selling Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="79" 
                    value={formData.discountPrice} 
                    onChange={e => setFormData({ ...formData, discountPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Stock Units *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="50" 
                    value={formData.stock} 
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>SKU Code</label>
                  <input 
                    type="text" 
                    placeholder="GRO-APP-001" 
                    value={formData.sku} 
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Image URL (https://...)</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/photo-..." 
                    value={formData.image} 
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                  {formData.image && (
                    <div style={{ marginTop: '8px' }}>
                      <img src={formData.image} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Description</label>
                  <textarea 
                    rows="3" 
                    placeholder="Product details, features, weights..." 
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                marginTop: '16px',
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#ffffff',
                paddingTop: '14px',
                paddingBottom: '4px',
                borderTop: '1px solid #e2e8f0',
                zIndex: 20
              }}>
                <button 
                  type="button" 
                  onClick={() => setIsFormModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #ccc', background: '#f8fafc', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ padding: '10px 24px', borderRadius: '6px', border: 'none', background: '#0c831f', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                >
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {isDetailModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button className="close-btn" onClick={closeDetailModal}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              <div className="product-details-container">
                <div className="product-image-container">
                  <img src={selectedProduct.img} alt={selectedProduct.name} className="modal-large-img" />
                  <span className={`status-badge floating ${getStatusClass(selectedProduct.status)}`}>
                    {selectedProduct.status}
                  </span>
                </div>
                
                <div className="product-info-details">
                  <div className="product-title-section">
                    <h3>{selectedProduct.name}</h3>
                    <p className="product-id-modal">SKU: {selectedProduct.sku || selectedProduct.id}</p>
                    <h2 className="product-price-large">₹{selectedProduct.discountPrice || selectedProduct.price}</h2>
                  </div>

                  <div className="product-desc-section">
                    <h4>Description</h4>
                    <p>{selectedProduct.description || 'No description available.'}</p>
                  </div>

                  <div className="modal-info-grid compact">
                    <div className="info-item">
                      <div className="info-icon bg-purple"><Tag size={16} /></div>
                      <div className="info-text">
                        <label>Category</label>
                        <p>{selectedProduct.category}</p>
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="info-icon bg-orange"><Package size={16} /></div>
                      <div className="info-text">
                        <label>Stock Available</label>
                        <p className={selectedProduct.stock === 0 ? 'text-red font-bold' : ''}>
                          {selectedProduct.stock} Units
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-outline-danger" onClick={() => handleDeleteProduct(selectedProduct.id)}>
                   <Trash2 size={18} /> Delete Product
                </button>
                <div className="right-actions">
                  <button className="btn-outline" onClick={() => { closeDetailModal(); handleOpenEditModal(selectedProduct); }}>
                    <Edit size={18} /> Edit Details
                  </button>
                  <button className="btn-primary" onClick={closeDetailModal}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
