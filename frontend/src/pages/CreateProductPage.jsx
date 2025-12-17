import { ProductForm } from '../components/products/ProductForm.jsx';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';

export function CreateProductPage() {
  return (
    <ProtectedRoute>
      <div className="create-product-page">
        <ProductForm />
      </div>
    </ProtectedRoute>
  );
}
