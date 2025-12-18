import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWeb3 } from '../../context/Web3Context.jsx';
import { formatters } from '../../utils/formatters.js';

export function CourierHeader() {
  const { user, logout } = useAuth();
  const { account, connectWallet, isConnected } = useWeb3();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <Link to="/courier/dashboard" className="header-logo" onClick={() => setMobileMenuOpen(false)}>
          <h1>Courier Portal</h1>
        </Link>

        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/courier/dashboard"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            to="/courier/available"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Available Shipments
          </Link>
          <Link
            to="/courier/pickup"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Confirm Pickup
          </Link>
          <Link
            to="/courier/delivery"
            className="nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Confirm Delivery
          </Link>
          <button onClick={handleLogout} className="nav-link nav-button">
            Logout
          </button>

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
