import React, { useState } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, IndianRupee, Wallet, 
  CreditCard, PieChart, Activity, DollarSign, Download, ArrowUpRight
} from 'lucide-react';
import './AdminRevenue.css';

export default function AdminRevenue() {
  const [dateRange, setDateRange] = useState('This Month');

  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    commission: 0,
    totalTransactions: 0,
    aov: 0,
    topCategories: [],
    transactions: [],
    recentPayments: [],
    loading: true
  });

  React.useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/products')
      ]);

      const users = await usersRes.json();
      const orders = await ordersRes.json();
      const products = await productsRes.json();

      const userMap = {};
      if (Array.isArray(users)) users.forEach(u => userMap[u._id] = u);

      const categoryMap = {}; 
      if (Array.isArray(products)) products.forEach(p => categoryMap[p._id] = p.category);

      let allOrders = Array.isArray(orders) ? orders : [];

      // Deduplicate orders
      const uniqueOrdersMap = new Map();
      allOrders.forEach(o => uniqueOrdersMap.set(o._id, o));
      const uniqueOrders = Array.from(uniqueOrdersMap.values());
      uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let totalTransactions = 0;
      const categoryRevenue = {};
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      uniqueOrders.forEach(order => {
        if (order.isPaid || order.status === 'Delivered') {
          totalRevenue += order.totalPrice;
          totalTransactions += 1;
          
          const orderDate = new Date(order.createdAt);
          if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
             monthlyRevenue += order.totalPrice;
          }

          order.orderItems.forEach(item => {
             const cat = categoryMap[item.product] || 'Other';
             categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.qty);
          });
        }
      });

      const commission = totalRevenue * 0.05;
      const aov = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      const catTotal = Object.values(categoryRevenue).reduce((sum, val) => sum + val, 0) || 1;
      const topCategories = Object.entries(categoryRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => ({
           name: entry[0],
           amount: `₹${entry[1].toLocaleString()}`,
           percent: Math.round((entry[1] / catTotal) * 100)
        }));

      const transactionsList = uniqueOrders.map(order => {
         const firstItem = order.orderItems && order.orderItems[0];
         const sId = firstItem ? (firstItem.seller?._id || firstItem.seller) : null;
         return {
           id: order.orderId || order._id.substring(0, 10).toUpperCase(),
           customer: order.user?.name || userMap[order.user]?.name || 'Customer',
           seller: sellerMap[sId]?.businessName || 'Multiple Shops',
           amount: `₹${order.totalPrice.toLocaleString()}`,
           method: order.paymentMethod || 'COD',
           status: order.isPaid ? 'Paid' : (order.status === 'Cancelled' ? 'Failed' : 'Pending'),
           date: new Date(order.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
         };
      });

      const recentPayments = uniqueOrders
        .filter(o => o.isPaid || o.status === 'Delivered')
        .slice(0, 4)
        .map(order => {
           const cName = order.user?.name || userMap[order.user]?.name || 'Customer';
           const hours = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60));
           const timeStr = hours < 1 ? 'Just now' : (hours < 24 ? `${hours} hours ago` : `${Math.floor(hours/24)} days ago`);
           return {
             name: cName,
             img: `https://api.dicebear.com/7.x/initials/svg?seed=${cName}`,
             amount: `+₹${order.totalPrice.toLocaleString()}`,
             time: timeStr
           };
        });

      setRevenueData({
        totalRevenue,
        monthlyRevenue,
        commission,
        totalTransactions,
        aov,
        topCategories,
        transactions: transactionsList,
        recentPayments,
        loading: false
      });
    } catch (error) {
      console.error(error);
      setRevenueData(prev => ({ ...prev, loading: false }));
    }
  };

  if (revenueData.loading) {
    return <div className="admin-revenue-page"><div style={{padding: '50px', textAlign: 'center'}}>Loading real-time revenue data...</div></div>;
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'Paid': return 'status-paid';
      case 'Pending': return 'status-pending';
      case 'Refunded': return 'status-refunded';
      case 'Failed': return 'status-failed';
      default: return '';
    }
  };

  return (
    <div className="admin-revenue-page">
      {/* Header Section */}
      <div className="revenue-header">
        <div className="header-title">
          <h1>Revenue & Finance</h1>
          <p>Track earnings, platform commissions, and settlements</p>
        </div>
        <div className="header-actions">
          <button className="btn-outline">
            <Download size={18} /> Export Report
          </button>
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
      <div className="revenue-summary-grid">
        <div className="revenue-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-blue-light">
              <IndianRupee size={22} className="text-blue" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>+24.5%</span>
            </div>
          </div>
          <p className="stat-label">Total Revenue</p>
          <h3 className="stat-value">₹{revenueData.totalRevenue.toLocaleString()}</h3>
        </div>
        
        <div className="revenue-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-green-light">
              <Activity size={22} className="text-green" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Monthly Revenue</p>
          <h3 className="stat-value">₹{revenueData.monthlyRevenue.toLocaleString()}</h3>
        </div>

        <div className="revenue-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-purple-light">
              <PieChart size={22} className="text-purple" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Platform Commission (5%)</p>
          <h3 className="stat-value">₹{revenueData.commission.toLocaleString(undefined, {maximumFractionDigits:0})}</h3>
        </div>

        <div className="revenue-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon-wrapper bg-orange-light">
              <CreditCard size={22} className="text-orange" />
            </div>
            <div className="trend-badge positive">
              <TrendingUp size={14} /> <span>Live</span>
            </div>
          </div>
          <p className="stat-label">Total Transactions</p>
          <h3 className="stat-value">{revenueData.totalTransactions.toLocaleString()}</h3>
        </div>
      </div>

      {/* Middle Section: Charts & Insights */}
      <div className="revenue-middle-section">
        {/* Revenue Chart */}
        <div className="revenue-chart-card card">
          <div className="card-header">
            <h3>Revenue Overview</h3>
            <div className="chart-legend">
              <span className="legend-item"><div className="dot bg-blue"></div> Revenue</span>
              <span className="legend-item"><div className="dot bg-purple"></div> Commission</span>
            </div>
          </div>
          <div className="css-revenue-chart">
            <div className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar rev-bar" style={{height: '40%'}}></div>
                <div className="bar com-bar" style={{height: '10%'}}></div>
              </div>
              <span>Jan</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar rev-bar" style={{height: '60%'}}></div>
                <div className="bar com-bar" style={{height: '15%'}}></div>
              </div>
              <span>Feb</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar rev-bar" style={{height: '50%'}}></div>
                <div className="bar com-bar" style={{height: '12%'}}></div>
              </div>
              <span>Mar</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar rev-bar" style={{height: '80%'}}></div>
                <div className="bar com-bar" style={{height: '20%'}}></div>
              </div>
              <span>Apr</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar rev-bar" style={{height: '95%'}}></div>
                <div className="bar com-bar" style={{height: '24%'}}></div>
              </div>
              <span>May</span>
            </div>
          </div>
        </div>

        {/* Revenue Insights & Top Categories */}
        <div className="revenue-insights-card card">
          <div className="card-header">
            <h3>Revenue Insights</h3>
          </div>
          <div className="insights-grid">
            <div className="insight-box">
              <p>Average Order Value</p>
              <h4>₹{Math.round(revenueData.aov).toLocaleString()}</h4>
            </div>
            <div className="insight-box">
              <p>Highest Earning Day</p>
              <h4>Sunday</h4>
            </div>
            <div className="insight-box full-width">
              <p>MoM Growth</p>
              <h4 className="text-green">+18.4%</h4>
            </div>
          </div>

          <div className="card-header mt-4">
            <h3>Top Revenue Sources</h3>
          </div>
          <div className="sources-list">
            {revenueData.topCategories.map((cat, idx) => (
              <div className="source-item" key={idx}>
                <div className="source-info">
                  <span>{cat.name}</span>
                  <span className="font-bold">{cat.amount}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill bg-blue" style={{ width: `${cat.percent}%` }}></div>
                </div>
              </div>
            ))}
            {revenueData.topCategories.length === 0 && <p className="text-gray-500 text-sm">No category revenue data available.</p>}
          </div>
        </div>
      </div>

      {/* Bottom Section: Transactions & Recent Payments */}
      <div className="revenue-bottom-section">
        {/* Transactions Table */}
        <div className="transactions-card card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="btn-link">View All</button>
          </div>
          <div className="table-responsive">
            {revenueData.transactions.length === 0 ? (
              <div className="empty-state">
                <DollarSign size={48} className="empty-icon" />
                <h3>No Revenue Data Available</h3>
              </div>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Customer & Seller</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.transactions.slice(0, 10).map((txn) => (
                    <tr key={txn.id}>
                      <td className="font-bold">{txn.id}</td>
                      <td>
                        <div className="txn-people">
                          <p className="txn-customer">{txn.customer}</p>
                          <p className="txn-seller">to {txn.seller}</p>
                        </div>
                      </td>
                      <td className="txn-amount">{txn.amount}</td>
                      <td><span className="method-badge">{txn.method}</span></td>
                      <td className="txn-date">{txn.date}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Payments Sidebar */}
        <div className="recent-payments-card card">
          <div className="card-header">
            <h3>Live Payments</h3>
          </div>
          <div className="payments-list">
            {revenueData.recentPayments.map((payment, idx) => (
              <div className="payment-item" key={idx}>
                <img src={payment.img} alt={payment.name} />
                <div className="payment-info">
                  <h4>{payment.name}</h4>
                  <p>{payment.time}</p>
                </div>
                <div className="payment-amount text-green">
                  {payment.amount}
                </div>
              </div>
            ))}
            {revenueData.recentPayments.length === 0 && <p className="text-gray-500 text-sm">No recent payments.</p>}
          </div>
          <button className="btn-full-width mt-4">
            <Wallet size={16} /> View Settlement Hub
          </button>
        </div>
      </div>

    </div>
  );
}
