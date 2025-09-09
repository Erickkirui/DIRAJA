import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SalesFilters = ({
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  statusFilter,
  setStatusFilter,
  shopFilter,
  setShopFilter,
  onResetFilters,
}) => {
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await axios.get('api/diraja/allshops', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShops(response.data.shops || []);
      } catch (err) {
        console.error('Error fetching shops:', err);
      } finally {
        setLoadingShops(false);
      }
    };
    fetchShops();
  }, []);

  return (
    <div className="sales-filters-container">
      <div className="filters-grid">

        {/* Search Input */}
        <div className="filter-group">
          <label className="filter-label">Search</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, clerk or item"
            className="filter-input"
          />
        </div>

        {/* Date Filter */}
        <div className="filter-group">
          <label className="filter-label">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Shop Filter */}
        <div className="filter-group">
          <label className="filter-label">Shop</label>
          <select
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
            className="filter-select"
            disabled={loadingShops}
          >
            <option value="">All Shops</option>
            {shops.map((shop) => (
              <option key={shop.shop_id} value={shop.shop_id}>
                {shop.shopname}
              </option>
            ))}
          </select>
          {loadingShops && (
            <p className="text-sm text-gray-500 mt-1">Loading shops...</p>
          )}
        </div>

        {/* Sort Field */}
        <div className="filter-group">
          <label className="filter-label">Sort By</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="filter-select"
          >
            <option value="created_at">Date</option>
            <option value="total_amount_paid">Total Amount</option>
          </select>
        </div>

        {/* Sort Direction */}
        <div className="filter-group">
          <label className="filter-label">Order</label>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            className="filter-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="reset-button-container">
          <button
            onClick={onResetFilters}
            className="reset-button"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesFilters;
