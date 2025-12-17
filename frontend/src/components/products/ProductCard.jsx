import { Link } from 'react-router-dom';
import { formatters } from '../../utils/formatters.js';

export function ProductCard({ product }) {
  const imageUrl = product.imageUrl || product.imageUrls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';
  
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image">
        <img src={imageUrl} alt={product.title} />
        {!product.isActive && (
          <div className="product-inactive-badge">Inactive</div>
        )}
      </div>
      <div className="product-card-content">
        <h3 className="product-card-title">{product.title}</h3>
        <p className="product-card-price">{formatters.formatETH(product.price)}</p>
        {product.seller && (
          <p className="product-card-seller">
            Seller: {formatters.formatAddress(product.seller)}
          </p>
        )}
      </div>
    </Link>
  );
}
