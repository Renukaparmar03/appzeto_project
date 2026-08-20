import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { MapPin, Phone, CheckCircle, Navigation, Clock, ShoppingBag, ArrowRight, Play } from 'lucide-react'
import './Delivery.css'
import { useSocket } from '../../hooks/useSocket';

function DeliveryHome() {
  const { isOnline, step, setStep, activeOrder, setActiveOrder, incomingTimer } = useOutletContext();
  
  // Verification codes
  const [storeOtp, setStoreOtp] = useState('');
  const [customerOtp, setCustomerOtp] = useState('');
  
  // Error triggers
  const [otpError, setOtpError] = useState('');

  const [availableOrders, setAvailableOrders] = useState([]);

  const fetchAvailableOrders = async () => {
    if (!isOnline || step !== 'IDLE') return;
    try {
      const res = await fetch('http://localhost:5000/api/orders/available-for-delivery');
      if (res.ok) {
        const data = await res.json();
        setAvailableOrders(data);
        if (data.length > 0) {
          // If we have an available order, trigger INCOMING
          setActiveOrder(data[0]);
          setStep('INCOMING');
        }
      }
    } catch (err) {
      console.error('Error fetching delivery orders:', err);
    }
  };

  useEffect(() => {
    // Initial fetch when going online
    if (isOnline && step === 'IDLE') {
      fetchAvailableOrders();
    }
  }, [isOnline, step]);



  // Simulation controls (Keep button for manual refresh)
  const triggerOrderSimulation = () => {
    fetchAvailableOrders();
  };

  const updateOrderStatusAPI = async (status) => {
    if (!activeOrder?._id) {
      console.warn('updateOrderStatusAPI called with no active order');
      return;
    }
    try {
      await fetch(`http://localhost:5000/api/orders/${activeOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };



  const handleArriveAtStore = () => {
    setStep('AT_STORE');
    setOtpError('');
  };

  const handleConfirmStorePickup = () => {
    const requiredOtp = String(activeOrder?.pickupOtp || '1234'); // Fallback for old orders
    if (storeOtp === requiredOtp || storeOtp === '0000') { // 0000 as generic bypass
      updateOrderStatusAPI('Picked Up');
      setStep('TO_CUSTOMER');
      setOtpError('');
    } else {
      setOtpError(`Invalid Code! Hint: Use code ${requiredOtp}`);
    }
  };

  const handleArriveAtCustomer = () => {
    updateOrderStatusAPI('Out for Delivery');
    setStep('AT_CUSTOMER');
    setOtpError('');
  };

  const handleConfirmDelivery = () => {
    if (!activeOrder) {
      setOtpError('No active order found. Please refresh.');
      return;
    }
    const requiredOtp = String(activeOrder?.deliveryOtp || '5678'); // Fallback for old orders
    if (customerOtp === requiredOtp || customerOtp === '0000') {
      updateOrderStatusAPI('Delivered');
      setStep('SUCCESS');
      setOtpError('');
      
      // Save simulated trip to local storage trip history
      const savedTrips = JSON.parse(localStorage.getItem('rider_trips') || '[]');
      const newTrip = {
        id: activeOrder._id,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        store: activeOrder.orderItems[0]?.seller?.businessName || 'Seller Store',
        destination: activeOrder.shippingAddress?.city || 'Customer',
        payout: '₹' + (20 + ((activeOrder.orderItems?.length || 1) * 5)),
        itemsCount: activeOrder.orderItems.length
      };
      localStorage.setItem('rider_trips', JSON.stringify([newTrip, ...savedTrips]));

      // Update earnings
      const prevEarnings = parseFloat(localStorage.getItem('rider_earnings') || '0');
      const payoutVal = 20 + ((activeOrder.orderItems?.length || 1) * 5);
      localStorage.setItem('rider_earnings', (prevEarnings + payoutVal).toFixed(2));
      
    } else {
      setOtpError(`Invalid Code! Hint: Use code ${requiredOtp}`);
    }
  };

  const handleCompleteFlow = () => {
    setStep('IDLE');
    setActiveOrder(null);
    setStoreOtp('');
    setCustomerOtp('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* OFFLINE Screen State */}
      {!isOnline && step === 'IDLE' && (
        <div className="del-card del-text-center" style={{ padding: '40px 20px', marginTop: '20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>😴</div>
          <h2 className="del-font-extrabold" style={{ margin: '0 0 10px 0', fontSize: '22px' }}>You are Offline</h2>
          <p style={{ color: 'var(--del-text-muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '25px' }}>
            Aap abhi offline hain. Orders receive karna shuru karne ke liye top header me switch ko **Online** karein!
          </p>
          <div style={{ 
            padding: '12px', border: '1px dashed var(--del-card-border)', 
            borderRadius: '12px', background: 'rgba(255,255,255,0.01)',
            fontSize: '12px', color: 'var(--del-text-muted)'
          }}>
            Duty status is updated to server in real-time.
          </div>
        </div>
      )}

      {/* ONLINE Screen IDLE State (Pulsing Radar) */}
      {isOnline && step === 'IDLE' && (
        <div className="del-flex-col" style={{ gap: '16px' }}>
          
          {/* Radar Scanner Grid */}
          <div className="map-placeholder">
            <div className="map-grid-overlay"></div>
            <div className="map-radar"></div>
            <div className="map-radar" style={{ animationDelay: '1s' }}></div>
            <div className="map-radar" style={{ animationDelay: '2s' }}></div>
            <div className="map-rider-dot"></div>
            
            <div style={{ 
              position: 'absolute', bottom: '16px', background: 'rgba(0,0,0,0.8)', 
              padding: '6px 12px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 600, border: '1px solid var(--del-card-border)'
            }}>
              GPS Connected • Sector 62
            </div>
          </div>

          <div className="del-card del-text-center" style={{ padding: '24px 20px' }}>
            <div className="duty-status-badge online" style={{ display: 'inline-block', marginBottom: '12px' }}>
              Searching for orders...
            </div>
            <h3 className="del-font-bold" style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Waiting for Ping</h3>
            <p style={{ color: 'var(--del-text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
              Hum aapke dark store ke sabse pasandida orders assign kar rahe hain. Apne phone ka sound full rakhein.
            </p>
            
            {/* Simulation Trigger Button */}
            <button 
              className="del-btn del-btn-accent" 
              onClick={triggerOrderSimulation}
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              <Play size={16} />
              <span>Simulate New Order Alert</span>
            </button>
          </div>
        </div>
      )}



      {/* STATE: Heading to Store */}
      {step === 'TO_STORE' && (
        <div className="del-flex-col" style={{ gap: '16px' }}>
          {/* Header Step tracker */}
          <div className="del-card" style={{ padding: '14px 18px', margin: 0 }}>
            <div className="del-flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--del-primary)', fontWeight: 700 }}>STEP 1 OF 3</span>
              <span className="duty-status-badge online">Picked Up Phase</span>
            </div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Navigate to QuickKart Dark Store</h4>
          </div>

          {/* Details map & directions card */}
          <div className="del-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="del-flex-between">
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: 700 }}>{activeOrder?.orderItems?.[0]?.seller?.businessName || 'Seller Store'}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--del-text-muted)' }}>{activeOrder?.orderItems?.[0]?.seller?.address || 'Seller Address'}</p>
              </div>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder?.orderItems?.[0]?.seller?.address || '')}`} 
                target="_blank" 
                rel="noreferrer"
                className="vehicle-icon"
                style={{ background: 'var(--del-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Navigation size={18} />
              </a>
            </div>

            {/* List of packages to fetch */}
            <div style={{ borderTop: '1px solid var(--del-card-border)', paddingTop: '14px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--del-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items to Collect:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeOrder?.orderItems?.map((item, index) => (
                  <div key={index} className="del-flex-between" style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '14px' }}>{item.title}</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--del-primary)' }}>x{item.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="del-btn del-btn-primary del-mt-2" onClick={handleArriveAtStore}>
            <span>I Have Reached Store</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STATE: At Store Verification */}
      {step === 'AT_STORE' && (
        <div className="del-flex-col" style={{ gap: '16px' }}>
          <div className="del-card" style={{ padding: '14px 18px', margin: 0 }}>
            <div className="del-flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--del-primary)', fontWeight: 700 }}>STEP 2 OF 3</span>
              <span className="duty-status-badge online" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>Verification Phase</span>
            </div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Verify Store Pickup Code</h4>
          </div>

          <div className="del-card del-text-center" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px 20px' }}>
            <div>
              <ShoppingBag size={40} style={{ color: 'var(--del-primary)', marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Collect Package Box</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--del-text-muted)' }}>
                Store manager se order bag lijiye aur niche unka verify code enter karein.
              </p>
            </div>

            <div className="del-input-group" style={{ maxWidth: '280px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                maxLength={4}
                placeholder={`Store Code (Hint: ${activeOrder?.pickupOtp || '1234'})`} 
                className="del-input" 
                style={{ textAlign: 'center', fontSize: '20px', fontWeight: 800, letterSpacing: '6px' }}
                value={storeOtp}
                onChange={(e) => setStoreOtp(e.target.value.replace(/\D/g, ''))}
              />
              {otpError && <span style={{ color: 'var(--del-danger)', fontSize: '11px', marginTop: '6px', fontWeight: 600 }}>{otpError}</span>}
            </div>
          </div>

          <button className="del-btn del-btn-primary del-mt-2" onClick={handleConfirmStorePickup}>
            <CheckCircle size={18} />
            <span>Confirm Pickup OTP</span>
          </button>
        </div>
      )}

      {/* STATE: Heading to Customer */}
      {step === 'TO_CUSTOMER' && (
        <div className="del-flex-col" style={{ gap: '16px' }}>
          <div className="del-card" style={{ padding: '14px 18px', margin: 0 }}>
            <div className="del-flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--del-primary)', fontWeight: 700 }}>STEP 3 OF 3</span>
              <span className="duty-status-badge online" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>On the Way</span>
            </div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Navigate to Customer Address</h4>
          </div>

          <div className="del-card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="del-flex-between">
              <div>
                <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', color: 'var(--del-text-muted)' }}>CUSTOMER</span>
                <h3 style={{ margin: '4px 0 2px 0', fontSize: '17px', fontWeight: 700 }}>{activeOrder?.user?.name || 'Customer'}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--del-text-muted)' }}>{activeOrder?.shippingAddress?.address || 'Customer Location'}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a 
                  href={`tel:$+919876543210`}
                  className="vehicle-icon"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--del-text)' }}
                >
                  <Phone size={16} />
                </a>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeOrder?.shippingAddress?.address || '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="vehicle-icon"
                  style={{ background: 'var(--del-primary)', color: 'white' }}
                >
                  <Navigation size={16} />
                </a>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--del-card-border)', paddingTop: '14px', display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Clock size={16} style={{ color: '#f59e0b', marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', color: 'var(--del-text-muted)' }}>ETA SLA Limit</div>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>8 Mins Remaining</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                <ShoppingBag size={16} style={{ color: 'var(--del-primary)', marginBottom: '4px' }} />
                <div style={{ fontSize: '11px', color: 'var(--del-text-muted)' }}>Earning</div>
                <div style={{ fontSize: '14px', fontWeight: 800 }}>₹{20 + ((activeOrder?.orderItems?.length || 1) * 5)}</div>
              </div>
            </div>
          </div>

          <button className="del-btn del-btn-primary del-mt-2" onClick={handleArriveAtCustomer}>
            <span>I Have Reached Customer Gate</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* STATE: At Customer Verification */}
      {step === 'AT_CUSTOMER' && (
        <div className="del-flex-col" style={{ gap: '16px' }}>
          <div className="del-card" style={{ padding: '14px 18px', margin: 0 }}>
            <div className="del-flex-between" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--del-primary)', fontWeight: 700 }}>FINAL VERIFICATION</span>
              <span className="duty-status-badge online" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Doorstep Deliver</span>
            </div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Handover & Confirm Delivery</h4>
          </div>

          <div className="del-card del-text-center" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px 20px' }}>
            <div>
              <CheckCircle size={40} style={{ color: 'var(--del-primary)', marginBottom: '8px' }} />
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Ask Customer for OTP</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--del-text-muted)' }}>
                Confirm handover by entering the 4-digit code shown in customer's app dashboard.
              </p>
            </div>

            <div className="del-input-group" style={{ maxWidth: '280px', margin: '0 auto', width: '100%' }}>
              <input 
                type="text" 
                maxLength={4}
                placeholder={`Customer Code (Hint: ${activeOrder?.deliveryOtp || '5678'})`} 
                className="del-input" 
                style={{ textAlign: 'center', fontSize: '20px', fontWeight: 800, letterSpacing: '6px' }}
                value={customerOtp}
                onChange={(e) => setCustomerOtp(e.target.value.replace(/\D/g, ''))}
              />
              {otpError && <span style={{ color: 'var(--del-danger)', fontSize: '11px', marginTop: '6px', fontWeight: 600 }}>{otpError}</span>}
            </div>
          </div>

          <button className="del-btn del-btn-primary del-mt-2" onClick={handleConfirmDelivery}>
            <CheckCircle size={18} />
            <span>Confirm Safe Delivery</span>
          </button>
        </div>
      )}

      {/* STATE: Success Celebration summary */}
      {step === 'SUCCESS' && (
        <div className="del-card del-text-center animate-success" style={{ padding: '36px 20px', marginTop: '20px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.1)', border: '2px solid var(--del-primary)',
            color: 'var(--del-primary)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', margin: '0 auto 20px auto'
          }}>
            <CheckCircle size={36} />
          </div>
          
          <h2 className="del-font-extrabold" style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Order Delivered!</h2>
          <p style={{ color: 'var(--del-text-muted)', fontSize: '13px', margin: '0 0 24px 0' }}>
            Great job! You delivered the packages safe & well within SLA target.
          </p>

          <div className="del-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', textAlign: 'left', marginBottom: '24px' }}>
            <div className="del-flex-between">
              <span style={{ color: 'var(--del-text-muted)' }}>Trip Payout:</span>
              <span className="del-font-semibold">₹{20 + ((activeOrder?.orderItems?.length || 1) * 5)}</span>
            </div>
            <div className="del-flex-between">
              <span style={{ color: 'var(--del-text-muted)' }}>Time Elapsed:</span>
              <span className="del-font-semibold">6 mins 42 secs</span>
            </div>
            <div className="del-flex-between" style={{ borderTop: '1px solid var(--del-card-border)', paddingTop: '10px', fontSize: '15px' }}>
              <span style={{ fontWeight: 700 }}>Total Credited:</span>
              <span style={{ fontWeight: 800, color: 'var(--del-primary)' }}>₹{20 + ((activeOrder?.orderItems?.length || 1) * 5)}</span>
            </div>
          </div>

          <button className="del-btn del-btn-primary" onClick={handleCompleteFlow}>
            <span>Back to Active Duty</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

    </div>
  )
}

export default DeliveryHome
