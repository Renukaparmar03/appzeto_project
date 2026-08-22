import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, XCircle, Trash2, X, MapPin, 
  ShoppingBag, CheckCircle, Truck, PackageOpen, CreditCard, Clock, User, Store, IndianRupee, Bell, ArrowRight, Check
} from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminOrders.css';

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchAllOrders();

    // Socket.io Real-time Connection for Incoming Orders
    const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
    
    socket.emit('joinAdminRoom');

    socket.on('newOrder', (newOrder) => {
      console.log('🔔 Live new order arrived in admin:', newOrder);
      setNewOrderAlert(newOrder);
      fetchAllOrders(); // Refresh list immediately

      // Auto dismiss alert banner after 12s
      setTimeout(() => {
        setNewOrderAlert(null);
      }, 12000);
    });

    socket.on('orderUpdated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.realId === updatedOrder._id ? {
        ...o,
        status: updatedOrder.status,
        deliveryStatus: updatedOrder.status,
        paymentStatus: updatedOrder.isPaid ? 'Paid' : 'Pending'
      } : o));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/orders');
      const data = await res.json();
      
      const ordersArray = Array.isArray(data) ? data : (data.orders || []);
      
      const formatted = ordersArray.map(order => {
        const firstItem = order.orderItems && order.orderItems[0];
        const totalItemsQty = order.orderItems?.reduce((acc, item) => acc + (item.qty || 1), 0) || 1;
        
        return {
          id: order.orderId || (order._id ? `ORD-${order._id.substring(0,8).toUpperCase()}` : 'ORD-N/A'),
          realId: order._id,
          customer: order.user?.name || 'Store Customer',
          customerEmail: order.user?.email || 'N/A',
          customerPhone: order.user?.phone || 'N/A',
          seller: 'Direct Store',
          itemsCount: order.orderItems?.length || 1,
          qty: totalItemsQty,
          amount: `₹${order.totalPrice || 0}`,
          numericAmount: order.totalPrice || 0,
          status: order.status || 'PENDING',
          deliveryStatus: order.status || 'PENDING',
          paymentMethod: order.paymentMethod || 'COD',
          paymentStatus: order.isPaid ? 'Paid' : 'Pending',
          date: new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          address: order.shippingAddress 
            ? `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}`.trim()
            : 'Standard Delivery Address',
          itemsList: order.orderItems || [],
          img: firstItem?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&q=80',
          productTitle: firstItem?.title ? (order.orderItems.length > 1 ? `${firstItem.title} + ${order.orderItems.length - 1} more` : firstItem.title) : 'Store Items',
          rawOrder: order
        };
      });

      setOrders(formatted);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (realId, newStatus, isPaidValue = undefined) => {
    try {
      setUpdatingId(realId);
      const payload = { status: newStatus };
      if (isPaidValue !== undefined) payload.isPaid = isPaidValue;

      const res = await fetch(`http://localhost:5000/api/orders/${realId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.realId === realId ? {
          ...o,
          status: updated.status,
          deliveryStatus: updated.status,
          paymentStatus: updated.isPaid ? 'Paid' : o.paymentStatus
        } : o));

        if (selectedOrder && selectedOrder.realId === realId) {
          setSelectedOrder(prev => ({
            ...prev,
            status: updated.status,
            deliveryStatus: updated.status,
            paymentStatus: updated.isPaid ? 'Paid' : prev.paymentStatus
          }));
        }
      } else {
        alert('Failed to update status on server');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleDeliveryFilter = (e) => setDeliveryFilter(e.target.value);
  const handlePaymentFilter = (e) => setPaymentFilter(e.target.value);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.productTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDelivery = deliveryFilter === 'All' || order.status === deliveryFilter;
    const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesDelivery && matchesPayment;
  });

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const getDeliveryClass = (status) => {
    switch (status) {
      case 'DELIVERED': return 'status-delivered';
      case 'SHIPPED': return 'status-processing';
      case 'PROCESSING':
      case 'ACCEPTED': return 'status-processing';
      case 'PENDING': return 'status-pending';
      case 'CANCELLED':
      case 'REJECTED': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    revenue: `₹${orders.filter(o => o.paymentStatus === 'Paid' || o.status === 'DELIVERED').reduce((sum, o) => sum + o.numericAmount, 0).toLocaleString()}`
  };

  return (
    <div className="admin-orders-page">
      {/* Real-time Order Alert Popup */}
      {newOrderAlert && (
        <div style={{
          backgroundColor: '#0c831f',
          color: '#ffffff',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(12, 131, 31, 0.3)',
          animation: 'slideDown 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={24} className="spin" />
            <div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>🔔 New Order Received: {newOrderAlert.orderId}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
                Amount: ₹{newOrderAlert.totalPrice} • Payment: {newOrderAlert.paymentMethod}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleUpdateStatus(newOrderAlert._id, 'PROCESSING')}
              style={{ backgroundColor: '#fff', color: '#0c831f', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
            >
              Accept Order
            </button>
            <button 
              onClick={() => setNewOrderAlert(null)}
              style={{ background: 'transparent', border: '1px solid #fff', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="orders-header">
        <div className="header-title">
          <h1>Orders Management</h1>
          <p>Accept incoming customer orders, dispatch & track fulfillment</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} className="icon" />
            <input 
              type="text" 
              placeholder="Search ID, customer..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="filter-dropdown">
            <Truck size={18} className="icon" />
            <select value={deliveryFilter} onChange={handleDeliveryFilter}>
              <option value="All">All Order Status</option>
              <option value="PENDING">Pending (New)</option>
              <option value="PROCESSING">Processing (Accepted)</option>
              <option value="SHIPPED">Shipped (Dispatched)</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="filter-dropdown">
            <CreditCard size={18} className="icon" />
            <select value={paymentFilter} onChange={handlePaymentFilter}>
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Order Stats Cards */}
      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <ShoppingBag size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Orders</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Pending / Processing</p>
            <h3 className="stat-value">{stats.pending}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Delivered Orders</p>
            <h3 className="stat-value">{stats.delivered}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">{stats.revenue}</h3>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-card card">
        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} className="empty-icon" />
              <h3>No Orders Found</h3>
              <p>When customers place orders, they will appear here in real-time.</p>
            </div>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID & Customer</th>
                  <th>Products</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Order Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.realId || order.id} style={{ backgroundColor: order.status === 'PENDING' ? '#f0fdf4' : 'inherit' }}>
                    <td>
                      <div className="order-info-cell">
                        <p className="order-id" style={{ fontWeight: '700', color: '#0c831f' }}>{order.id}</p>
                        <p className="customer-name" style={{ fontWeight: '600', margin: 0 }}>{order.customer}</p>
                        <p className="order-date" style={{ fontSize: '12px', color: '#666' }}>{order.date}</p>
                      </div>
                    </td>
                    <td>
                      <div className="product-cell">
                        <img src={order.img} alt={order.productTitle} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px' }} />
                        <div>
                          <p className="product-name" style={{ fontWeight: '600', margin: 0 }}>{order.productTitle}</p>
                          <p className="seller-name" style={{ fontSize: '12px', color: '#666' }}>Qty: {order.qty} items</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="amount-text" style={{ fontWeight: '700' }}>{order.amount}</span></td>
                    <td>
                      <div className="payment-cell">
                        <span className={`order-badge ${order.paymentStatus === 'Paid' ? 'status-delivered' : 'status-pending'}`}>
                          {order.paymentStatus}
                        </span>
                        <p className="method-text" style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>{order.paymentMethod}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`order-badge ${getDeliveryClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* ACCEPT ORDER BUTTON */}
                        {order.status === 'PENDING' && (
                          <button 
                            disabled={updatingId === order.realId}
                            onClick={() => handleUpdateStatus(order.realId, 'PROCESSING')}
                            style={{ backgroundColor: '#0c831f', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Accept and start processing order"
                          >
                            <Check size={14} /> Accept
                          </button>
                        )}

                        {/* SHIP ORDER BUTTON */}
                        {order.status === 'PROCESSING' && (
                          <button 
                            disabled={updatingId === order.realId}
                            onClick={() => handleUpdateStatus(order.realId, 'SHIPPED')}
                            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Dispatch order for delivery"
                          >
                            <Truck size={14} /> Dispatch
                          </button>
                        )}

                        {/* DELIVER ORDER BUTTON */}
                        {order.status === 'SHIPPED' && (
                          <button 
                            disabled={updatingId === order.realId}
                            onClick={() => handleUpdateStatus(order.realId, 'DELIVERED', true)}
                            style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Mark order as completed & delivered"
                          >
                            <CheckCircle size={14} /> Complete
                          </button>
                        )}

                        {/* REJECT BUTTON */}
                        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <button 
                            disabled={updatingId === order.realId}
                            onClick={() => handleUpdateStatus(order.realId, 'CANCELLED')}
                            style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
                            title="Cancel / Reject Order"
                          >
                            Reject
                          </button>
                        )}

                        <button className="btn-icon view" title="View Full Details" onClick={() => openModal(order)}>
                          <Eye size={16} />
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

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>Order Details: {selectedOrder.id}</h2>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>Placed on {selectedOrder.date}</p>
              </div>
              <button className="close-btn" onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="#3b82f6" /> Customer Info
                  </h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Name:</strong> {selectedOrder.customer}</p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} color="#ef4444" /> Shipping Address
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px' }}>{selectedOrder.address}</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} color="#16a34a" /> Payment Summary
                  </h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}><strong>Method:</strong> {selectedOrder.paymentMethod}</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0c831f' }}>Total: {selectedOrder.amount}</p>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Ordered Items ({selectedOrder.itemsList?.length || 1})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.itemsList && selectedOrder.itemsList.length > 0 ? (
                    selectedOrder.itemsList.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={item.image || 'https://placehold.co/40x40'} alt={item.title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{item.title}</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Qty: {item.qty} × ₹{item.price}</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '14px' }}>₹{(item.price * item.qty).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p>No items details available.</p>
                  )}
                </div>
              </div>

              {/* Admin Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>Current Status:</span>
                  <span className={`order-badge ${getDeliveryClass(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {selectedOrder.status === 'PENDING' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.realId, 'PROCESSING')}
                      style={{ backgroundColor: '#0c831f', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Accept Order
                    </button>
                  )}

                  {selectedOrder.status === 'PROCESSING' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.realId, 'SHIPPED')}
                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Dispatch Order
                    </button>
                  )}

                  {selectedOrder.status === 'SHIPPED' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.realId, 'DELIVERED', true)}
                      style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Mark Delivered
                    </button>
                  )}

                  {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'PROCESSING') && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.realId, 'CANCELLED')}
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Reject Order
                    </button>
                  )}

                  <button 
                    onClick={closeModal}
                    style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #ccc', background: '#f1f5f9', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Close
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
