import React, { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, History, TrendingUp, User, Bike, Bell, ShoppingBag, MapPin, Navigation } from 'lucide-react'
import './Delivery.css'
import { useSocket } from '../../hooks/useSocket';

function DeliveryLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(() => {
    return localStorage.getItem('rider_online') === 'true';
  });

  // Synchronize state with storage
  useEffect(() => {
    localStorage.setItem('rider_online', isOnline ? 'true' : 'false');
  }, [isOnline]);

  const handleToggle = () => {
    setIsOnline(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_logged_in');
    localStorage.removeItem('rider_online');
    navigate('/delivery/login');
  };

  const [step, setStep] = useState('IDLE');
  const [activeOrder, setActiveOrder] = useState(null);
  const [incomingTimer, setIncomingTimer] = useState(60);
  const [audioError, setAudioError] = useState(false);

  // Keep a ref to the currently playing audio so it can be stopped on demand
  const notificationAudioRef = useRef(null);

  const playNotificationSound = (order) => {
    // Stop any already-playing notification before starting a new one
    if (notificationAudioRef.current) {
      notificationAudioRef.current.pause();
      notificationAudioRef.current.currentTime = 0;
    }
    const audio = new Audio('/assets/notification.mpeg');
    notificationAudioRef.current = audio;
    audio.play().catch(e => {
      console.warn('Audio play blocked or failed:', e);
      setAudioError(true);
    });

    // OS-level Web Notification
    if ('Notification' in window) {
      const title = 'New Delivery Assigned! 🔔';
      const options = {
        body: order ? `Pickup: ${order.orderItems?.[0]?.seller?.businessName || 'Store'}\nDropoff: ${order.user?.name || 'Customer'} - ${order.shippingAddress?.address || ''}\nEarning: ₹${20 + ((order.orderItems?.length || 1) * 5)}` : 'You have a new delivery request waiting.',
        icon: '/favicon.ico',
        requireInteraction: true
      };

      if (Notification.permission === 'granted') {
        new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, options);
          }
        });
      }
    }
  };

  // Immediately silences the notification sound
  const stopNotificationSound = () => {
    if (notificationAudioRef.current) {
      notificationAudioRef.current.pause();
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current = null;
    }
  };

  const deliveryInfo = JSON.parse(localStorage.getItem('delivery_info') || '{}');
  const deliveryBoyId = deliveryInfo._id || deliveryInfo.id;
  
  console.log('[DeliveryLayout] Delivery info:', { deliveryBoyId, hasRole: true });
  
  const socket = useSocket('delivery', deliveryBoyId);

  // Bulletproof socket listener that never detaches unnecessarily
  useEffect(() => {
    if (!socket) {
      console.log('[DeliveryLayout] Socket not ready yet');
      return;
    }

    console.log('[DeliveryLayout] Socket is available, setting up listeners');

    const handleNewDeliveryRequest = (order) => {
      console.log('[DeliveryLayout] Received newDeliveryRequest event:', order);
      const currentlyOnline = localStorage.getItem('rider_online') === 'true';
      console.log('[DeliveryLayout] Currently online:', currentlyOnline);
      
      if (!currentlyOnline) {
        console.log('[DeliveryLayout] Delivery boy is offline, ignoring request');
        return;
      }

      setStep(prevStep => {
        // Only accept new requests if we are idle or already viewing an incoming request
        if (prevStep === 'IDLE' || prevStep === 'INCOMING') {
          console.log('[DeliveryLayout] Accepting new delivery request, playing notification');
          playNotificationSound(order);
          setActiveOrder(order);
          setIncomingTimer(60);
          return 'INCOMING';
        }
        console.log('[DeliveryLayout] Step is not IDLE or INCOMING:', prevStep);
        return prevStep;
      });
    };

    const handleDeliveryAssigned = (orderId) => {
      console.log('[DeliveryLayout] Received deliveryAssigned event:', orderId);
      setStep(prevStep => {
        if (prevStep === 'INCOMING') {
          setActiveOrder(prevOrder => {
            if (prevOrder && prevOrder._id === orderId) {
              // Order was assigned to someone else
              console.log('[DeliveryLayout] Active order was assigned to someone else');
              return null;
            }
            return prevOrder;
          });
          return 'IDLE'; // Reverts to IDLE if the active order was taken
        }
        return prevStep;
      });
    };

    console.log('[DeliveryLayout] Attaching socket event listeners');
    socket.on('newDeliveryRequest', handleNewDeliveryRequest);
    socket.on('deliveryAssigned', handleDeliveryAssigned);

    return () => {
      console.log('[DeliveryLayout] Cleaning up socket event listeners');
      socket.off('newDeliveryRequest', handleNewDeliveryRequest);
      socket.off('deliveryAssigned', handleDeliveryAssigned);
    };
  }, [socket]); // Minimal dependencies ensure listener is always active

  // Initial check for pending deliveries
  useEffect(() => {
    const checkPendingDeliveries = async () => {
      if (!isOnline || step !== 'IDLE' || activeOrder) return;
      try {
        const res = await fetch(`http://localhost:5000/api/orders/available-for-delivery`);
        if (res.ok) {
          const orders = await res.json();
          if (orders.length > 0) {
            setActiveOrder(orders[0]);
            setIncomingTimer(60);
            setStep('INCOMING');
            playNotificationSound(orders[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    if (localStorage.getItem('rider_logged_in') === 'true') {
      checkPendingDeliveries();
    }
  }, [isOnline]); // Intentionally omitting step/activeOrder to run on mount or online toggle

  useEffect(() => {
    let interval;
    if (step === 'INCOMING' && activeOrder) {
      interval = setInterval(() => {
        setIncomingTimer(prev => {
          if (prev <= 1) {
            handleRejectOrder('Auto-declined due to timeout');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, activeOrder]);

  const handleAcceptOrder = async () => {
    // Stop notification sound the instant the rider taps Accept
    stopNotificationSound();
    
    setStep('TO_STORE'); // Optimistically update to avoid race condition with socket
    
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${activeOrder._id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryBoyId })
      });
      
      if (res.ok) {
        navigate('/delivery/home');
      } else {
        alert('Order was already assigned to someone else!');
        setStep('IDLE');
        setActiveOrder(null);
      }
    } catch (err) {
      console.error(err);
      setStep('IDLE');
      setActiveOrder(null);
    }
  };

  const handleRejectOrder = (autoReason = '') => {
    if (!activeOrder) return;

    // Stop notification sound the instant the rider taps Decline
    stopNotificationSound();

    const orderToReject = activeOrder;
    
    // Clear state immediately to stop the timer and close the modal
    setActiveOrder(null);
    setStep('IDLE');
    setIncomingTimer(60);
    
    // Fire-and-forget the API call
    fetch(`http://localhost:5000/api/orders/${orderToReject._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: 'Delivery Rejected', 
        rejectionReason: autoReason || 'Declined by delivery boy' 
      })
    }).catch(err => console.error('Failed to reject order', err));
  };

  return (
    <div className="del-app-container">
      {/* Audio Error Banner */}
      {audioError && (
        <div style={{ background: '#ef4444', color: 'white', padding: '12px', textAlign: 'center', zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <span>Browser blocked audio notifications. Please enable them to hear order alerts.</span>
          <button 
            onClick={() => { setAudioError(false); playNotificationSound(); }} 
            style={{ background: 'white', color: '#ef4444', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Enable Audio
          </button>
          <button 
            onClick={() => setAudioError(false)} 
            style={{ background: 'transparent', color: 'white', border: '1px solid white', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dynamic Header */}
      <header className="del-header">
        <div className="del-logo" onClick={() => navigate('/delivery/home')} style={{ cursor: 'pointer' }}>
          <Bike size={24} />
          <span>QuickKart Partner</span>
        </div>

        {/* Online / Offline switch & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="duty-toggle-wrapper">
            <span className={`duty-status-badge ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isOnline} 
                onChange={handleToggle} 
              />
              <span className="slider"></span>
            </label>
          </div>
          
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '4px' }}>
            <Bell size={22} color="var(--del-text)" />
            {/* Notification Badge */}
            <span style={{ position: 'absolute', top: '2px', right: '4px', width: '8px', height: '8px', background: 'var(--del-danger)', borderRadius: '50%', border: '2px solid var(--del-card-bg)' }}></span>
          </button>
        </div>
      </header>

      {/* Main Subpage Content */}
      <main style={{ flexGrow: 1, padding: '20px 20px 90px 20px', overflowY: 'auto' }}>
        <Outlet context={{ isOnline, setIsOnline, step, setStep, activeOrder, setActiveOrder, incomingTimer, setIncomingTimer }} />
      </main>

      {/* Global INCOMING Order Alert Modal Dialog */}
      {step === 'INCOMING' && activeOrder && (
        <div className="del-alert-overlay" style={{ zIndex: 9999 }}>
          <div className="del-alert-box">
            <div className="alert-ring-animation">
              <div className="alert-pulse-circle"></div>
              <ShoppingBag size={32} />
            </div>

            <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              New Delivery Assigned!
            </div>
            <h2 className="del-font-extrabold" style={{ color: 'white', margin: '0 0 16px 0', fontSize: '26px' }}>
              ₹{20 + ((activeOrder.orderItems?.length || 1) * 5)} Delivery Earning
            </h2>

            {/* Timed countdown tracker bar */}
            <div style={{ width: '100%', height: '4px', background: '#374151', borderRadius: '2px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#f59e0b', width: `${(incomingTimer / 60) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>

            {/* Complete Trip Details */}
            <div className="del-card" style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--del-text-muted)', width: '60px' }}>Order ID:</span>
                <b style={{ color: '#fff' }}>{activeOrder.orderId || activeOrder._id.substring(0,8).toUpperCase()}</b>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--del-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--del-text-muted)' }}>Pickup:</span> <b style={{ color: '#fff' }}>{activeOrder.orderItems?.[0]?.seller?.businessName || 'Seller Store'}</b>
                  <div style={{ color: 'var(--del-text-muted)', fontSize: '11px', marginTop: '2px' }}>{activeOrder.orderItems?.[0]?.seller?.address || 'Seller Address'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <Navigation size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ color: 'var(--del-text-muted)' }}>Dropoff:</span> <b style={{ color: '#fff' }}>{activeOrder.user?.name || 'Customer'}</b>
                  <div style={{ color: 'var(--del-text-muted)', fontSize: '11px', marginTop: '2px' }}>{activeOrder.shippingAddress?.city || 'City'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--del-text-muted)', width: '60px' }}>Distance:</span>
                <b style={{ color: '#fff' }}>~{(Math.random() * 3 + 1).toFixed(1)} km (Est.)</b>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--del-text-muted)', width: '60px' }}>Payment:</span>
                <b style={{ color: '#fff' }}>{activeOrder.paymentMethod} • ₹{activeOrder.totalPrice}</b>
              </div>
              
              <div style={{ borderTop: '1px solid var(--del-card-border)', paddingTop: '8px', fontSize: '11px', color: 'var(--del-text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Items count: {activeOrder.orderItems?.length || 0}</span>
                <span>Time remaining: {incomingTimer}s</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="del-flex-col" style={{ gap: '10px' }}>
              <button className="del-btn del-btn-accent" onClick={handleAcceptOrder}>
                Accept & Start Duty
              </button>
              <button className="del-btn del-btn-danger" onClick={() => handleRejectOrder()} style={{ padding: '12px' }}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-first bottom navigation tabs */}
      <nav className="del-bottom-nav">
        <NavLink 
          to="/delivery/home" 
          className={({ isActive }) => `del-nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Duty</span>
        </NavLink>

        <NavLink 
          to="/delivery/history" 
          className={({ isActive }) => `del-nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          <span>Trips</span>
        </NavLink>

        <NavLink 
          to="/delivery/earnings" 
          className={({ isActive }) => `del-nav-item ${isActive ? 'active' : ''}`}
        >
          <TrendingUp size={20} />
          <span>Earnings</span>
        </NavLink>

        <NavLink 
          to="/delivery/profile" 
          className={({ isActive }) => `del-nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}

export default DeliveryLayout
