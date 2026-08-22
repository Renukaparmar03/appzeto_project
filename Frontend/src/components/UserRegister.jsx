import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ShoppingBag, ArrowRight, User, Mail } from 'lucide-react';

function UserRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '') });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.fullName) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone
        }),
      });
      
      const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('user_logged_in', 'true');
          localStorage.setItem('user_info', JSON.stringify(data));
          navigate('/user/home');
        } else {
          alert(data.message || 'Registration failed');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('Server connection failed. Please try again.');
      } finally {
        setLoading(false);
      }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0fdf4', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px 0' }}>
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
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534', margin: '0 0 8px 0' }}>Create Account</h2>
          <p style={{ color: '#15803d', margin: 0, fontSize: '14px' }}>Join E-Commerce for best online shopping</p>
        </div>

        <form onSubmit={handleRegister} style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 12px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                name="fullName"
                placeholder="John Doe" 
                value={formData.fullName}
                onChange={handleChange}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Mobile Number</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '16px', color: '#6b7280', fontSize: '15px', fontWeight: 600 }}>+91</span>
              <input 
                type="tel" 
                name="phone"
                maxLength={10}
                placeholder="Enter 10 digit number" 
                value={formData.phone}
                onChange={handleChange}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 54px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                name="email"
                placeholder="user@example.com" 
                value={formData.email}
                onChange={handleChange}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                name="password"
                placeholder="Create a secure password" 
                value={formData.password}
                onChange={handleChange}
                style={{ 
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', 
                  border: '1px solid #d1d5db', outline: 'none', fontSize: '15px', boxSizing: 'border-box'
                }}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={formData.phone.length !== 10 || loading}
            style={{ 
              width: '100%', padding: '14px', background: '#16a34a', color: 'white', 
              border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', opacity: (formData.phone.length !== 10 || loading) ? 0.7 : 1, transition: 'all 0.2s'
            }}
          >
            {loading ? 'Creating account...' : 'Register securely'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
          Already have an account? <Link to="/user/login" style={{ color: '#16a34a', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default UserRegister;
