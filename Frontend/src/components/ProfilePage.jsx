import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  User, 
  ShoppingBag, 
  Wallet, 
  MessageSquare, 
  Smartphone, 
  Sun, 
  EyeOff, 
  BookOpen, 
  Coffee, 
  Heart, 
  FileText, 
  Gift, 
  CreditCard, 
  Tag, 
  Receipt, 
  Share2, 
  Info, 
  Lock, 
  Bell, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Mail,
  Edit,
  CheckCircle,
  Star,
  Camera,
  Edit2,
  PlusCircle
} from 'lucide-react';

const ProfilePage = ({ setActiveTab, setActiveCategory }) => {
  const [hideSensitive, setHideSensitive] = useState(localStorage.getItem('hideSensitive') === 'true');
  const [appearance, setAppearance] = useState(localStorage.getItem('theme') === 'DARK' ? 'DARK' : 'LIGHT');
  const [showAppearanceDropdown, setShowAppearanceDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', birthday: '', avatar: '', addresses: [] });
  const [isScrolled, setIsScrolled] = useState(false);
  const [orderCount, setOrderCount] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false });
  const [securityData, setSecurityData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const containerRef = useRef(null);

  // Read user info from localStorage (set at login/register time)
  const userInfoStr = localStorage.getItem('user_info');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const userId   = userInfo ? (userInfo._id || userInfo.id) : null;
  const userName  = profileData.name || userInfo?.name || 'Your account';
  const userEmail = profileData.email || userInfo?.email || '';
  const userAvatar = profileData.avatar || userInfo?.avatar || '';

  // Mask email for display: e.g. vi***@gmail.com
  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
  };

  // Monitor scroll level to trigger transition into white sticky title bar
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setIsScrolled(containerRef.current.scrollTop > 40);
      }
    };
    const scrollContainer = containerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('hideSensitive', hideSensitive);
  }, [hideSensitive]);

  useEffect(() => {
    localStorage.setItem('theme', appearance);
    if (appearance === 'DARK') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [appearance]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/users/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.warn('Logout request failed:', e.message);
    }
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('user_info');
    setLoggingOut(false);
    setActiveTab('home');
    if (setActiveCategory) setActiveCategory('All');
    window.location.href = '/user/login';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            birthday: data.birthday || '',
            avatar: data.avatar || '',
            addresses: data.addresses || []
          });
          const updatedUserInfo = { ...userInfo, ...data };
          localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        } else if (res.status === 401) {
          handleLogout();
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfile();
  }, [userId]);

  // Fetch real order count for this user
  useEffect(() => {
    const fetchOrderCount = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setOrderCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error('Error fetching order count:', err);
      }
    };
    fetchOrderCount();
  }, [userId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUserInfo = { ...userInfo, ...data };
        localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
        setIsEditing(false);
        alert('Profile saved!');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      return alert('New passwords do not match');
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          password: securityData.newPassword
        })
      });
      if (res.ok) {
        alert('Password changed successfully!');
        setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowSecurityModal(false);
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update password');
      }
    } catch (err) {
      alert('Network error occurred');
    }
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    let updatedAddresses = [...profileData.addresses];
    
    if (addressForm.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }

    if (editingAddressIndex !== null) {
      updatedAddresses[editingAddressIndex] = addressForm;
    } else {
      updatedAddresses.push(addressForm);
    }

    if (updatedAddresses.length === 1) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ addresses: updatedAddresses })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({ ...prev, addresses: data.addresses }));
        setEditingAddressIndex(null);
        setAddressForm({ label: 'Home', street: '', city: '', state: '', pincode: '', isDefault: false });
        alert('Address saved!');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const deleteAddress = async (index) => {
    const updatedAddresses = profileData.addresses.filter((_, i) => i !== index);
    if (profileData.addresses[index].isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ addresses: updatedAddresses })
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(prev => ({ ...prev, addresses: data.addresses }));
      }
    } catch (err) {}
  };

  const handleBackToHome = () => {
    setActiveTab('home');
    if (setActiveCategory) {
      setActiveCategory('All');
    }
  };

  const handleGoToOrders = () => {
    setActiveTab('orders');
  };

  return (
    <div className="profile-page-container" ref={containerRef}>
      {/* Sticky Header Bar (Turns White + Adds 'Profile' title on Scroll) */}
      <div className={`profile-sticky-header ${isScrolled ? 'scrolled' : ''}`}>
        <button 
          className="profile-back-btn" 
          onClick={handleBackToHome}
          title="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="profile-sticky-title">Profile</span>
      </div>

      {appearance === 'DARK' ? (
        <div className="profile-page-content" style={{ marginTop: '16px' }}>
          {/* Premium Profile Card */}
          <div className="premium-profile-card">
            <div className="premium-profile-top">
              <div className="premium-avatar-wrapper" onClick={() => setIsEditing(true)}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" />
                ) : (
                  <span className="premium-avatar-letter">{userName ? userName.charAt(0) : 'U'}</span>
                )}
                <div className="premium-camera-badge">
                  <Camera size={12} />
                </div>
              </div>
              <div className="premium-user-info">
                <div className="premium-name-row">
                  <h2 className="premium-username">{userName}</h2>
                  <span className="premium-verified-badge"><CheckCircle size={12} /> Verified</span>
                </div>
                <p className="premium-user-email">{userEmail || 'us***@user.com'}</p>
                <p className="premium-user-phone">{profileData.phone || '+91 98765 43210'}</p>
                <div className="premium-member-badge">
                  <Star size={10} fill="currentColor" /> Gold Member
                </div>
              </div>
              <div className="premium-chevron">
                <ChevronRight size={20} />
              </div>
            </div>
            <div className="premium-edit-row" onClick={() => setIsEditing(true)}>
              <Edit2 size={14} /> Edit Profile
            </div>
          </div>

          {/* Premium Birthday Banner */}
          <div className="premium-birthday-banner">
            <div className="premium-birthday-icon-wrapper">
              <span className="premium-birthday-cake">🎂</span>
            </div>
            <div className="premium-birthday-content">
              <h4 className="premium-birthday-title">Add your birthday</h4>
              <p className="premium-birthday-desc">Add your birthday to get special offers and exclusive rewards.</p>
              <button className="premium-birthday-btn" onClick={() => setIsEditing(true)}>
                <PlusCircle size={14} /> Add Birthday
              </button>
            </div>
            <div className="premium-chevron">
              <ChevronRight size={20} color="#cbd5e1" />
            </div>
          </div>

          {/* Triple Action Cards Grid */}
          <div className="premium-action-grid">
            <button className="premium-action-card" onClick={handleGoToOrders}>
              <div className="premium-action-icon orders">
                <ShoppingBag size={24} />
                {orderCount !== null && orderCount > 0 && (
                  <span className="premium-order-badge">{orderCount}</span>
                )}
              </div>
              <span className="premium-action-title">Your Orders</span>
              <span className="premium-action-subtitle">{orderCount || 0} Orders</span>
            </button>
            
            <button className="premium-action-card">
              <div className="premium-action-icon wallet">
                <Wallet size={24} />
              </div>
              <span className="premium-action-title">Wallet</span>
              <span className="premium-action-subtitle">₹520</span>
            </button>

            <button className="premium-action-card">
              <div className="premium-action-icon help">
                <MessageSquare size={24} />
              </div>
              <span className="premium-action-title">Help Center</span>
              <span className="premium-action-subtitle">24/7 Support</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Yellow/Orange Top Gradient Profile Header (Light Mode) */}
          <div className="profile-header-gradient">
            <div className="profile-avatar-section">
              <div className="profile-avatar-circle" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', position: 'relative' }}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : userName && userName !== 'Your account' ? (
                  <span style={{ fontSize: '32px', fontWeight: '700', color: '#fff', textTransform: 'uppercase' }}>
                    {userName.charAt(0)}
                  </span>
                ) : (
                  <User size={46} className="profile-avatar-icon" />
                )}
                <div className="profile-edit-badge">
                  <Edit size={14} className="edit-icon" />
                </div>
              </div>
              <h2 className="profile-username" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {userName} <Edit size={14} style={{ opacity: 0.6 }} />
              </h2>
              {userEmail && (
                <p className="profile-phone" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <Mail size={13} style={{ opacity: 0.8 }} />
                  {maskEmail(userEmail)}
                </p>
              )}
            </div>
          </div>

          <div className="profile-page-content" style={{ marginTop: '0' }}>
            {/* Birthday Promotion Banner */}
            <div className="birthday-banner">
              <div className="birthday-text-col">
                <h4 className="birthday-title">{profileData.birthday ? `Birthday: ${profileData.birthday}` : 'Add your birthday'}</h4>
                <span className="birthday-action" onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>{profileData.birthday ? 'Edit details' : 'Enter details'} <ChevronRight size={12} style={{ display: 'inline', marginLeft: '2px' }} /></span>
              </div>
              <div className="birthday-cake-art">🎂</div>
            </div>

            {/* Triple Action Cards Grid */}
            <div className="profile-action-grid">
              <button className="action-card" onClick={handleGoToOrders} style={{ position: 'relative' }}>
                <div className="action-card-icon-wrapper orders">
                  <ShoppingBag size={24} />
                </div>
                <span className="action-card-label">Your orders</span>
                {orderCount !== null && orderCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: '#f59e0b', color: '#fff',
                    borderRadius: '999px', fontSize: '10px', fontWeight: '700',
                    padding: '1px 6px', lineHeight: '16px'
                  }}>{orderCount}</span>
                )}
              </button>
              
              <button className="action-card">
                <div className="action-card-icon-wrapper money">
                  <div className="wallet-rupee-container">
                    <Wallet size={24} />
                    <span className="wallet-rupee-symbol">₹</span>
                  </div>
                </div>
                <span className="action-card-label">QuickKart Money</span>
              </button>

              <button className="action-card">
                <div className="action-card-icon-wrapper help">
                  <MessageSquare size={24} />
                </div>
                <span className="action-card-label">Need help?</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Interactive App Settings Block */}
      <div className="profile-page-content" style={{ paddingTop: '0' }}>
        <div className="profile-settings-block">
          {/* App Update Info Row */}
          <div className="settings-row app-update-row">
            <Smartphone size={20} className="row-icon-left smartphone-icon" />
            <div className="settings-row-text">
              <p className="settings-row-title">App update available</p>
              <p className="settings-row-subtitle">bug fixes and improvements</p>
            </div>
            <span className="update-version-badge">v17.97.1 <ChevronRight size={12} style={{ marginLeft: '2px' }} /></span>
          </div>

          {/* Appearance Option Row */}
          <div className="settings-row appearance-row">
            <Sun size={20} className="row-icon-left sun-icon" />
            <div className="settings-row-text">
              <p className="settings-row-title">Appearance</p>
            </div>
            <div className="appearance-select-container">
              <button 
                className="appearance-select-btn"
                onClick={() => setShowAppearanceDropdown(!showAppearanceDropdown)}
              >
                <span>{appearance}</span>
                <ChevronDown size={12} style={{ marginLeft: '2px' }} />
              </button>
              {showAppearanceDropdown && (
                <div className="appearance-dropdown-menu">
                  <button onClick={() => { setAppearance('LIGHT'); setShowAppearanceDropdown(false); }}>LIGHT</button>
                  <button onClick={() => { setAppearance('DARK'); setShowAppearanceDropdown(false); }}>DARK</button>
                </div>
              )}
            </div>
          </div>

          {/* Hide Sensitive Items Row */}
          <div className="settings-row sensitive-items-row">
            <div className="sensitive-icon-wrapper">
              <EyeOff size={18} />
            </div>
            <div className="settings-row-text expand-padding">
              <p className="settings-row-title">Hide sensitive items</p>
              <p className="settings-row-subtitle line-clamp-desc">
                Sexual wellness, nicotine products and other sensitive items will be hidden. <span className="know-more-link">Know more</span>
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={hideSensitive}
                onChange={() => setHideSensitive(!hideSensitive)} 
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Section: Your Information */}
        <div className="profile-info-section">
          <h3 className="profile-section-heading">Your information</h3>
          <div className="profile-list">
            <div className="profile-list-item" onClick={() => setShowAddressModal(true)} style={{ cursor: 'pointer' }}>
              <BookOpen size={18} className="list-icon" />
              <span className="list-label">Address book</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Coffee size={18} className="list-icon" />
              <span className="list-label">Bookmarked recipes</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => setActiveTab('wishlist')} style={{ cursor: 'pointer' }}>
              <Heart size={18} className="list-icon" />
              <span className="list-label">Your wishlist</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <FileText size={18} className="list-icon" />
              <span className="list-label">GST details</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Gift size={18} className="list-icon" />
              <span className="list-label">E-gift cards</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <FileText size={18} className="list-icon" />
              <span className="list-label">Your prescriptions</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
          </div>
        </div>

        {/* Section: Payment and Coupons */}
        <div className="profile-info-section">
          <h3 className="profile-section-heading">Payment and coupons</h3>
          <div className="profile-list">
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Wallet size={18} className="list-icon" />
              <span className="list-label">QuickKart Money</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <CreditCard size={18} className="list-icon" />
              <span className="list-label">Payment settings</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Gift size={18} className="list-icon" />
              <span className="list-label">Claim Gift card</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Tag size={18} className="list-icon" />
              <span className="list-label">Your collected rewards</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
          </div>
        </div>

        {/* Section: Feeding India */}
        <div className="profile-info-section">
          <h3 className="profile-section-heading">Feeding India</h3>
          <div className="profile-list">
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <div className="feeding-india-logo">fi</div>
              <span className="list-label">Your impact</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Receipt size={18} className="list-icon" />
              <span className="list-label">Get Feeding India receipt</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
          </div>
        </div>

        {/* Section: Other Information */}
        <div className="profile-info-section">
          <h3 className="profile-section-heading">Other Information</h3>
          <div className="profile-list">
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Share2 size={18} className="list-icon" />
              <span className="list-label">Share the app</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Info size={18} className="list-icon" />
              <span className="list-label">About us</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => window.location.href = '/seller'} style={{ cursor: 'pointer' }}>
              <ShoppingBag size={18} className="list-icon" />
              <span className="list-label">Sell on QuickKart</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => setShowSecurityModal(true)} style={{ cursor: 'pointer' }}>
              <Lock size={18} className="list-icon" />
              <span className="list-label">Account privacy & Security</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div className="profile-list-item" onClick={() => alert('Feature coming soon')} style={{ cursor: 'pointer' }}>
              <Bell size={18} className="list-icon" />
              <span className="list-label">Notification preferences</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
            <div 
              className="profile-list-item log-out-item" 
              onClick={loggingOut ? undefined : handleLogout} 
              style={{ cursor: loggingOut ? 'not-allowed' : 'pointer', opacity: loggingOut ? 0.6 : 1 }}
            >
              <LogOut size={18} className="list-icon logout" />
              <span className="list-label logout">{loggingOut ? 'Logging out...' : 'Log out'}</span>
              <ChevronRight size={16} className="list-chevron" />
            </div>
          </div>
        </div>

        {/* User identity footer */}
        {userInfo && (
          <div className="profile-identity-footer">
            <span style={{ fontWeight: '600', color: '#6b7280' }}>Logged in as: </span>
            {userName}
            {userEmail && <> &bull; {maskEmail(userEmail)}</>}
          </div>
        )}

        {/* Brand Footer */}
        <div className="profile-brand-footer">
          <span className="brand-footer-logo">E-<span className="logo-accent">Commerce</span></span>
          <p className="brand-footer-version">v1.0.0</p>
        </div>
      </div>

      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>&times;</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Name</label>
                <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="form-input" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Email</label>
                <input type="email" value={profileData.email} onChange={e => setProfileData({...profileData, email: e.target.value})} className="form-input" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Phone Number</label>
                <input type="tel" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="form-input" placeholder="e.g. +91 9876543210" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Birthday</label>
                <input type="date" value={profileData.birthday} onChange={e => setProfileData({...profileData, birthday: e.target.value})} className="form-input" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Avatar Image URL</label>
                <input type="url" value={profileData.avatar} onChange={e => setProfileData({...profileData, avatar: e.target.value})} className="form-input" placeholder="https://example.com/photo.jpg" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#0c831f', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Address Book</h2>
              <button className="close-btn" onClick={() => setShowAddressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>&times;</span>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
              {profileData.addresses.map((addr, index) => (
                <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '12px', background: addr.isDefault ? '#f0fdf4' : '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{addr.label}</span>
                    <button onClick={() => deleteAddress(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Delete</button>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
              ))}

              <form onSubmit={saveAddress} style={{ marginTop: '16px', borderTop: '1px dashed #e5e7eb', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '14px' }}>Add New Address</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button type="button" key={lbl} onClick={() => setAddressForm({...addressForm, label: lbl})} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', background: addressForm.label === lbl ? '#0c831f' : '#fff', color: addressForm.label === lbl ? '#fff' : '#374151', cursor: 'pointer' }}>{lbl}</button>
                  ))}
                </div>
                <input type="text" placeholder="Street Address" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} required style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                  <input type="text" placeholder="Pincode" value={addressForm.pincode} onChange={e => setAddressForm({...addressForm, pincode: e.target.value})} required style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                </div>
                <input type="text" placeholder="State" value={addressForm.state} onChange={e => setAddressForm({...addressForm, state: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} />
                  Make default address
                </label>
                <button type="submit" style={{ padding: '12px', borderRadius: '8px', background: '#0c831f', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save Address</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Security</h2>
              <button className="close-btn" onClick={() => setShowSecurityModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>&times;</span>
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Current Password</label>
                <input type="password" minLength="6" value={securityData.currentPassword} onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>New Password</label>
                <input type="password" minLength="6" value={securityData.newPassword} onChange={e => setSecurityData({...securityData, newPassword: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Confirm New Password</label>
                <input type="password" minLength="6" value={securityData.confirmPassword} onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})} required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' }} />
              </div>
              <button type="submit" style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: '#0c831f', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Update Password</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
