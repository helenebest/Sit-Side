import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SECTION_IDS = ['how', 'featured', 'safety', 'testimonials'];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    []
  );

  const goToHomeSection = useCallback(
    (id) => {
      setMobileOpen(false);
      if (location.pathname === '/') {
        scrollToSection(id);
        return;
      }
      navigate('/');
      let attempts = 0;
      const max = 60;
      const timer = setInterval(() => {
        attempts += 1;
        const el = document.getElementById(id);
        if (el) {
          clearInterval(timer);
          scrollToSection(id);
        } else if (attempts >= max) {
          clearInterval(timer);
        }
      }, 50);
    },
    [location.pathname, navigate, scrollToSection]
  );

  useEffect(() => {
    if (location.pathname !== '/') return;
    const raw = location.hash.replace(/^#/, '');
    if (raw && SECTION_IDS.includes(raw)) {
      const t = setTimeout(() => scrollToSection(raw), 80);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location.pathname, location.hash, scrollToSection]);

  const navLinks = (
    <>
      <button type="button" className="navbar-link navbar-link--btn" onClick={() => goToHomeSection('how')}>
        How it Works
      </button>
      <button type="button" className="navbar-link navbar-link--btn" onClick={() => goToHomeSection('featured')}>
        Sitters
      </button>
      <button type="button" className="navbar-link navbar-link--btn" onClick={() => goToHomeSection('safety')}>
        Safety
      </button>
      <button type="button" className="navbar-link navbar-link--btn" onClick={() => goToHomeSection('testimonials')}>
        Reviews
      </button>
    </>
  );

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

          <nav className="navbar-nav hidden md:flex">{navLinks}</nav>

          {user ? (
            <div className="navbar-actions hidden md:flex">
              <span className="text-sm text-neutral-dark">Welcome, {user.firstName}!</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => navigate(`/${user.userType === 'admin' ? 'admin' : user.userType}`)}
              >
                {user.userType === 'admin' ? 'Admin Panel' : 'Dashboard'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={logout}>
                Sign Out
              </button>
            </div>
          ) : (
            <div className="navbar-actions hidden md:flex">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
                Sign In
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/signup')}>
                Get Started
              </button>
            </div>
          )}

          <div className="navbar-mobile">
            <button
              type="button"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="btn btn-outline btn-sm"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="navbar-mobile-panel md:hidden">
            <div className="navbar-mobile-links">{navLinks}</div>
            {user ? (
              <div className="navbar-mobile-actions">
                <span className="text-sm text-neutral-dark">Welcome, {user.firstName}!</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate(`/${user.userType === 'admin' ? 'admin' : user.userType}`);
                  }}
                >
                  {user.userType === 'admin' ? 'Admin Panel' : 'Dashboard'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="navbar-mobile-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/login');
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/signup');
                  }}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
