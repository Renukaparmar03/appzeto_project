import React, { useState } from 'react';
import { 
  Search, Filter, Eye, CheckCircle, XCircle, UserX, AlertTriangle, 
  MessageSquare, ShieldAlert, AlertOctagon, X, MessageCircle, Clock,
  FileText, Image as ImageIcon
} from 'lucide-react';
import './AdminReports.css';

export default function AdminReports() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [usersRes, ordersRes] = await Promise.all([
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/orders')
      ]);

      const users = await usersRes.json();
      const orders = await ordersRes.json();

      const userMap = {};
      if (Array.isArray(users)) users.forEach(u => userMap[u._id] = u);

      const uniqueOrders = Array.isArray(orders) ? orders : [];
      uniqueOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Generate reports based on actual platform anomalies (Cancelled or Delayed)
      const cancelledOrders = uniqueOrders.filter(o => o.status === 'Cancelled');
      const delayedOrders = uniqueOrders.filter(o => o.status === 'Pending' && (new Date() - new Date(o.createdAt)) > (1000 * 60 * 60 * 24 * 1)); // Older than 1 day

      const realReports = cancelledOrders.map(order => {
         const uInfo = userMap[order.user] || { name: 'Customer' };
         const pName = order.orderItems[0]?.title || 'Unknown Product';
         return {
           id: `REP-${order._id.substring(0,8).toUpperCase()}`,
           user: uInfo.name,
           userImg: `https://api.dicebear.com/7.x/initials/svg?seed=${uInfo.name}`,
           title: `Order Cancelled: ${pName}`,
           category: 'Payment Issue',
           date: new Date(order.createdAt).toLocaleDateString('en-GB'),
           priority: 'High',
           status: 'Pending',
           desc: `This order was marked as cancelled. Need to verify if the payment was refunded. Order ID: ${order._id}`,
           orderId: order._id,
           product: pName
         };
      });

      const pendingReports = delayedOrders.map(order => {
         const uInfo = userMap[order.user] || { name: 'Customer' };
         const pName = order.orderItems[0]?.title || 'Unknown Product';
         return {
           id: `REP-${order._id.substring(0,8).toUpperCase()}-D`,
           user: uInfo.name,
           userImg: `https://api.dicebear.com/7.x/initials/svg?seed=${uInfo.name}`,
           title: `Delayed Delivery: ${pName}`,
           category: 'Delivery Issue',
           date: new Date(order.createdAt).toLocaleDateString('en-GB'),
           priority: 'Medium',
           status: 'In Review',
           desc: `This order has been pending for over 24 hours. Seller may have forgotten to update status.`,
           orderId: order._id,
           product: pName
         };
      });

      const allGeneratedReports = [...realReports, ...pendingReports];
      setReports(allGeneratedReports);

      // Generate real activities
      const realActivities = [];
      if (allGeneratedReports.length > 0) {
        realActivities.push({ id: 1, text: `New issue detected for Order ${allGeneratedReports[0].orderId.substring(0,6)}`, time: 'Recently', type: 'new' });
      }
      users.slice(0, 1).forEach(u => realActivities.push({ id: 2, text: `New user "${u.name}" joined`, time: 'Recently', type: 'resolve' }));
      sellers.slice(0, 1).forEach(s => realActivities.push({ id: 3, text: `New seller "${s.businessName}" joined`, time: 'Recently', type: 'warn' }));
      
      setActivities(realActivities);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleStatusFilter = (e) => setStatusFilter(e.target.value);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Medium': return 'badge-medium';
      case 'Low': return 'badge-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Resolved': return 'status-resolved';
      case 'In Review': return 'status-review';
      case 'Pending': return 'status-pending';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    resolved: reports.filter(r => r.status === 'Resolved').length,
    blocked: 0 // Mock since users don't have block status yet
  };

  if (loading) {
    return <div className="admin-reports-page"><div style={{padding: '50px', textAlign: 'center'}}>Scanning platform for anomalies and issues...</div></div>;
  }

  return (
    <div className="admin-reports-page">
      {/* Header Section */}
      <div className="reports-header">
        <div className="header-title">
          <h1>Reports & Complaints</h1>
          <p>Manage user issues, disputes, and moderation</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} className="icon" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="filter-dropdown">
            <Filter size={18} className="icon" />
            <select value={statusFilter} onChange={handleStatusFilter}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="reports-summary-grid">
        <div className="report-stat-card">
          <div className="stat-icon-wrapper bg-blue-light">
            <FileText size={24} className="text-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Reports</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>
        
        <div className="report-stat-card">
          <div className="stat-icon-wrapper bg-orange-light">
            <AlertTriangle size={24} className="text-orange" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Pending Reports</p>
            <h3 className="stat-value">{stats.pending}</h3>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrapper bg-green-light">
            <CheckCircle size={24} className="text-green" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Resolved</p>
            <h3 className="stat-value">{stats.resolved}</h3>
          </div>
        </div>

        <div className="report-stat-card">
          <div className="stat-icon-wrapper bg-red-light">
            <UserX size={24} className="text-red" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Blocked Users</p>
            <h3 className="stat-value">{stats.blocked}</h3>
          </div>
        </div>
      </div>

      {/* Middle Grid: Categories & Activity */}
      <div className="reports-middle-grid">
        <div className="categories-card card">
          <div className="card-header">
            <h3>Report Categories</h3>
          </div>
          <div className="category-list">
            <div className="cat-item">
              <span className="cat-name">Delivery Issue</span>
              <span className="cat-count">{reports.length > 0 ? '50%' : '0%'}</span>
            </div>
            <div className="cat-item">
              <span className="cat-name">Payment Issue</span>
              <span className="cat-count">{reports.length > 0 ? '50%' : '0%'}</span>
            </div>
            {reports.length === 0 && <p style={{color: '#666', fontSize: '14px', marginTop: '10px'}}>No current issues detected.</p>}
          </div>
        </div>

        <div className="activity-card card">
          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-timeline">
            {activities.map((act) => (
              <div className="activity-item" key={act.id}>
                <div className={`activity-icon ${act.type}`}>
                  {act.type === 'new' && <MessageSquare size={14} />}
                  {act.type === 'resolve' && <CheckCircle size={14} />}
                  {act.type === 'block' && <UserX size={14} />}
                  {act.type === 'warn' && <AlertTriangle size={14} />}
                </div>
                <div className="activity-details">
                  <p>{act.text}</p>
                  <span>{act.time}</span>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p style={{color: '#666', fontSize: '14px'}}>No recent activity.</p>}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-card card">
        <div className="table-responsive">
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <ShieldAlert size={48} className="empty-icon" />
              <h3>No Reports Found</h3>
              <p>Great! No pending issues matching your criteria.</p>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>User</th>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td className="font-bold">{report.id}</td>
                    <td>
                      <div className="user-cell">
                        <img src={report.userImg} alt={report.user} />
                        <div>
                          <p className="user-name">{report.user}</p>
                          <p className="report-date">{report.date}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="complaint-title">{report.title}</p>
                    </td>
                    <td><span className="cat-tag">{report.category}</span></td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" title="View Details" onClick={() => openModal(report)}>
                          <Eye size={18} />
                        </button>
                        <button className="btn-icon resolve" title="Resolve">
                          <CheckCircle size={18} />
                        </button>
                        <button className="btn-icon reject" title="Reject">
                          <XCircle size={18} />
                        </button>
                        <button className="btn-icon block" title="Block User">
                          <UserX size={18} />
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

      {/* Report Details Modal */}
      {isModalOpen && selectedReport && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Details</h2>
              <button className="close-btn" onClick={closeModal}><X size={24} /></button>
            </div>
            
            <div className="modal-body bg-gray-light">
              <div className="report-modal-top">
                <div>
                  <h3 className="modal-report-id">{selectedReport.id}</h3>
                  <p className="modal-report-date">Filed on {selectedReport.date}</p>
                </div>
                <div className="modal-status-badges">
                  <span className={`priority-badge large ${getPriorityClass(selectedReport.priority)}`}>
                    Priority: {selectedReport.priority}
                  </span>
                  <span className={`status-badge large ${getStatusClass(selectedReport.status)}`}>
                    Status: {selectedReport.status}
                  </span>
                </div>
              </div>

              <div className="report-details-grid">
                <div className="details-card">
                  <h4><MessageCircle size={18} className="text-blue" /> User Info</h4>
                  <div className="details-card-content user-modal-info">
                    <img src={selectedReport.userImg} alt="User" />
                    <div>
                      <p><strong>{selectedReport.user}</strong></p>
                      <p>Customer since 2024</p>
                    </div>
                  </div>
                </div>
                <div className="details-card">
                  <h4><FileText size={18} className="text-purple" /> Order / Product</h4>
                  <div className="details-card-content">
                    <p><strong>Order ID:</strong> {selectedReport.orderId}</p>
                    <p><strong>Product:</strong> {selectedReport.product}</p>
                  </div>
                </div>
                <div className="details-card">
                  <h4><AlertOctagon size={18} className="text-orange" /> Category</h4>
                  <div className="details-card-content">
                    <p><strong>{selectedReport.category}</strong></p>
                  </div>
                </div>
              </div>

              <div className="complaint-section">
                <h4>Complaint Details</h4>
                <div className="complaint-box">
                  <h5>{selectedReport.title}</h5>
                  <p>{selectedReport.desc}</p>
                </div>
              </div>

              <div className="attachments-section">
                <h4><ImageIcon size={18} className="text-gray" /> Attachments</h4>
                <div className="attachments-grid">
                  <div className="attachment-box">Screenshot_1.jpg</div>
                  <div className="attachment-box">Screenshot_2.jpg</div>
                </div>
              </div>

              <div className="report-timeline-section">
                <h4>Resolution Timeline</h4>
                <div className="timeline-vertical">
                  <div className="timeline-item completed">
                    <div className="dot"></div>
                    <div className="timeline-content">
                      <p>Report Filed</p>
                      <span>{selectedReport.date}</span>
                    </div>
                  </div>
                  <div className={`timeline-item ${['In Review', 'Resolved', 'Rejected'].includes(selectedReport.status) ? 'completed' : ''}`}>
                    <div className="dot"></div>
                    <div className="timeline-content">
                      <p>In Review by Admin</p>
                      <span>Admin assigned to case</span>
                    </div>
                  </div>
                  <div className={`timeline-item ${selectedReport.status === 'Resolved' || selectedReport.status === 'Rejected' ? 'completed' : ''}`}>
                    <div className="dot"></div>
                    <div className="timeline-content">
                      <p>Case Closed</p>
                      <span>{selectedReport.status === 'Resolved' ? 'Resolved successfully' : (selectedReport.status === 'Rejected' ? 'Rejected by admin' : 'Pending resolution')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-outline-danger">
                  <UserX size={18} /> Block User
                </button>
                <div className="right-actions">
                  <button className="btn-outline-danger">
                    <XCircle size={18} /> Reject
                  </button>
                  <button className="btn-success">
                    <CheckCircle size={18} /> Resolve Issue
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
