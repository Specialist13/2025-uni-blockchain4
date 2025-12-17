import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatters } from '../../utils/formatters.js';
import { productService } from '../../services/productService.js';
import { orderService } from '../../services/orderService.js';

export function ProductDetail({ product, onUpdate }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwner = user?.walletAddress?.toLowerCase() === product?.seller?.toLowerCase();
  const images = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls 
    : product.imageUrl 
      ? [product.imageUrl] 
      : [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleBuyNow = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (isOwner) {
      setError('You cannot buy your own product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const order = await orderService.createOrder(product.id);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/products/${product.id}/edit`);
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await productService.deactivateProduct(product.id);
      if (onUpdate) {
        onUpdate();
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to deactivate product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-detail">
      {error && <div className="error-message">{error}</div>}

      <div className="product-detail-content">
        <div className="product-detail-images">
          {images.length > 0 ? (
            <>
              <div className="product-main-image">
                <img src={images[currentImageIndex]} alt={product.title} />
              </div>
              {images.length > 1 && (
                <div className="product-thumbnails">
                  {images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${product.title} ${index + 1}`}
                      className={index === currentImageIndex ? 'active' : ''}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="product-main-image">
              <div className="no-image">No Image Available</div>
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.title}</h1>
          <p className="product-price">{formatters.formatETH(product.price)}</p>
          
          {product.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="product-meta">
            <div className="product-meta-item">
              <strong>Seller:</strong>
              <span>{formatters.formatAddress(product.seller)}</span>
            </div>
            <div className="product-meta-item">
              <strong>Status:</strong>
              <span className={product.isActive ? 'status-active' : 'status-inactive'}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {product.createdAt && (
              <div className="product-meta-item">
                <strong>Listed:</strong>
                <span>{formatters.formatDate(product.createdAt)}</span>
              </div>
            )}
          </div>

          <div className="product-actions">
            {isOwner ? (
              <>
                <button onClick={handleEdit} className="btn-primary">
                  Edit Product
                </button>
                {product.isActive && (
                  <button 
                    onClick={handleDeactivate} 
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {loading ? 'Deactivating...' : 'Deactivate'}
                  </button>
                )}
              </>
            ) : (
              product.isActive && (
                <button onClick={handleBuyNow} className="btn-primary btn-large">
                  Buy Now
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
