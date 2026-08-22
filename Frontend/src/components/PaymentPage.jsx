import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Wallet, Landmark, Banknote, ShieldCheck, Loader2 } from 'lucide-react';

const PaymentPage = ({ cart, navigate, setCart }) => {
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [loading, setLoading] = useState(false);

  const paymentMethods = [
    { id: 'UPI',    name: 'UPI',                  icon: <Landmark  size={24} color="#0c831f" />, desc: 'Google Pay, PhonePe, Paytm'     },
    { id: 'Card',   name: 'Credit / Debit Card',   icon: <CreditCard size={24} color="#333"   />, desc: 'Visa, Mastercard, RuPay'        },
    { id: 'Wallet', name: 'Wallets',               icon: <Wallet    size={24} color="#f59e0b" />, desc: 'Paytm, Amazon Pay, Mobikwik'   },
    { id: 'COD',    name: 'Cash on Delivery',      icon: <Banknote  size={24} color="#16a34a" />, desc: 'Pay at your doorstep'          },
  ];

  React.useEffect(() => {
    if (document.getElementById('razorpay-sdk')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Read logged-in user info from localStorage (set at login time) */
  const getUserInfo = () => {
    const raw = localStorage.getItem('user_info');
    if (!raw) return { userId: '000000000000000000000000', name: 'Guest', email: '' };
    const info = JSON.parse(raw);
    return {
      userId: info._id || info.id || '000000000000000000000000',
      name:   info.name  || 'Customer',
      email:  info.email || '',
    };
  };

  /** Map cart items to the shape the backend /api/orders expects */
  const buildOrderItems = () =>
    cart.map(item => ({
      product: item._id || item.id,
      title:   item.title,
      qty:     item.quantity,
      image:   item.image || item.images?.[0] || 'https://via.placeholder.com/150',
      price:   item.price,
      seller:  item.seller?._id || item.seller || item.sellerId || '000000000000000000000000',
    }));

  /** Calculate grand total (mirrors CartPage logic) */
  const calcTotal = () => {
    const itemTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = itemTotal > 0 && itemTotal < 199 ? 25 : 0;
    const handlingFee = itemTotal > 0 ? 2 : 0;
    const gst = Math.round(itemTotal * 0.05);
    return itemTotal + deliveryFee + handlingFee + gst;
  };

  // ── COD flow ─────────────────────────────────────────────────────────────────

  const handleCOD = async () => {
    const { userId } = getUserInfo();
    const res = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderItems:      buildOrderItems(),
        paymentMethod:   'COD',
        user:            userId,
        shippingAddress: { address: '123 Default St', city: 'Mumbai', postalCode: '400001' },
      }),
    });
    if (!res.ok) throw new Error('Failed to create order');
    const data = await res.json();
    const createdOrder = Array.isArray(data) ? data[0] : data;
    const orderId = createdOrder?.orderId || createdOrder?._id?.substring(0, 8).toUpperCase() || ('ORD' + Math.floor(100000 + Math.random() * 900000));
    
    // Save to local recent orders so it's always immediately visible in OrdersPage
    try {
      const prevRecent = JSON.parse(localStorage.getItem('user_recent_orders') || '[]');
      localStorage.setItem('user_recent_orders', JSON.stringify([createdOrder, ...prevRecent]));
    } catch (e) {}

    if (setCart) setCart([]);
    navigate('/user/order-success', { state: { orderId, paymentMethod: 'COD' } });
  };

  // ── Razorpay online flow ──────────────────────────────────────────────────────

  const handleRazorpay = async () => {
    const { userId, name, email } = getUserInfo();
    const grandTotal = calcTotal();

    // Step 1 – Create internal orders in our DB first
    const orderRes = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderItems:      buildOrderItems(),
        paymentMethod:   selectedMethod,
        user:            userId,
        shippingAddress: { address: '123 Default St', city: 'Mumbai', postalCode: '400001' },
      }),
    });
    if (!orderRes.ok) throw new Error('Failed to create order');
    const createdOrders = await orderRes.json();
    const orderIds = createdOrders.map(o => o._id);

    // Step 2 – Create a Razorpay order via our backend
    const rpRes = await fetch('http://localhost:5000/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: grandTotal, currency: 'INR', orderIds, userId }),
    });
    if (!rpRes.ok) throw new Error('Failed to create Razorpay order');
    const rpData = await rpRes.json();

    // Step 3 – Check Razorpay SDK is available
    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not loaded. Please check your internet connection and refresh.');
    }

    // Step 4 – Open Razorpay checkout popup
    const options = {
      key:         rpData.keyId,
      amount:      rpData.amount,        // in paise
      currency:    rpData.currency,
      name:        'RR Mart',
      description: 'Order Payment',
      order_id:    rpData.razorpayOrderId,

      // Step 5 – Verify signature on backend after payment
      handler: async (response) => {
        try {
          const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          const result = await verifyRes.json();

          if (result.success) {
            if (setCart) setCart([]);
            const displayId = createdOrders?.[0]?._id?.substring(0, 8).toUpperCase() || response.razorpay_payment_id;
            navigate('/user/order-success', { state: { orderId: displayId, paymentMethod: selectedMethod } });
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        } catch (err) {
          console.error('Verification error:', err);
          alert('Payment verification error. Please contact support.');
        }
      },

      prefill: { name, email },
      theme:   { color: '#0c831f' },

      // Handle popup dismissal
      modal: {
        ondismiss: () => {
          setLoading(false);
          alert('Payment cancelled. Your order has not been placed.');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setLoading(false);
      alert(`Payment failed: ${response.error.description}`);
    });
    rzp.open();
  };

  // ── Main handler ─────────────────────────────────────────────────────────────

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    setLoading(true);
    try {
      if (selectedMethod === 'COD') {
        await handleCOD();
      } else {
        await handleRazorpay();
        // Note: loading state reset happens inside rzp.modal.ondismiss or on error
        // On success, we navigate away so no need to reset
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.message || 'Error placing order. Please try again.');
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="payment-page" style={{ background: '#f5f7fa', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div className="header" style={{ background: '#fff', padding: '16px', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '16px' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Select Payment Method</h2>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Order Total Summary */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Amount to Pay</span>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#0c831f' }}>₹{calcTotal()}</span>
        </div>

        {/* Payment Method Selector */}
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {paymentMethods.map((method, index) => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderBottom: index !== paymentMethods.length - 1 ? '1px solid #f0f0f0' : 'none',
                background: selectedMethod === method.id ? '#f3f9f4' : '#fff',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ marginRight: '16px' }}>{method.icon}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', color: '#1a1a1a' }}>{method.name}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{method.desc}</p>
              </div>
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                border: selectedMethod === method.id ? '6px solid #0c831f' : '2px solid #ccc',
                background: '#fff', flexShrink: 0,
              }} />
            </div>
          ))}
        </div>

        {/* Razorpay badge for online methods */}
        {selectedMethod !== 'COD' && (
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '11px', color: '#999' }}>
            Secured by <span style={{ color: '#072654', fontWeight: '700' }}>Razorpay</span>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
          <ShieldCheck size={16} color="#0c831f" />
          <span>100% Safe and Secure Payments</span>
        </div>
      </div>

      {/* Fixed Pay Button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', zIndex: 100 }}>
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%', background: loading ? '#5a9e6e' : '#0c831f', color: '#fff',
            border: 'none', padding: '14px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          {loading ? (
            <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
          ) : (
            selectedMethod === 'COD' ? 'Place Order (COD)' : `Pay ₹${calcTotal()} via ${selectedMethod}`
          )}
        </button>
      </div>

      {/* Spinner keyframe (inline) */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PaymentPage;
