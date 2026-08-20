import React, { useState, useEffect } from 'react'
import { TrendingUp, Wallet, ArrowUpRight, Award, AwardIcon, Sparkles } from 'lucide-react'
import './Delivery.css'

function DeliveryEarnings() {
  const [totalEarnings, setTotalEarnings] = useState('0.00');
  const [currentTripsCount, setCurrentTripsCount] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawnSuccess, setWithdrawnSuccess] = useState(false);
  const [lastWithdrawnAmount, setLastWithdrawnAmount] = useState('0.00');

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const deliveryInfo = JSON.parse(localStorage.getItem('delivery_info') || '{}');
        const deliveryBoyId = deliveryInfo._id || deliveryInfo.id;
        if (!deliveryBoyId) return;

        const res = await fetch(`http://localhost:5000/api/orders/delivery-boy/${deliveryBoyId}`);
        if (res.ok) {
          const data = await res.json();
          const completedOrders = data.filter(order => order.status === 'Delivered');
          
          let total = 0;
          completedOrders.forEach(order => {
             total += (20 + ((order.orderItems?.length || 1) * 5));
          });

          const withdrawn = parseFloat(localStorage.getItem('rider_withdrawn') || '0');
          const remaining = Math.max(0, total - withdrawn);
          
          setTotalEarnings(remaining.toFixed(2));
          setCurrentTripsCount(completedOrders.length);
        }
      } catch (err) {
        console.error('Error fetching earnings:', err);
      }
    };
    fetchEarnings();
  }, []);

  const handleWithdraw = () => {
    if (parseFloat(totalEarnings) > 0) {
      setIsWithdrawing(true);
      setLastWithdrawnAmount(totalEarnings);
      setTimeout(() => {
        setIsWithdrawing(false);
        const previouslyWithdrawn = parseFloat(localStorage.getItem('rider_withdrawn') || '0');
        localStorage.setItem('rider_withdrawn', (previouslyWithdrawn + parseFloat(totalEarnings)).toFixed(2));
        setTotalEarnings('0.00');
        setWithdrawnSuccess(true);
        setTimeout(() => {
          setWithdrawnSuccess(false);
        }, 5000);
      }, 1800);
    }
  };

  const targetTrips = 8;
  const progressPercent = Math.min((currentTripsCount / targetTrips) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Page Title */}
      <div>
        <h2 className="del-font-extrabold" style={{ margin: 0, fontSize: '22px' }}>Partner Wallet</h2>
        <p style={{ color: 'var(--del-text-muted)', fontSize: '13px', margin: 0 }}>Manage your earnings & payouts.</p>
      </div>

      {/* Main Payout Balance Card */}
      <div className="del-card" style={{ 
        background: 'linear-gradient(135deg, #111827 0%, #064e3b 100%)', 
        border: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex', flexDirection: 'column', gap: '16px',
        padding: '24px 20px', position: 'relative', overflow: 'hidden'
      }}>
        
        {/* Glow vector effect */}
        <div style={{ 
          position: 'absolute', right: '-20px', top: '-20px', 
          width: '100px', height: '100px', borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(30px)'
        }}></div>

        <div className="del-flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={16} style={{ color: 'var(--del-primary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--del-text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Available Balance</span>
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>ACTIVE</span>
        </div>

        <div>
          <h1 className="del-font-extrabold" style={{ fontSize: '36px', margin: 0, color: 'white', letterSpacing: '-1px' }}>
            ₹{totalEarnings}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--del-text-muted)' }}>Auto bank settlement triggers daily at 12 AM.</p>
        </div>

        {/* Withdrawal Trigger */}
        <button 
          className="del-btn del-btn-primary" 
          onClick={handleWithdraw}
          disabled={parseFloat(totalEarnings) === 0 || isWithdrawing}
          style={{ 
            marginTop: '10px', padding: '12px', fontSize: '14px',
            opacity: (parseFloat(totalEarnings) === 0 || isWithdrawing) ? 0.5 : 1
          }}
        >
          {isWithdrawing ? (
            <>
              <div className="map-radar" style={{ width: '16px', height: '16px', borderWidth: '2px', position: 'static', marginRight: '8px' }}></div>
              <span>Processing Bank Transfer...</span>
            </>
          ) : (
            <>
              <ArrowUpRight size={16} />
              <span>Withdraw Instantly to Bank</span>
            </>
          )}
        </button>

      </div>

      {/* Success notification popup for cashout */}
      {withdrawnSuccess && (
        <div className="del-card" style={{ 
          background: 'rgba(16, 185, 129, 0.12)', 
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399', padding: '14px 16px', borderRadius: '12px',
          display: 'flex', gap: '10px', fontSize: '13px', alignItems: 'center'
        }}>
          <Sparkles size={20} style={{ flexShrink: 0 }} />
          <div>
            <b>₹{lastWithdrawnAmount} transferred successfully!</b> Fund will reflect in your registered Bank Account within 5 minutes.
          </div>
        </div>
      )}

      {/* Incentives Targets Progress Bar */}
      <div className="del-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="vehicle-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--del-accent)', width: '36px', height: '36px' }}>
            <Award size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Daily Target Incentive</h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--del-text-muted)' }}>Complete 8 trips to earn extra bonus ₹150.</p>
          </div>
        </div>

        {/* Progress gauge */}
        <div style={{ marginTop: '4px' }}>
          <div className="del-flex-between" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--del-text-muted)', marginBottom: '6px' }}>
            <span>Progress: {currentTripsCount} / {targetTrips} trips</span>
            <span>{progressPercent.toFixed(0)}% Done</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#374151', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--del-primary)', width: `${progressPercent}%`, transition: 'width 0.4s ease' }}></div>
          </div>
        </div>

        <div style={{ 
          fontSize: '11px', color: 'var(--del-text-muted)', 
          background: 'rgba(255,255,255,0.01)', padding: '8px 12px', 
          borderRadius: '8px', border: '1px solid var(--del-card-border)',
          textAlign: 'center'
        }}>
          ⚠️ Target refreshes daily at midnight. Offline trips are excluded.
        </div>
      </div>

    </div>
  )
}

export default DeliveryEarnings
