import React, { useState, useEffect } from 'react';
import { SUBCATEGORIES } from '../data';
import ProductCard from './ProductCard';
import { ArrowLeft } from 'lucide-react';

const CategoryPage = ({ activeCategory, setActiveCategory, searchQuery, onProductSelect, cart, setCart, wishlist, setWishlist, navigate }) => {
  const subCats = SUBCATEGORIES[activeCategory] || [];
  const [activeSubCategory, setActiveSubCategory] = useState('');

  // Update active subcategory whenever activeCategory changes
  useEffect(() => {
    // Default to 'All' so that products without a specific subcategory are visible
    setActiveSubCategory('All');
  }, [activeCategory]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products?approved=true');
        const data = await res.json();
        const formattedData = data.map(item => ({
          ...item,
          id: item._id,
          title: item.title,
        }));
        setProducts(formattedData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = product.category === activeCategory;
    const matchesSubCategory = activeSubCategory === 'All' || activeSubCategory === '' || product.subCategory === activeSubCategory;
    const matchesSearch = !searchQuery || (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSubCategory && matchesSearch;
  });

  return (
    <div className="category-page-container">
      {/* Header bar with Back button */}
      <div className="category-page-header">
        <button 
          className="back-home-btn" 
          onClick={() => setActiveCategory('All')}
          title="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="category-header-title-section">
          <h2 className="category-title">{activeCategory}</h2>
          <span className="items-count-badge">{filteredProducts.length} items available</span>
        </div>
      </div>

      <div className="category-page-content">
        {/* Left Subcategory Sidebar */}
        <aside className="subcategory-sidebar hide-scrollbar">
          {/* Always show an "All" tab at the top so uncategorized products are visible */}
          <button
            className={`subcategory-sidebar-item ${activeSubCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveSubCategory('All')}
          >
            <div className="subcat-img-wrapper" style={{ background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px' }}>📦</span>
            </div>
            <span className="subcat-name">All Items</span>
          </button>
          
          {subCats.map((sub) => (
            <button
              key={sub.id}
              className={`subcategory-sidebar-item ${activeSubCategory === sub.name ? 'active' : ''}`}
              onClick={() => setActiveSubCategory(sub.name)}
            >
              <div className="subcat-img-wrapper">
                <img src={sub.image} alt={sub.name} className="subcat-img" />
              </div>
              <span className="subcat-name">{sub.name}</span>
            </button>
          ))}
          {subCats.length === 0 && (
            <div className="empty-subcategories">
              <p>No subcategories</p>
            </div>
          )}
        </aside>

        {/* Right Product Grid Area */}
        <main className="subcategory-products-area hide-scrollbar">
          <div className="subcategory-banner">
            <h3 className="subcategory-banner-title">{activeSubCategory || 'All Products'}</h3>
            <p className="subcategory-banner-subtitle">
              Fresh and handpicked items under {activeSubCategory || activeCategory}
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="category-product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onCardClick={onProductSelect} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="category-no-products">
              <div className="no-items-illustration">📦</div>
              <p className="no-items-title">Restocking Soon!</p>
              <p className="no-items-desc">
                We are currently stocking up on fresh {activeSubCategory || activeCategory} products. Please check back in a few minutes!
              </p>
              <button className="browse-all-btn" onClick={() => setActiveCategory('All')}>
                Explore Other Categories
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
