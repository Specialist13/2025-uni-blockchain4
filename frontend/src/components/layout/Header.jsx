import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWeb3 } from '../../context/Web3Context.jsx';
import { formatters } from '../../utils/formatters.js';
import { CourierHeader } from './CourierHeader.jsx';

export function Header() {
  const { user, isAuthenticated, logout, isCourier } = useAuth();
  const { account, connectWallet, isConnected } = useWeb3();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isCourier()) {
    return <CourierHeader />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleConnectWallet = async () => {
    await connectWallet();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="header-logo" onClick={() => setMobileMenuOpen(false)}>
          <h1>BlockTrade</h1>
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/products" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>

          {isAuthenticated() ? (
            <>
              <Link
                to="/orders"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </Link>
              <Link
                to="/products/create"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell
              </Link>
              <Link
                to="/profile"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <button onClick={handleLogout} className="nav-link nav-button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="nav-link nav-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}

          {isAuthenticated() && (
            <div className="wallet-info">
              {isConnected ? (
                <span className="wallet-address" title={account}>
                  {formatters.formatAddress(account)}
                </span>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="btn-connect-wallet"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </nav>

        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
