import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Store, Package, ShoppingCart, 
  BarChart2, IndianRupee, FileText, Settings, LogOut,
  Bell, Menu, X, Search, ChevronRight, CheckCircle, PlusCircle, ArrowUpRight, TrendingUp, Activity, Truck, Image as ImageIcon,
  Grid
} from 'lucide-react';
import './AdminApp.css';
import AdminUsers from './AdminUsers';
import AdminBanners from './AdminBanners';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminAnalytics from './AdminAnalytics';
import AdminRevenue from './AdminRevenue';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import AdminProfile from './AdminProfile';
import AdminLogin from './AdminLogin';
import AdminNotifications from './AdminNotifications';
import AdminCategories from './AdminCategories';

// Placeholder Pages

// Admin Dashboard Home
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topSellers: []
  });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          fetch('http://localhost:5000/api/products'),
          fetch('http://localhost:5000/api/orders'),
          fetch('http://localhost:5000/api/users')
        ]);
        
        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        
        const validOrders = Array.isArray(ordersData) ? ordersData : [];
        const validProducts = Array.isArray(productsData) ? productsData : [];
        const validUsers = Array.isArray(usersData) ? usersData : [];

        let totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

        const recentOrders = validOrders.slice(0, 10);
        const realUsersCount = validUsers.filter(u => u.role !== 'admin').length;

        setStats({
          totalUsers: realUsersCount,
          totalProducts: validProducts.length,
          totalOrders: validOrders.length,
          totalRevenue: totalRevenue,
          recentOrders: recentOrders,
          topProducts: validProducts.slice(0, 4)
        });
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="admin-dashboard-home">
      {/* Header Section */}
      <div className="dashboard-welcome">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Monitor your store's overall performance</p>
        </div>
        <div className="quick-actions-btns">
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading real-time data...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-icon bg-blue">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Active Customers</p>
                <h3 className="stat-value">{stats.totalUsers}</h3>
                <span className="trend positive"><ArrowUpRight size={14} /> Live Data</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-purple">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Products</p>
                <h3 className="stat-value">{stats.totalProducts || 0}</h3>
                <span className="trend positive"><ArrowUpRight size={14} /> In Catalog</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-orange">
                <ShoppingCart size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Orders</p>
                <h3 className="stat-value">{stats.totalOrders}</h3>
                <span className="trend positive"><ArrowUpRight size={14} /> Live Orders</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-green">
                <IndianRupee size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-label">Total Revenue</p>
                <h3 className="stat-value">₹{stats.totalRevenue.toLocaleString()}</h3>
                <span className="trend positive"><ArrowUpRight size={14} /> Net Gross</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Sales Overview Chart (CSS based) */}
            <div className="analytics-section card">
              <div className="card-header">
                <h3>Sales Overview</h3>
                <select className="date-select"><option>This Year</option></select>
              </div>
              <div className="chart-placeholder">
                {[40, 60, 45, 80, 55, 90, 75, 85, 65, 100, 70, 85].map((height, i) => (
                  <div className="bar-wrapper" key={i}>
                    <div className="bar" style={{height: `${height}%`}}></div>
                    <span className="month-label">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="side-col">
              <div className="quick-actions-card card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="action-buttons-grid">
                  <button className="action-btn" onClick={() => navigate('/admin/products')}>
                    <PlusCircle size={20} className="text-green" />
                    <span>+ Add Product</span>
                  </button>
                  <button className="action-btn" onClick={() => navigate('/admin/orders')}>
                    <ShoppingCart size={20} className="text-orange" />
                    <span>View Orders</span>
                  </button>
                  <button className="action-btn" onClick={() => navigate('/admin/products')}>
                    <Package size={20} className="text-purple" />
                    <span>Catalog</span>
                  </button>
                </div>
              </div>

              <div className="recent-activity card">
                <div className="card-header">
                  <h3>Recent Activity</h3>
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="act-icon bg-blue"><Store size={14} /></div>
                    <div className="act-info">
                      <p>Dashboard updated with <strong>Live Data</strong></p>
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-bottom">
            {/* Recent Orders */}
            <div className="recent-orders card">
              <div className="card-header">
                <h3>Recent Orders</h3>
                <button className="btn-text">View All</button>
              </div>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Order Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.length === 0 ? (
                      <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No orders yet</td></tr>
                    ) : (
                      stats.recentOrders.map((order, i) => (
                        <tr key={i}>
                          <td className="font-medium">{order.orderId || order._id.substring(0,8).toUpperCase()}</td>
                          <td>Customer</td>
                          <td className="font-semibold">₹{order.totalPrice.toLocaleString()}</td>
                          <td>
                            <span className={`status-badge ${
                              order.status === 'Delivered' ? 'delivered' : 
                              order.status === 'Rejected' || order.status === 'Cancelled' ? 'cancelled' : 
                              'pending'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <span className={`pay-badge ${order.isPaid ? 'paid' : 'pending'}`}>
                              {order.paymentMethod}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Products */}
            <div className="top-sellers card">
              <div className="card-header">
                <h3>Top Products</h3>
                <button className="btn-text" onClick={() => navigate('/admin/products')}>View All</button>
              </div>
              <div className="sellers-list">
                {(!stats.topProducts || stats.topProducts.length === 0) ? (
                  <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>No products yet</div>
                ) : (
                  stats.topProducts.map((prod, i) => (
                    <div className="seller-item" key={i}>
                      <img src={prod.image || 'https://placehold.co/50x50'} alt={prod.title} className="seller-img" style={{objectFit: 'cover'}} />
                      <div className="seller-info">
                        <h4>{prod.title}</h4>
                        <p>{prod.category} • Stock: {prod.stock}</p>
                      </div>
                      <div className="seller-rev">₹{(prod.discountPrice || prod.price || 0).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function AdminApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

    if (!isLoggedIn && location.pathname !== '/admin/login') {
      navigate('/admin/login');
    }

    if (isLoggedIn && (location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/login')) {
      navigate('/admin/home');
    }
    
    if (isLoggedIn) {
      const fetchCounts = () => {
        fetch('http://localhost:5000/api/orders')
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const pending = data.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING');
              setPendingOrdersCount(pending.length);
            }
          })
          .catch(err => console.error(err));
      };

      fetchCounts();
      const interval = setInterval(fetchCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [location.pathname, navigate]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/home', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Banners', path: '/admin/banners', icon: <ImageIcon size={20} /> },
    { name: 'Categories', path: '/admin/categories', icon: <Grid size={20} /> },
    { name: 'Products', path: '/admin/products', icon: <Package size={20} /> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={20} /> },
    { name: 'Revenue', path: '/admin/revenue', icon: <IndianRupee size={20} /> },
    { name: 'Reports', path: '/admin/reports', icon: <FileText size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  if (location.pathname === '/admin/login') {
    return <AdminLogin />;
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-logo">
            <div className="logo-icon">B</div>
            <h2>Admin Panel</h2>
          </div>
          <button className="close-btn md-hidden" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            if (item.isDropdown) {
              const isChildActive = item.subItems.some(sub => location.pathname.includes(sub.path));
              return (
                <div key={item.name} className="nav-dropdown">
                  <button
                    className={`nav-item ${isChildActive ? 'active' : ''}`}
                    onClick={() => toggleMenu(item.name)}
                    style={{ justifyContent: 'space-between', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight 
                      size={16} 
                      style={{ 
                        transform: openMenus[item.name] ? 'rotate(90deg)' : 'rotate(0deg)', 
                        transition: 'transform 0.2s' 
                      }} 
                    />
                  </button>
                  {openMenus[item.name] && (
                    <div className="dropdown-menu" style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '40px', marginTop: '4px' }}>
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.name}
                          className={`nav-item ${location.pathname.includes(subItem.path) ? 'active' : ''}`}
                          onClick={() => {
                            navigate(subItem.path);
                            if (window.innerWidth <= 768) setSidebarOpen(false);
                          }}
                          style={{ padding: '10px 16px', fontSize: '0.9rem', justifyContent: 'space-between', display: 'flex', width: '100%' }}
                        >
                          <span>{subItem.name}</span>
                          {subItem.badge && (
                            <span style={{
                              backgroundColor: '#ef4444', 
                              color: 'white', 
                              fontSize: '0.75rem', 
                              padding: '2px 6px', 
                              borderRadius: '10px',
                              fontWeight: '600'
                            }}>{subItem.badge}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.name}
                className={`nav-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={() => {
            localStorage.removeItem('admin_logged_in');
            navigate('/admin/login');
          }}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="menu-btn md-hidden" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <div className="search-bar md-visible">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search orders, users, sellers..." />
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" onClick={() => navigate('/admin/orders')}>
              <Bell size={20} />
              {pendingOrdersCount > 0 && (
                <span className="badge">{pendingOrdersCount}</span>
              )}
            </button>
            <div className="admin-profile" onClick={() => navigate('/admin/profile')} style={{ cursor: 'pointer' }}>
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&q=80" alt="Admin" />
              <div className="profile-info md-visible">
                <span className="name">Super Admin</span>
                <span className="role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Routes>
            <Route path="home" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="notification" element={<AdminNotifications />} />
            <Route path="" element={<Navigate to="home" replace />} />
          </Routes>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
}
