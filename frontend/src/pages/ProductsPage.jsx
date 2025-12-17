import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { ProductList } from '../components/products/ProductList.jsx';
import { ProductFilters } from '../components/products/ProductFilters.jsx';

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    minPrice: '',
    maxPrice: '',
    seller: '',
    isActive: true,
  });

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const search = searchParams.get('search') || filters.search;
      
      const options = {
        page,
        limit: 12,
        isActive: filters.isActive,
        search: search || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        seller: filters.seller || undefined,
      };

      const result = await productService.listProducts(options);
      setProducts(result.products || []);
      setPagination({
        page: result.pagination?.page || page,
        totalPages: result.pagination?.totalPages || 1,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);
    if (newFilters.seller) params.set('seller', newFilters.seller);
    params.set('isActive', newFilters.isActive);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1>Products</h1>
        <div className="products-controls">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'active' : ''}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'active' : ''}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="products-content">
        {showFilters && (
          <div className="products-sidebar">
            <ProductFilters filters={filters} onFilterChange={handleFilterChange} />
          </div>
        )}

        <div className="products-main">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : (
            <>
              <ProductList products={products} viewMode={viewMode} />
              
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
