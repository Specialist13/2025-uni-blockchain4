import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService.js';

export function ProductForm({ product, onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    imageUrls: [],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditMode] = useState(!!product);

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price || '',
        imageUrl: product.imageUrl || '',
        imageUrls: product.imageUrls || [],
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUrlAdd = () => {
    if (formData.imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, prev.imageUrl.trim()],
        imageUrl: '',
      }));
    }
  };

  const handleImageUrlRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title || !formData.price) {
      setError('Title and price are required');
      setLoading(false);
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Price must be a positive number');
      setLoading(false);
      return;
    }

    try {
      const productData = {
        title: formData.title,
        description: formData.description || null,
        price: price,
        imageUrl: formData.imageUrls.length === 0 && formData.imageUrl ? formData.imageUrl : null,
        imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : null,
      };

      let result;
      if (isEditMode) {
        result = await productService.updateProduct(product.id, productData);
      } else {
        result = await productService.createProduct(productData);
      }

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate(`/products/${result.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form">
      <h2>{isEditMode ? 'Edit Product' : 'Create Product'}</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="6"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="price">Price (ETH) *</label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.0001"
          min="0"
          value={formData.price}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="imageUrl">Image URL</label>
        <div className="image-url-input">
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://..."
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleImageUrlAdd}
            className="btn-secondary"
            disabled={loading || !formData.imageUrl.trim()}
          >
            Add
          </button>
        </div>
        {formData.imageUrls.length > 0 && (
          <div className="image-urls-list">
            {formData.imageUrls.map((url, index) => (
              <div key={index} className="image-url-item">
                <span>{url}</span>
                <button
                  type="button"
                  onClick={() => handleImageUrlRemove(index)}
                  className="btn-remove"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Product' : 'Create Product')}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
