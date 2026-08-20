import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

const ProductGrid = ({ activeCategory, searchQuery, onProductSelect, cart, setCart, wishlist, setWishlist, navigate }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products?approved=true');
        const data = await res.json();
        
        // Filter out products whose image points to a localhost port
        // (e.g. localhost:7071) that isn't our own backend (port 5000).
        // These are seller-uploaded products with broken local paths.
        const isValidImage = (url) => {
          if (!url) return false;
          try {
            const parsed = new URL(url);
            // Allow: external URLs (https://...) OR our own backend
            if (parsed.hostname === 'localhost' && parsed.port !== '5000') return false;
            return true;
          } catch {
            // Relative URL or unparseable — allow it
            return true;
          }
        };

        const formattedData = data
          .filter(item => isValidImage(item.image || item.images?.[0]))
          .map(item => ({
            ...item,
            id: item._id,
            title: item.title,
            image: item.image || item.images?.[0],
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
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
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
