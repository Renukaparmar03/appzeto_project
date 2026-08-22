import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ activeCategory, searchQuery, onProductSelect, cart, setCart, wishlist, setWishlist, navigate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const formattedData = data.map(item => ({
            ...item,
            id: item._id || item.id,
            title: item.title || item.name || 'Product',
            image: item.image || (item.images && item.images[0]?.url) || item.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
            price: item.discountPrice || item.price || 0,
            originalPrice: item.originalPrice || item.price || 0,
            category: item.category || 'General',
            stock: item.stock !== undefined ? item.stock : 10
          }));
          
          setProducts(formattedData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = !activeCategory || activeCategory === 'All' || product.category?.toLowerCase() === activeCategory?.toLowerCase();
    const matchesSearch = !searchQuery || (product.title && product.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading products...</div>;
  }

  return (
    <section className="product-grid-section">
      <h3 className="section-title">
        {activeCategory === 'All' ? 'Fresh Picks for You' : `${activeCategory}`}
      </h3>
      {filteredProducts.length > 0 ? (
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onCardClick={onProductSelect} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} navigate={navigate} />
          ))}
        </div>
      ) : (
        <div className="no-products-container">
          <p className="no-products-text">No products found in this category.</p>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
