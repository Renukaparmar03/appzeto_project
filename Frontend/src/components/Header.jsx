import React from 'react';
import { User, Wallet, MapPin } from 'lucide-react';

const Header = ({ setActiveTab, setActiveCategory }) => {
  return (
    <header className="header">
      <div className="header-container">
        <div 
          className="logo" 
          onClick={() => {
            setActiveTab && setActiveTab('home');
            setActiveCategory && setActiveCategory('All');
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-text">E-<span className="logo-accent">Commerce</span></span>
        </div>
        
        <div className="header-actions">
          <div className="action-item location">
            <MapPin size={20} />
            <span className="action-label">New Delhi</span>
          </div>
          <div className="action-item wallet">
            <Wallet size={20} />
            <span className="action-label">₹500</span>
          </div>
          <div className="action-item profile" onClick={() => setActiveTab && setActiveTab('profile')} style={{ cursor: 'pointer' }}>
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
