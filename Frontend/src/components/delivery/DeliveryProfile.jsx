import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { User, Phone, Bike, CheckCircle, LogOut, ChevronLeft, MapPin, Mail, Clock, ShoppingBag, TrendingUp, HelpCircle, ChevronRight, Edit2 } from 'lucide-react'
import './Delivery.css'

function DeliveryProfile() {
  const navigate = useNavigate();
  // We can get isOnline from outlet context if it's rendered inside DeliveryLayout
  const context = useOutletContext();
  const isOnline = context ? context.isOnline : false;
  
  const [profileInfo, setProfileInfo] = useState({
    name: '',
    phone: '',
    email: 'rider@quickkart.com',
    address: 'Noida Sector 62',
    vehicleType: '',
    vehicleNumber: 'UP 16 AB 1234'
  });

  const [stats, setStats] = useState({
    todayEarnings: '0.00',
    totalOrders: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load from local storage
    const deliveryInfo = JSON.parse(localStorage.getItem('delivery_info') || '{}');
    const name = deliveryInfo.fullName || deliveryInfo.name || localStorage.getItem('rider_name') || 'Rahul Sharma';
    const phone = deliveryInfo.phone || '9876543210'; 
    const vehicleType = localStorage.getItem('rider_vehicle') || 'Bike';
    setProfileInfo(prev => ({ ...prev, name, phone, vehicleType }));

    const fetchStats = async () => {
      try {
        const deliveryBoyId = deliveryInfo._id || deliveryInfo.id;
        if (!deliveryBoyId) return;

        const res = await fetch(`http://localhost:5000/api/orders/delivery-boy/${deliveryBoyId}`);
        if (res.ok) {
          const data = await res.json();
          const completedOrders = data.filter(order => order.status === 'Delivered');
          
          let totalEarning = 0;
          completedOrders.forEach(order => {
             totalEarning += (20 + ((order.orderItems?.length || 1) * 5));
          });

          setStats({
            todayEarnings: totalEarning.toFixed(2),
            totalOrders: completedOrders.length
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
  }, []);

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setProfileInfo(prev => ({ ...prev, [name]: value }));
  };

  const toggleEdit = () => {
    if (isEditing) {
      // Save logic
      localStorage.setItem('rider_name', profileInfo.name);
      localStorage.setItem('rider_vehicle', profileInfo.vehicleType);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
    setIsEditing(!isEditing);
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_logged_in');
    localStorage.removeItem('rider_online');
    navigate('/delivery/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', padding: '0 8px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0', marginLeft: '-4px' }}>
          <ChevronLeft size={28} color="var(--del-text)" />
        </button>
        <h2 className="del-font-extrabold" style={{ margin: 0, fontSize: '22px' }}>Profile</h2>
      </div>

      {/* 2. Profile Top Card (Kept as a simple header) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 8px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--del-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold' }}>
          {profileInfo.name ? profileInfo.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={profileInfo.name}
              onChange={handleInfoChange}
              className="del-input"
              style={{ padding: '6px 10px', marginBottom: '4px', width: '100%' }}
            />
          ) : (
            <h3 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>{profileInfo.name}</h3>
          )}
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={profileInfo.phone}
              onChange={handleInfoChange}
              className="del-input"
              style={{ padding: '6px 10px', marginBottom: '8px', width: '100%' }}
            />
          ) : (
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--del-text-muted)' }}>+91 {profileInfo.phone}</p>
          )}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isOnline ? 'rgba(12, 131, 31, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isOnline ? '#0c831f' : '#ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? '#0c831f' : '#ef4444' }}></div>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
        <button onClick={toggleEdit} style={{ background: 'none', border: 'none', color: isSaved ? '#0c831f' : 'var(--del-primary)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '8px' }}>
          {isSaved ? <><CheckCircle size={16} /> Saved</> : isEditing ? <><CheckCircle size={16} /> Save</> : <><Edit2 size={16} /> Edit</>}
        </button>
      </div>

      {/* 3. Earnings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 8px', marginBottom: '16px' }}>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(12, 131, 31, 0.05)', borderRadius: '12px', border: '1px solid rgba(12, 131, 31, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
            <TrendingUp size={14} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>TODAY EARNING</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--del-primary)' }}>₹{stats.todayEarnings}</div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--del-card-bg)', borderRadius: '12px', border: '1px solid var(--del-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
            <ShoppingBag size={14} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>TOTAL ORDERS</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{stats.totalOrders}</div>
        </div>
      </div>

      {/* 4. Combined Info Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
        <h4 style={{ margin: '16px 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--del-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Information</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
              <Mail size={14} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>EMAIL</span>
            </div>
            {isEditing ? (
              <input type="email" name="email" value={profileInfo.email} onChange={handleInfoChange} className="del-input" style={{ padding: '6px 10px', fontSize: '13px' }} />
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{profileInfo.email}</div>
            )}
          </div>
          
          {/* Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
              <MapPin size={14} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>ADDRESS</span>
            </div>
            {isEditing ? (
              <input type="text" name="address" value={profileInfo.address} onChange={handleInfoChange} className="del-input" style={{ padding: '6px 10px', fontSize: '13px' }} />
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{profileInfo.address}</div>
            )}
          </div>

          {/* Vehicle Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
              <Bike size={14} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>VEHICLE TYPE</span>
            </div>
            {isEditing ? (
              <select name="vehicleType" value={profileInfo.vehicleType} onChange={handleInfoChange} className="del-input" style={{ padding: '6px 10px', fontSize: '13px' }}>
                <option value="Bike">Bike</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Electric">Electric</option>
              </select>
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>{profileInfo.vehicleType}</div>
            )}
          </div>

          {/* Vehicle RC */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, border: '1px solid var(--del-text-muted)', borderRadius: '2px', padding: '0 2px' }}>RC</span>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>VEHICLE NUMBER</span>
            </div>
            {isEditing ? (
              <input type="text" name="vehicleNumber" value={profileInfo.vehicleNumber} onChange={handleInfoChange} className="del-input" style={{ padding: '6px 10px', fontSize: '13px' }} />
            ) : (
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{profileInfo.vehicleNumber}</div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Quick Options (Flat List) */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px', marginTop: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: 'var(--del-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Options</h4>
        
        <div onClick={() => navigate('/delivery/history')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer', borderBottom: '1px solid var(--del-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="var(--del-text-muted)" />
            <span style={{ fontSize: '16px', fontWeight: 500 }}>Order History</span>
          </div>
          <ChevronRight size={20} color="var(--del-text-muted)" />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer', borderBottom: '1px solid var(--del-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <HelpCircle size={20} color="var(--del-text-muted)" />
            <span style={{ fontSize: '16px', fontWeight: 500 }}>Help & Support</span>
          </div>
          <ChevronRight size={20} color="var(--del-text-muted)" />
        </div>

        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogOut size={20} color="var(--del-danger)" />
            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--del-danger)' }}>Logout</span>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DeliveryProfile
