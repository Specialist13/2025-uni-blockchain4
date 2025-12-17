import { ProductCard } from './ProductCard.jsx';

export function ProductList({ products, viewMode = 'grid' }) {
  if (!products || products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found</p>
      </div>
    );
  }

  const className = viewMode === 'grid' ? 'product-grid' : 'product-list';

  return (
    <div className={className}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
