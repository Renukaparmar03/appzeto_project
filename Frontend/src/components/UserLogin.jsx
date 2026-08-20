import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ShoppingBag, ArrowRight, Eye, EyeOff } from 'lucide-react';

function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      setLoading(true);
      try {
        
        const response = await fetch('http://localhost:5000/api/users/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('user_logged_in', 'true');
          localStorage.setItem('user_info', JSON.stringify(data));
          navigate('/user/home');
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('Server connection failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };



  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0fdf4', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: '#16a34a', color: 'white', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            boxShadow: '0 8px 16px rgba(22, 163, 74, 0.2)'
          }}>
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>Welcome to QuickKart</h2>
          <p style={{ color: '#15803d', margin: 0, fontSize: '14px' }}>Groceries delivered in 10 minutes</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 12px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>Password</label>
              <Link to="/reset-password?type=user" style={{ fontSize: '13px', color: '#16a34a', textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 42px 12px 42px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px',
                  boxSizing: 'border-box'
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={18} color="#9ca3af" /> : <Eye size={18} color="#9ca3af" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={!email || !password || loading}
            style={{ 
              width: '100%', padding: '14px', background: '#16a34a', color: 'white', 
              border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', opacity: (!email || !password || loading) ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {loading ? 'Logging in...' : 'Login securely'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          New to QuickKart? <Link to="/user/register" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default UserLogin;
