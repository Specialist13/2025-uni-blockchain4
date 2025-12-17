import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { productService } from '../services/productService.js';
import { ProductList } from '../components/products/ProductList.jsx';

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      const result = await productService.listProducts({
        limit: 8,
        isActive: true,
      });
      setProducts(result.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

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

      <div className="home-search">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="search-input"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <Link to="/products" className="btn-secondary">Browse All Products</Link>
      </div>

      <div className="home-featured">
        <h2>Featured Products</h2>
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : (
          <>
            <ProductList products={products} viewMode="grid" />
            {products.length === 0 && (
              <div className="empty-state">
                <p>No products available yet</p>
                {isAuthenticated() && (
                  <Link to="/products/create" className="btn-primary">
                    Create First Product
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
