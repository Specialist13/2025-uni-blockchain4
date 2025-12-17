import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { ProductForm } from '../components/products/ProductForm.jsx';
import { productService } from '../services/productService.js';

function EditProductPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError('');
      const productData = await productService.getProduct(id);
      setProduct(productData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedProduct) => {
    navigate(`/products/${updatedProduct.id}`);
  };

  if (loading) {
    return <div className="loading">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="error-page">
        <h2>Product Not Found</h2>
        <p>{error || 'The product you are trying to edit does not exist.'}</p>
        <button onClick={() => navigate('/products')} className="btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="edit-product-page">
      <ProductForm product={product} onSuccess={handleSuccess} />
    </div>
  );
}

export function EditProductPage() {
  return (
    <ProtectedRoute>
      <EditProductPageContent />
    </ProtectedRoute>
  );
}
