import React, { useState, useEffect } from 'react';
import {
  User, Mail, Calendar, Edit3, Key,
  Settings, Users, Store, ShoppingCart, IndianRupee,
  CheckCircle, Activity, FileText, Loader2, RefreshCw,
  TrendingUp, Package
} from 'lucide-react';
import './AdminProfile.css';

export default function AdminProfile() {
  // ── Admin identity (from localStorage set at login time) ──────────────────
  const adminEmail = localStorage.getItem('admin_email') || 'admin@laddoecommerce.com';
  const adminName  = localStorage.getItem('admin_name')  || 'Super Admin';
  const loginSince = localStorage.getItem('admin_login_at');

  // ── Live stats state ──────────────────────────────────────────────────────
  const [stats, setStats] = useState({ users: null, sellers: null, orders: null, revenue: null });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // ── Fetch all live stats ──────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/products')
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : [];
      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const productsData = productsRes.ok ? await productsRes.json() : [];

      const usersCount = Array.isArray(usersData) ? usersData.length : 0;
      const productsCount = Array.isArray(productsData) ? productsData.length : 0;
      const ordersList = Array.isArray(ordersData) ? ordersData : [];

      const ordersCount = ordersList.length;
      const totalRevenue = ordersList.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const recentOrdersList = [...ordersList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      setStats({ users: usersCount, products: productsCount, orders: ordersCount, revenue: totalRevenue });
      setRecentOrders(recentOrdersList);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('AdminProfile stats fetch error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Format ₹ revenue into readable form */
  const formatRevenue = (amount) => {
    if (amount >= 1_000_000) return `₹${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)     return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount}`;
  };

  /** Relative time string */
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  /** Status badge color */
  const statusColor = (status) => {
    const map = {
      'Pending':            { bg: '#fef9c3', color: '#854d0e' },
      'Accepted / Preparing':{ bg: '#dbeafe', color: '#1e40af' },
      'Delivered':          { bg: '#dcfce7', color: '#166534' },
      'Rejected':           { bg: '#fee2e2', color: '#991b1b' },
      'Assigned':           { bg: '#f3e8ff', color: '#6b21a8' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
  };

  /** Admin avatar initials */
  const initials = adminName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /** Format joined date */
  const joinedDate = loginSince
    ? new Date(loginSince).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Administrator';

  return (
    <div className="admin-profile-page">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="profile-header-clean" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="profile-title">Administrator Profile</h1>
          <p className="profile-subtitle">Live platform overview — data fetched from the database</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loadingStats}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe',
            borderRadius: '8px', padding: '8px 14px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500', opacity: loadingStats ? 0.6 : 1,
          }}
        >
          <RefreshCw size={14} style={{ animation: loadingStats ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      <div className="profile-main-content">
        {/* ── Left Column: Identity Card ─────────────────────────────────────── */}
        <div className="profile-left-col">
          <div className="profile-card card">
            {/* Avatar with initials */}
            <div className="profile-img-container">
              <div style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '38px', fontWeight: '700', color: '#fff',
                border: '3px solid #e2e8f0', boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                userSelect: 'none',
              }}>
                {initials}
              </div>
              <button className="edit-img-btn" title="Edit profile"><Edit3 size={16} /></button>
            </div>

            {/* Identity */}
            <h2 className="admin-name">{adminName}</h2>
            <p className="admin-email" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <Mail size={13} color="#94a3b8" />
              {adminEmail}
            </p>
            <span className="role-badge">Super Admin</span>

            <div className="admin-details">
              <div className="detail-row">
                <Calendar size={16} className="text-gray" />
                <span>Session started: {joinedDate}</span>
              </div>
              <div className="detail-row">
                <Activity size={16} className="text-gray" />
                <span>
                  Last refreshed:{' '}
                  {lastRefreshed
                    ? lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-primary w-full"><Edit3 size={16} /> Edit Profile</button>
              <button className="btn-outline w-full"><Key size={16} /> Change Password</button>
            </div>
          </div>

          {/* Quick summary card */}
          <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform at a Glance
            </h4>
            {[
              { label: 'Registered Users',    value: stats.users   ?? '—', icon: <Users size={15} color="#3b82f6" /> },
              { label: 'Active Sellers',       value: stats.sellers ?? '—', icon: <Store size={15} color="#a855f7" /> },
              { label: 'Total Orders (live)',  value: stats.orders  ?? '—', icon: <Package size={15} color="#ea580c" /> },
              { label: 'Platform Revenue',     value: stats.revenue !== null ? formatRevenue(stats.revenue) : '—', icon: <TrendingUp size={15} color="#16a34a" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                  {icon} {label}
                </span>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>
                  {loadingStats ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column ──────────────────────────────────────────────────── */}
        <div className="profile-right-col">
          {/* Live Stat Cards */}
          <div className="analytics-grid">
            {[
              { label: 'Users Managed',  value: stats.users,   icon: <Users size={24} />,         bg: 'bg-blue-light',   fg: 'text-blue'   },
              { label: 'Total Sellers',  value: stats.sellers, icon: <Store size={24} />,          bg: 'bg-purple-light', fg: 'text-purple' },
              { label: 'Total Orders',   value: stats.orders,  icon: <ShoppingCart size={24} />,   bg: 'bg-orange-light', fg: 'text-orange' },
              { label: 'Total Revenue',  value: stats.revenue !== null ? formatRevenue(stats.revenue) : null,
                                                                icon: <IndianRupee size={24} />,   bg: 'bg-green-light',  fg: 'text-green'  },
            ].map(({ label, value, icon, bg, fg }) => (
              <div className="stat-card" key={label}>
                <div className={`stat-icon ${bg} ${fg}`}>{icon}</div>
                <div className="stat-info">
                  <p>{label}</p>
                  <h3>
                    {loadingStats
                      ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                      : (value ?? '—')
                    }
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Orders Activity Feed */}
          <div className="recent-activity-card card mt-4">
            <div className="card-header">
              <h3>Recent Orders Activity</h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {lastRefreshed ? `Updated ${timeAgo(lastRefreshed)}` : 'Loading...'}
              </span>
            </div>

            {loadingStats ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '12px', fontSize: '14px' }}>Fetching live data...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                <ShoppingCart size={36} style={{ opacity: 0.3 }} />
                <p style={{ marginTop: '12px', fontSize: '14px' }}>No recent orders found</p>
              </div>
            ) : (
              <div className="activity-timeline">
                {recentOrders.map((order, i) => {
                  const { bg, color } = statusColor(order.status);
                  const icons = [CheckCircle, Activity, FileText, Settings, TrendingUp];
                  const IconComp = icons[i % icons.length];
                  const bgColors = ['bg-green', 'bg-blue', 'bg-purple', 'bg-orange', 'bg-blue'];
                  return (
                    <div className="activity-item" key={order._id}>
                      <div className={`act-icon ${bgColors[i % bgColors.length]}`}>
                        <IconComp size={14} />
                      </div>
                      <div className="act-content">
                        <p>
                          <strong>Order #{(order.orderId || order._id?.slice(-6).toUpperCase())}</strong>
                          <span style={{
                            display: 'inline-block', marginLeft: '8px',
                            background: bg, color, borderRadius: '4px',
                            padding: '2px 8px', fontSize: '11px', fontWeight: '600',
                          }}>
                            {order.status}
                          </span>
                        </p>
                        <span>
                          {order.user?.name ? `Customer: ${order.user.name}` : 'Guest order'} &bull; ₹{order.totalPrice}
                        </span>
                        <div className="act-time">{timeAgo(order.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
