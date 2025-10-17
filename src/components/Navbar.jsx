import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  return (
    <header className="navbar">
      <div className="navbar-content">
        <div className="navbar-inner">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <div className="navbar-brand">
              <span className="text-primary font-extrabold">S</span>
            </div>
            <span className="navbar-brand-text">Sit Side</span>
          </div>
          
          <nav className="navbar-nav hidden md:flex">
            <a className="navbar-link" href="#how">How it Works</a>
            <a className="navbar-link" href="#featured">Sitters</a>
            <a className="navbar-link" href="#safety">Safety</a>
            <a className="navbar-link" href="#testimonials">Reviews</a>
          </nav>
          
          {user ? (
            <div className="navbar-actions hidden md:flex">
              <span className="text-sm text-neutral-dark">
                Welcome, {user.firstName}!
              </span>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/${user.userType === 'admin' ? 'admin' : user.userType}`)}
              >
                {user.userType === 'admin' ? 'Admin Panel' : 'Dashboard'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar-actions hidden md:flex">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </button>
            </div>
          )}
          
          <div className="navbar-mobile">
            <button aria-label="Open menu" className="btn btn-outline btn-sm">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;