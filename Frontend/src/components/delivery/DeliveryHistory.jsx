import React, { useState, useEffect } from 'react'
import { Calendar, ShoppingBag, MapPin, TrendingUp, RefreshCw } from 'lucide-react'
import './Delivery.css'

function DeliveryHistory() {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('Daily');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const deliveryInfo = JSON.parse(localStorage.getItem('delivery_info') || '{}');
        const deliveryBoyId = deliveryInfo._id || deliveryInfo.id;
        if (!deliveryBoyId) return;

        const res = await fetch(`http://localhost:5000/api/orders/delivery-boy/${deliveryBoyId}`);
        if (res.ok) {
          const data = await res.json();
          // Map DB orders to trip format, filtering only completed ones
          const completedOrders = data.filter(order => order.status === 'Delivered');
          const mappedTrips = completedOrders.map(order => {
            const timestamp = order.deliveredAt || order.updatedAt || order.createdAt;
            return {
              id: order._id,
              dateRaw: new Date(timestamp),
              date: new Date(timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              store: order.orderItems[0]?.seller?.businessName || 'Seller Store',
              destination: order.shippingAddress?.address + ', ' + order.shippingAddress?.city,
              payout: '₹' + (20 + ((order.orderItems?.length || 1) * 5)),
              itemsCount: order.orderItems?.length || 0,
              status: order.status
            };
          });
          setTrips(mappedTrips);
        }
      } catch (err) {
        console.error('Error fetching delivery history:', err);
      }
    };
    fetchHistory();
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem('rider_trips');
    localStorage.removeItem('rider_earnings');
    // We intentionally DO NOT clear trips here because they are fetched from the database permanently.
  };

  const getFilteredTrips = () => {
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    if (activeTab === 'Daily') {
      return trips.filter(t => t.date === today);
    }
    if (activeTab === 'Weekly') {
      // Simplistic weekly check (last 7 days could be better, but we match the mock style)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return trips.filter(t => t.dateRaw >= oneWeekAgo);
    }
    return trips; // Monthly / All Time
  };

  const filteredTrips = getFilteredTrips();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
      
      {/* Title Header */}
      <div className="del-flex-between" style={{ marginBottom: '4px' }}>
        <div>
          <h2 className="del-font-extrabold" style={{ margin: 0, fontSize: '22px' }}>Trips History</h2>
          <p style={{ color: 'var(--del-text-muted)', fontSize: '13px', margin: 0 }}>List of your deliveries.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--del-card-border)', borderRadius: '12px', padding: '4px' }}>
        {['Daily', 'Weekly', 'Monthly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              background: activeTab === tab ? 'var(--del-card-bg)' : 'transparent',
              color: activeTab === tab ? 'var(--del-primary)' : 'var(--del-text-muted)',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* History cards timeline */}
      {filteredTrips.length === 0 ? (
        <div className="del-card del-text-center" style={{ padding: '40px 20px', marginTop: '10px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h3 className="del-font-bold" style={{ margin: '0 0 6px 0' }}>No Trips {activeTab}</h3>
          <p style={{ color: 'var(--del-text-muted)', fontSize: '13px', margin: 0 }}>
            No completed trips found for this time period.
          </p>
        </div>
      ) : (
        <div className="del-flex-col" style={{ gap: '12px' }}>
          {filteredTrips.map((trip, idx) => (
            <div key={idx} className="del-card" style={{ padding: '16px 18px' }}>
              
              {/* Card Title Header */}
              <div className="del-flex-between" style={{ borderBottom: '1px solid var(--del-card-border)', paddingBottom: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} style={{ color: 'var(--del-primary)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--del-text-muted)' }}>{trip.date} • {trip.time}</span>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  background: trip.status === 'Delivered' ? 'rgba(12,131,31,0.1)' : 'rgba(59,130,246,0.1)', 
                  color: trip.status === 'Delivered' ? 'var(--del-primary)' : '#3b82f6', 
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 700 
                }}>
                  {trip.status.toUpperCase()}
                </span>
              </div>

              {/* Path layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={15} style={{ color: 'var(--del-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: 'var(--del-text-muted)', fontSize: '11px', display: 'block' }}>PICKUP STORE</span>
                    <span style={{ fontWeight: 600 }}>{trip.store}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <span style={{ color: 'var(--del-text-muted)', fontSize: '11px', display: 'block' }}>DELIVERY DROP</span>
                    <span style={{ fontWeight: 600 }}>{trip.destination}</span>
                  </div>
                </div>
              </div>

              {/* Summary line footer */}
              <div className="del-flex-between" style={{ background: 'var(--del-bg)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--del-card-border)', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--del-text-muted)' }}>
                  <ShoppingBag size={14} />
                  <span>{trip.itemsCount} Items</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={14} style={{ color: 'var(--del-primary)' }} />
                  <span style={{ fontWeight: 800, color: 'var(--del-primary)' }}>{trip.payout}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default DeliveryHistory
