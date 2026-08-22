import React, { useState } from 'react';
import { ArrowLeft, Heart, Search, Share2, Star, Clock, Check, ChevronRight, ShieldCheck, ChevronDown } from 'lucide-react';
import ProductCard from './ProductCard';

const ProductDetailPage = ({ product, onBack, onSelectProduct, cart = [], setCart, wishlist = [], setWishlist, navigate }) => {
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const isWishlisted = wishlist.some(item => item.id === product.id);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const cartItem = cart.find(item => item.id === product.id);
  const isInCart = !!cartItem;

  const updateQuantity = (delta) => {
    if (setCart) {
      setCart(prev => prev.map(item => {
        if (item.id === product.id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean));
    }
  };

  React.useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/products');
        const data = await res.json();
        const formattedData = Array.isArray(data) ? data.map(item => ({
          ...item,
          id: item._id || item.id,
          title: item.title || item.name || 'Product',
          image: item.image || (item.images && item.images[0]?.url) || item.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
          price: item.discountPrice || item.price || 0
        })) : [];
        let related = formattedData.filter(p => p.id !== product.id);
        
        related.forEach(p => {
          let score = 0;
          if (p.category === product.category) score += 5;
          if (p.brand && product.brand && p.brand.toLowerCase() === product.brand.toLowerCase()) score += 4;
          
          // rough title match
          const titleWords = product.title.toLowerCase().split(' ').filter(w => w.length > 3);
          titleWords.forEach(w => {
            if (p.title.toLowerCase().includes(w)) score += 1;
          });
          p.relevanceScore = score;
        });

        const topRelated = related
          .filter(p => p.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8); // Top 8 recommendations

        setRelatedProducts(topRelated);
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };
    if (product?.category) {
      fetchRelated();
    }
  }, [product]);

  // Fallback for missing unit data
  const baseWeight = product.weight || product.volume || '1 pc';
  const basePrice = product.price || 0;
  const baseOriginalPrice = product.originalPrice || Math.round(basePrice * 1.2);
  const discountPercent = baseOriginalPrice > basePrice 
    ? Math.round(((baseOriginalPrice - basePrice) / baseOriginalPrice) * 100) 
    : 0;

  // Generate Unit Options based on the product
  const unitOptions = [
    {
      unit: baseWeight,
      price: basePrice,
      mrp: baseOriginalPrice,
    },
    {
      unit: `2 x ${baseWeight}`,
      price: Math.round(basePrice * 1.9),
      mrp: Math.round(baseOriginalPrice * 2),
    }
  ];

  const activeUnit = unitOptions[selectedUnitIndex];
  
  const discountText = discountPercent > 0 ? `${discountPercent}% OFF` : null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: `Check out ${product.title} on RR Mart!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Link copied to clipboard!");
    }
  };

  const hasRating = product.rating !== undefined && product.rating > 0;
  const reviewCount = product.reviews || 120; // fallback if reviews don't exist

  const displayImages = product.images && product.images.length > 0 
    ? product.images.map(img => typeof img === 'object' ? img.url : img)
    : (product.image ? [product.image] : []);

  return (
    <div className="product-detail-page">
      {/* Sticky Top Header */}
      <header className="detail-header">
        <button className="detail-header-btn" onClick={onBack} aria-label="Go Back">
          <ArrowLeft size={22} />
        </button>
        <div className="detail-header-right">
          <button 
            className={`detail-header-btn wishlist-btn-detail ${isWishlisted ? 'active' : ''}`}
            onClick={() => {
              if (setWishlist) {
                if (isWishlisted) {
                  setWishlist(prev => prev.filter(item => item.id !== product.id));
                } else {
                  setWishlist(prev => [...prev, product]);
                }
              }
            }}
            aria-label="Wishlist"
          >
            <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "#1a1a1a"} />
          </button>
          <button className="detail-header-btn" aria-label="Search">
            <Search size={20} />
          </button>
          <button className="detail-header-btn" onClick={handleShare} aria-label="Share">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Product Image Section */}
      <div className="detail-img-section compact-img-section" style={{ position: 'relative' }}>
        <img 
          src={displayImages[currentImageIndex]} 
          alt={`${product.title} - ${currentImageIndex + 1}`} 
          className="detail-img compact-img" 
        />
        
        {displayImages.length > 1 && (
          <>
            <div 
              style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 10 }}
              onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : displayImages.length - 1)}
            />
            <div 
              style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', zIndex: 10 }}
              onClick={() => setCurrentImageIndex(prev => prev < displayImages.length - 1 ? prev + 1 : 0)}
            />
            <div className="detail-img-dots modern-dots" style={{ zIndex: 20, position: 'relative' }}>
              {displayImages.map((_, i) => (
                <span 
                  key={i} 
                  className={`detail-dot ${i === currentImageIndex ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  style={{ cursor: 'pointer' }}
                ></span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Info Container */}
      <div className="detail-body-container modern-layout">
        
        {/* Product Title and Basic Info */}
        <div className="detail-info-card main-info-card borderless-card">
          <h1 className="detail-title">{product.title}</h1>
          <span className="product-unit-subtitle">{baseWeight}</span>

          <div className="detail-rating-meta modern-meta">
            {hasRating ? (
              <div className="rating-badge modern-rating">
                <span>{product.rating}</span>
                <Star size={12} fill="#FFD700" color="#FFD700" />
                <span className="review-count">({reviewCount} reviews)</span>
              </div>
            ) : (
              <div className="rating-badge modern-rating no-rating">
                <span>No ratings yet</span>
              </div>
            )}
            
            <div className="detail-delivery-tag">
              <Clock size={12} />
              <span>{product.deliveryTime || '10 MINS'}</span>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="detail-price-section">
            <span className="detail-price-main">₹{activeUnit.price}</span>
            {activeUnit.mrp > activeUnit.price && (
              <>
                <span className="detail-price-mrp">₹{activeUnit.mrp}</span>
                <span className="detail-discount-badge">{discountText}</span>
              </>
            )}
          </div>
          <p className="inclusive-tax-text">Inclusive of all taxes</p>
        </div>

        {/* Select Unit Options */}
        <div className="detail-info-card unit-section">
          <h3>Select Unit</h3>
          <div className="unit-options-grid">
            {unitOptions.map((option, index) => {
              const optDiscountPercent = option.mrp > option.price 
                ? Math.round(((option.mrp - option.price) / option.mrp) * 100) 
                : 0;
              return (
                <div 
                  key={index} 
                  className={`unit-option-card ${selectedUnitIndex === index ? 'active' : ''}`}
                  onClick={() => setSelectedUnitIndex(index)}
                >
                  <div className="unit-card-header">
                    <span className="unit-weight-label">{option.unit}</span>
                    {optDiscountPercent > 0 && (
                      <span className="unit-discount-tag">{optDiscountPercent}% OFF</span>
                    )}
                  </div>
                  <div className="unit-card-pricing">
                    <div className="price-inline">
                      <span className="unit-price-label">₹{option.price}</span>
                      {option.mrp > option.price && (
                        <span className="unit-mrp-label">₹{option.mrp}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Description Section */}
        <div className="detail-info-card description-section">
          <h3>Product Details</h3>
          <div className={`description-content ${showFullDescription ? 'expanded' : 'collapsed'}`}>
            <p>
              {product.description || 'Premium quality product sourced to ensure the best freshness and quality. Enjoy it with your daily meals.'}
            </p>
            {product.dynamicFields && Object.keys(product.dynamicFields).length > 0 && (
              <ul className="dynamic-attributes-list">
                {Object.entries(product.dynamicFields).map(([key, value]) => (
                  <li key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}</li>
                ))}
              </ul>
            )}
            {product.customAttributes && product.customAttributes.length > 0 && (
              <ul className="custom-attributes-list">
                {product.customAttributes.map((attr, idx) => (
                  <li key={idx}><strong>{attr.key}:</strong> {attr.value}</li>
                ))}
              </ul>
            )}
          </div>
          <button className="view-details-toggle" onClick={() => setShowFullDescription(!showFullDescription)}>
            {showFullDescription ? 'View Less' : 'View Details'} <ChevronDown size={14} className={showFullDescription ? 'rotate-180' : ''} />
          </button>
        </div>

        {/* 48 Hours Replacement Policy */}
        <div className="detail-info-card replacement-banner modern-replacement">
          <div className="replacement-icon">
            <ShieldCheck size={20} color="#0c831f" />
          </div>
          <div className="replacement-text">
            <h4>48 Hours Replacement Policy</h4>
            <p>Direct refund or replacement if quality is not satisfactory.</p>
          </div>
          <ChevronRight size={18} color="#999" />
        </div>

        {/* Related / Top Products */}
        {relatedProducts.length > 0 && (
          <div className="related-section">
            <h3 className="related-section-title">Similar Products</h3>
            <div className="related-products-row hide-scrollbar">
              {relatedProducts.map(p => (
                <div key={p.id} className="related-card-wrapper" onClick={() => {
                  onSelectProduct(p);
                  setSelectedUnitIndex(0);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}>
                  <ProductCard product={p} cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} navigate={navigate} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sticky Bottom Actions Bar */}
      <footer className="detail-sticky-footer modern-footer">
        <div className="footer-item-info">
          <div className="footer-item-image-wrapper">
            <img src={product.image} alt={product.title} />
          </div>
          <div className="footer-price-info">
            <span className="footer-weight">{activeUnit.unit}</span>
            <div className="footer-price-row">
              <span className="footer-price">₹{activeUnit.price}</span>
              {activeUnit.mrp > activeUnit.price && (
                <span className="footer-mrp">₹{activeUnit.mrp}</span>
              )}
            </div>
          </div>
        </div>

        {isInCart ? (
          <div className="footer-cart-control modern-cart-control">
            <button onClick={() => updateQuantity(-1)} className="cart-control-btn">-</button>
            <span className="cart-control-qty">{cartItem.quantity}</span>
            <button onClick={() => updateQuantity(1)} className="cart-control-btn">+</button>
          </div>
        ) : (
          <button 
            className="footer-add-btn modern-add-btn"
            onClick={() => {
              if (setCart) {
                setCart(prev => [...prev, { ...product, price: activeUnit.price, weight: activeUnit.unit, quantity: 1 }]);
              }
            }}
          >
            Add to cart
          </button>
        )}
      </footer>
    </div>
  );
};

export default ProductDetailPage;
