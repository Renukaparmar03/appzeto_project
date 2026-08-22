import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { RefreshCw, Sparkles, ShoppingBag, Clock, CheckCircle2, Truck, PackageCheck, AlertCircle } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

const OrdersPage = ({ onProductSelect }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const userInfoStr = localStorage.getItem('user_info');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userId = userInfo ? (userInfo._id || userInfo.id) : null;

  const socket = useSocket('user', userId);

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prevOrders => prevOrders.map(order => 
        (order._id === updatedOrder._id || order.orderId === updatedOrder.orderId) ? { ...order, ...updatedOrder } : order
      ));
    };

    socket.on('orderUpdated', handleOrderUpdated);
    socket.on(`order_${userId}`, handleOrderUpdated);

    return () => {
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off(`order_${userId}`, handleOrderUpdated);
    };
  }, [socket, userId]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const endpoint = (userId && userId !== '000000000000000000000000')
          ? `http://localhost:5000/api/orders/user/${userId}`
          : 'http://localhost:5000/api/orders';

        const res = await fetch(endpoint);
        let fetchedData = [];
        if (res.ok) {
          fetchedData = await res.json();
        }

        // Also merge with locally stored recent orders for instant reflection
        let localOrders = [];
        try {
          localOrders = JSON.parse(localStorage.getItem('user_recent_orders') || '[]');
        } catch (e) {}

        const combined = [...(Array.isArray(fetchedData) ? fetchedData : []), ...localOrders];
        
        // Deduplicate by _id or orderId
        const uniqueMap = new Map();
        combined.forEach(o => {
          if (!o) return;
          const key = o._id || o.orderId;
          if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, o);
          }
        });

        const sortedOrders = Array.from(uniqueMap.values()).sort((a, b) => 
          new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now())
        );

        setOrders(sortedOrders);
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { text: 'Delivered', bg: '#dcfce7', color: '#16a34a', icon: <PackageCheck size={14} /> };
      case 'SHIPPED':
        return { text: 'Out for Delivery', bg: '#e0f2fe', color: '#0284c7', icon: <Truck size={14} /> };
      case 'PROCESSING':
      case 'ACCEPTED':
        return { text: 'Order Accepted & Preparing', bg: '#fef9c3', color: '#ca8a04', icon: <Clock size={14} /> };
      case 'CANCELLED':
      case 'REJECTED':
        return { text: 'Cancelled', bg: '#fee2e2', color: '#ef4444', icon: <AlertCircle size={14} /> };
      default:
        return { text: 'Order Placed (Waiting for Admin)', bg: '#f1f5f9', color: '#475569', icon: <Clock size={14} /> };
    }
  };

  return (
    <div className="orders-page">
      {/* Reordering Banner */}
      <div className="reorder-banner">
        <div className="banner-glow"></div>
        <div className="reorder-banner-content">
          <div className="reorder-icon-wrapper">
            <RefreshCw size={24} className="reorder-spin-icon" />
          </div>
          <div className="reorder-text-content">
            <h2>Reordering Will Be Easy</h2>
            <p>Get your favorite essentials delivered in one click</p>
          </div>
          <div className="banner-sparkle">
            <Sparkles size={20} fill="#fff" color="#fff" />
          </div>
        </div>
      </div>

      {/* Past Orders Section */}
      <section className="past-orders-section">
        <div className="orders-section-header">
          <ShoppingBag size={18} className="orders-section-icon" />
          <h3 className="section-title">Your Order History</h3>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="order-empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <h3 className="order-text-primary" style={{ margin: '0 0 6px 0', fontSize: '18px' }}>No orders yet</h3>
              <p className="order-text-secondary" style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Looks like you haven't placed any orders yet.
              </p>
            </div>
          ) : (
            orders.map(order => {
              const badge = getStatusBadge(order.status);
              const items = order.orderItems || [];
              const orderIdDisplay = order.orderId || (order._id ? `ORD-${order._id.substring(0,8).toUpperCase()}` : 'ORD-NEW');

              return (
                <div key={order._id || orderIdDisplay} className="order-history-card" style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#0c831f' }}>{orderIdDisplay}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        background: badge.bg,
                        color: badge.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {badge.icon} {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    {items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img 
                            src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80&q=80'} 
                            alt={item.title} 
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #f1f5f9' }} 
                          />
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.title}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Qty: {item.qty} × ₹{item.price}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                          ₹{(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      Payment: <strong>{order.paymentMethod || 'COD'}</strong> ({order.isPaid ? 'Paid' : 'Pending'})
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0c831f' }}>
                      ₹{order.totalPrice || 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default OrdersPage;
