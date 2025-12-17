import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    walletAddress: '',
    bio: '',
    avatarUrl: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        walletAddress: user.walletAddress || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccess('Profile updated successfully');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>Profile</h2>

      <div className="profile-info">
        <div className="profile-field">
          <label>Email:</label>
          <span>{user.email}</span>
        </div>
        <div className="profile-field">
          <label>Role:</label>
          <span className="role-badge">{user.role || 'Regular User'}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="walletAddress">Wallet Address</label>
        <input
          type="text"
          id="walletAddress"
          name="walletAddress"
          value={formData.walletAddress}
          onChange={handleChange}
          placeholder="0x..."
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows="4"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="avatarUrl">Avatar URL</label>
        <input
          type="url"
          id="avatarUrl"
          name="avatarUrl"
          value={formData.avatarUrl}
          onChange={handleChange}
          placeholder="https://..."
          disabled={loading}
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
