import { useState } from 'react';

export function ProductFilters({ filters, onFilterChange }) {
  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || '',
    minPrice: filters?.minPrice || '',
    maxPrice: filters?.maxPrice || '',
    seller: filters?.seller || '',
    isActive: filters?.isActive !== undefined ? filters.isActive : true,
  });

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      minPrice: '',
      maxPrice: '',
      seller: '',
      isActive: true,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="product-filters">
      <h3>Filters</h3>
      
      <div className="form-group">
        <label htmlFor="search">Search</label>
        <input
          type="text"
          id="search"
          value={localFilters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search products..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="minPrice">Min Price (ETH)</label>
        <input
          type="number"
          id="minPrice"
          step="0.0001"
          value={localFilters.minPrice}
          onChange={(e) => handleChange('minPrice', e.target.value)}
          placeholder="0.0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxPrice">Max Price (ETH)</label>
        <input
          type="number"
          id="maxPrice"
          step="0.0001"
          value={localFilters.maxPrice}
          onChange={(e) => handleChange('maxPrice', e.target.value)}
          placeholder="0.0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="seller">Seller Address</label>
        <input
          type="text"
          id="seller"
          value={localFilters.seller}
          onChange={(e) => handleChange('seller', e.target.value)}
          placeholder="0x..."
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={localFilters.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
          />
          Active products only
        </label>
      </div>

      <button type="button" onClick={handleReset} className="btn-secondary">
        Reset Filters
      </button>
    </div>
  );
}
