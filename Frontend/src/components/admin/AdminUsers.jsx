import React, { useState } from 'react';
import { 
  Search, Filter, Eye, Ban, Trash2, X, MapPin, 
  ShoppingBag, Calendar, Phone, Mail, User
} from 'lucide-react';
import './AdminUsers.css';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      
      const [usersRes, ordersRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/orders')
      ]);
      
      const usersData = await usersRes.json();
      const allOrders = await ordersRes.json();

      // Group orders by user ID to get their total order count and most recent address
      const userOrdersMap = new Map();
      
      const ordersArray = Array.isArray(allOrders) ? allOrders : [];
      
      ordersArray.forEach(order => {
        const userId = order.user ? (order.user._id || order.user) : null;
        if (!userId) return;

        if (!userOrdersMap.has(userId)) {
          userOrdersMap.set(userId, {
            orders: 0,
            latestOrderDate: new Date(order.createdAt || 0),
            address: 'Not provided',
            customerName: order.user?.name || 'Customer',
            customerEmail: order.user?.email || 'N/A',
            customerPhone: order.user?.phone || 'Not provided'
          });
        }
        
        const userData = userOrdersMap.get(userId);
        userData.orders += 1;
        
        // Keep the newest address & date
        if (new Date(order.createdAt) >= userData.latestOrderDate) {
            userData.latestOrderDate = new Date(order.createdAt);
            userData.address = order.shippingAddress 
              ? `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}`.trim()
              : userData.address;
            if (order.user?.name) userData.customerName = order.user.name;
            if (order.user?.email) userData.customerEmail = order.user.email;
        }
      });

      // Filter and only show customers who have placed orders (orders > 0)
      const validUsersList = Array.isArray(usersData) ? usersData : [];
      
      const formattedUsers = [];
      
      // 1. Match from existing registered users who have orders
      validUsersList.forEach(u => {
        if (u.role === 'admin') return;
        const orderStats = userOrdersMap.get(u._id);
        if (orderStats && orderStats.orders > 0) {
          formattedUsers.push({
            id: u._id,
            name: u.name || orderStats.customerName || 'Customer',
            email: u.email || orderStats.customerEmail || 'No email',
            phone: u.phone || orderStats.customerPhone || 'Not provided',
            orders: orderStats.orders,
            latestOrderDate: orderStats.latestOrderDate,
            joinDate: new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: 'Active', 
            img: `https://api.dicebear.com/7.x/initials/svg?seed=${u.name || u._id}`,
            address: orderStats.address
          });
          userOrdersMap.delete(u._id); // Marked as processed
        }
      });

      // 2. Include any remaining buyers who placed orders
      userOrdersMap.forEach((stats, uId) => {
        if (stats.orders > 0) {
          formattedUsers.push({
            id: uId,
            name: stats.customerName,
            email: stats.customerEmail,
            phone: stats.customerPhone,
            orders: stats.orders,
            latestOrderDate: stats.latestOrderDate,
            joinDate: stats.latestOrderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            status: 'Active', 
            img: `https://api.dicebear.com/7.x/initials/svg?seed=${stats.customerName || uId}`,
            address: stats.address
          });
        }
      });

      // Sort by newest order first
      formattedUsers.sort((a, b) => new Date(b.latestOrderDate) - new Date(a.latestOrderDate));

      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilter = (e) => setStatusFilter(e.target.value);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Blocked': return 'status-blocked';
      case 'Pending': return 'status-pending';
      default: return '';
    }
  };

  return (
    <div className="admin-users-page">
      {/* Header Section */}
      <div className="users-header">
        <div className="header-title">
          <h1>Users</h1>
          <p>Manage and monitor customer accounts</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} className="icon" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="filter-dropdown">
            <Filter size={18} className="icon" />
            <select value={statusFilter} onChange={handleFilter}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-card card">
        <div className="table-responsive">
          {loading ? (
            <div className="empty-state">
              <div style={{ padding: '40px', color: '#666' }}>Loading real-time active users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <User size={48} className="empty-icon" />
              <h3>No Users Found</h3>
              <p>No customer data found from recent orders.</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact Info</th>
                  <th>Total Orders</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <img src={user.img} alt={user.name} />
                        <div>
                          <p className="user-name">{user.name}</p>
                          <p className="user-id">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <p>{user.email}</p>
                        <p>{user.phone}</p>
                      </div>
                    </td>
                    <td><span className="orders-count">{user.orders}</span></td>
                    <td>{user.joinDate}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" title="View Profile" onClick={() => openModal(user)}>
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon block" title="Block User">
                          <Ban size={18} />
                        </button>
                        <button className="btn-icon delete" title="Delete User">
                          <Trash2 size={18} />
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

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Profile</h2>
              <button className="close-btn" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              <div className="modal-profile-header">
                <img src={selectedUser.img} alt={selectedUser.name} className="modal-user-img" />
                <div className="modal-user-title">
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.id}</p>
                  <span className={`status-badge mt-2 ${getStatusClass(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>

              <div className="modal-info-grid">
                <div className="info-item">
                  <div className="info-icon bg-blue"><Mail size={16} /></div>
                  <div className="info-text">
                    <label>Email Address</label>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon bg-green"><Phone size={16} /></div>
                  <div className="info-text">
                    <label>Phone Number</label>
                    <p>{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon bg-purple"><ShoppingBag size={16} /></div>
                  <div className="info-text">
                    <label>Total Orders</label>
                    <p>{selectedUser.orders} completed</p>
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-icon bg-orange"><Calendar size={16} /></div>
                  <div className="info-text">
                    <label>Join Date</label>
                    <p>{selectedUser.joinDate}</p>
                  </div>
                </div>
                <div className="info-item full-width">
                  <div className="info-icon bg-gray"><MapPin size={16} /></div>
                  <div className="info-text">
                    <label>Delivery Address</label>
                    <p>{selectedUser.address}</p>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-outline-danger">
                  <Ban size={18} /> Block User
                </button>
                <button className="btn-primary" onClick={closeModal}>
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
