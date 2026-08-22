import React, { useState } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, IndianRupee, ShoppingBag, 
  Users, Activity, Package, Store, Star
} from 'lucide-react';
import './AdminAnalytics.css';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('This Month');

  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    topProducts: [],
    topSellers: [],
    categories: [],
    activities: [],
    loading: true
  });

  React.useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/products')
      ]);

      const users = await usersRes.json();
      const orders = await ordersRes.json();
      const products = await productsRes.json();

      let uniqueOrders = Array.isArray(orders) ? orders : [];

      // 1. Totals
      const totalOrders = uniqueOrders.length;
      const totalRevenue = uniqueOrders.filter(o => o.isPaid || o.status === 'Delivered').reduce((sum, o) => sum + o.totalPrice, 0);

      // 2. Top Products
      const productSales = {};
      uniqueOrders.forEach(order => {
        order.orderItems.forEach(item => {
          if (!productSales[item.title]) {
            productSales[item.title] = { id: item.product, name: item.title, sold: 0, revenue: 0, img: item.image };
          }
          productSales[item.title].sold += item.qty;
          productSales[item.title].revenue += item.price * item.qty;
        });
      });
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
        .map(p => ({ ...p, revenue: `₹${p.revenue.toLocaleString()}` }));

      // 3. Top Sellers
      const sellerSales = {};
      const sellerMap = {};
      sellers.forEach(s => sellerMap[s._id] = s);
      
      uniqueOrders.forEach(order => {
        order.orderItems.forEach(item => {
          const sId = item.seller?._id || item.seller;
          if (!sellerSales[sId]) {
            const sName = sellerMap[sId]?.businessName || 'Unknown Shop';
            sellerSales[sId] = { id: sId, shop: sName, orders: 0, revenue: 0, img: sellerMap[sId]?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${sName}` };
          }
          sellerSales[sId].revenue += item.price * item.qty;
        });
        const orderSellers = new Set(order.orderItems.map(i => i.seller?._id || i.seller));
        orderSellers.forEach(sId => {
          if (sellerSales[sId]) sellerSales[sId].orders += 1;
        });
      });
      const topSellers = Object.values(sellerSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4)
        .map(s => ({ ...s, revenue: `₹${s.revenue.toLocaleString()}` }));

      // 4. Categories Distribution
      const catCount = {};
      products.forEach(p => {
        catCount[p.category] = (catCount[p.category] || 0) + 1;
      });
      const totalProds = products.length || 1;
      const colors = ['#3b82f6', '#a855f7', '#16a34a', '#f97316', '#eab308'];
      const categories = Object.entries(catCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map((entry, idx) => ({
          name: entry[0],
          percent: Math.round((entry[1] / totalProds) * 100),
          color: colors[idx % colors.length]
        }));

      // 5. Recent Activity
      const activitiesList = [];
      users.slice(0, 2).forEach(u => activitiesList.push({ id: `u-${u._id}`, timeObj: new Date(u.createdAt), text: `New user "${u.name}" joined`, type: 'store' }));
      sellers.slice(0, 2).forEach(s => activitiesList.push({ id: `s-${s._id}`, timeObj: new Date(s.createdAt), text: `New seller "${s.businessName}" joined`, type: 'store' }));
      uniqueOrders.slice(0, 3).forEach(o => activitiesList.push({ id: `o-${o._id}`, timeObj: new Date(o.createdAt), text: `Order ${o._id.substring(0,8)} placed for ₹${o.totalPrice}`, type: 'order' }));
      
      const activities = activitiesList
        .sort((a, b) => b.timeObj - a.timeObj)
        .slice(0, 5)
        .map(a => {
           const hours = Math.floor((new Date() - a.timeObj) / (1000 * 60 * 60));
           const timeStr = hours < 24 ? `${hours} hours ago` : `${Math.floor(hours/24)} days ago`;
           return { ...a, time: timeStr };
        });

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        totalUsers: users.length,
        topProducts,
        topSellers,
        categories,
        activities,
        loading: false
      });
    } catch (error) {
      console.error(error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  if (analyticsData.loading) {
    return <div className="admin-analytics-page"><div style={{padding: '50px', textAlign: 'center'}}>Loading real-time analytics...</div></div>;
  }

  return (
    <div className="admin-analytics-page">
      {/* Header Section */}
      <div className="analytics-header">
        <div className="header-title">
          <h1>Analytics Overview</h1>
          <p>Monitor your store's performance and growth</p>
        </div>
        <div className="header-actions">
          <div className="filter-dropdown">
            <Calendar size={18} className="icon" />
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary-grid">
        <div className="analytics-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-blue-light">
              <IndianRupee size={22} className="text-blue" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>+15.3%</span>
            </div>
          </div>
          <p className="stat-label">Total Revenue</p>
          <h3 className="stat-value">₹{analyticsData.totalRevenue.toLocaleString()}</h3>
        </div>
        
        <div className="analytics-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-green-light">
              <ShoppingBag size={22} className="text-green" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Total Orders</p>
          <h3 className="stat-value">{analyticsData.totalOrders.toLocaleString()}</h3>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-purple-light">
              <Users size={22} className="text-purple" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Total Users</p>
          <h3 className="stat-value">{analyticsData.totalUsers.toLocaleString()}</h3>
        </div>

        <div className="analytics-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-orange-light">
              <Activity size={22} className="text-orange" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Sales Health</p>
          <h3 className="stat-value">Good</h3>
        </div>
      </div>

      {/* Charts & Growth Section */}
      <div className="analytics-middle-section">
        <div className="chart-card card">
          <div className="card-header">
            <h3>Revenue Analytics</h3>
          </div>
          <div className="css-chart-container">
            {/* CSS-based Bar Chart */}
            <div className="bar-chart">
              <div className="bar-wrapper"><div className="bar" style={{height: '40%'}}></div><span>Jan</span></div>
              <div className="bar-wrapper"><div className="bar" style={{height: '55%'}}></div><span>Feb</span></div>
              <div className="bar-wrapper"><div className="bar" style={{height: '45%'}}></div><span>Mar</span></div>
              <div className="bar-wrapper"><div className="bar" style={{height: '70%'}}></div><span>Apr</span></div>
              <div className="bar-wrapper"><div className="bar" style={{height: '85%'}}></div><span>May</span></div>
              <div className="bar-wrapper"><div className="bar" style={{height: '60%'}}></div><span>Jun</span></div>
            </div>
          </div>
        </div>

        <div className="user-growth-card card">
          <div className="card-header">
            <h3>User Demographics</h3>
          </div>
          <div className="growth-stats">
            <div className="growth-item">
              <div className="growth-dot bg-blue"></div>
              <div className="growth-info">
                <p>New Users</p>
                <h4>{analyticsData.totalUsers}</h4>
              </div>
            </div>
            <div className="growth-item">
              <div className="growth-dot bg-green"></div>
              <div className="growth-info">
                <p>Total Orders</p>
                <h4>{analyticsData.totalOrders}</h4>
              </div>
            </div>
            <div className="growth-item">
              <div className="growth-dot bg-purple"></div>
              <div className="growth-info">
                <p>Returning Customers</p>
                <h4>64%</h4>
              </div>
            </div>
          </div>
          
          <div className="card-header mt-4">
            <h3>Top Categories</h3>
          </div>
          <div className="categories-list">
            {analyticsData.categories.map((cat, idx) => (
              <div className="category-progress-item" key={idx}>
                <div className="cat-info">
                  <span>{cat.name}</span>
                  <span>{cat.percent}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Products, Sellers, Activity */}
      <div className="analytics-bottom-section">
        {/* Top Products */}
        <div className="top-list-card card">
          <div className="card-header">
            <h3>Top Selling Products</h3>
          </div>
          <div className="list-container">
            {analyticsData.topProducts.map((prod) => (
              <div className="list-item" key={prod.id}>
                <img src={prod.img} alt={prod.name} />
                <div className="item-details">
                  <h4>{prod.name}</h4>
                  <p>{prod.sold} units sold</p>
                </div>
                <div className="item-revenue text-green font-bold">
                  {prod.revenue}
                </div>
              </div>
            ))}
            {analyticsData.topProducts.length === 0 && <p className="text-gray-500 text-sm">No product data available yet.</p>}
          </div>
        </div>

        {/* Top Sellers */}
        <div className="top-list-card card">
          <div className="card-header">
            <h3>Top Sellers</h3>
          </div>
          <div className="list-container">
            {analyticsData.topSellers.map((seller) => (
              <div className="list-item" key={seller.id}>
                <img src={seller.img} alt={seller.shop} className="rounded-full" />
                <div className="item-details">
                  <h4>{seller.shop}</h4>
                  <p>{seller.orders} orders</p>
                </div>
                <div className="item-revenue text-purple font-bold">
                  {seller.revenue}
                </div>
              </div>
            ))}
            {analyticsData.topSellers.length === 0 && <p className="text-gray-500 text-sm">No seller data available yet.</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-timeline">
            {analyticsData.activities.map((act) => (
              <div className="activity-item" key={act.id}>
                <div className={`activity-icon ${act.type}`}>
                  {act.type === 'store' && <Store size={14} />}
                  {act.type === 'payment' && <IndianRupee size={14} />}
                  {act.type === 'order' && <ShoppingBag size={14} />}
                  {act.type === 'product' && <Package size={14} />}
                </div>
                <div className="activity-details">
                  <p>{act.text}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
            {analyticsData.activities.length === 0 && <p className="text-gray-500 text-sm">No recent activities found.</p>}
          </div>
        </div>
      </div>

    </div>
  );
}
