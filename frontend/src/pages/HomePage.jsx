import { useAuth } from '../context/AuthContext.jsx';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <h1>BlockTrade</h1>
      <p>Blockchain-powered peer-to-peer marketplace</p>
      {isAuthenticated() && user && (
        <div className="welcome-message">
          <p>Welcome, {user.username || user.email}!</p>
          {user.role === 'courier' && (
            <p className="role-badge">Courier</p>
          )}
        </div>
      )}
    </div>
  );
}
