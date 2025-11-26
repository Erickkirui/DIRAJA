import React, { useState } from 'react';
import '../../Styles/search.css';

const SearchComponent = ({ onSearch, onClear, loading = false }) => {
  const [category, setCategory] = useState('');
  const [shopname, setShopname] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = () => {
    onSearch({
      category: category,
      shopname: shopname,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const handleClear = () => {
    setCategory('');
    setShopname('');
    setStartDate('');
    setEndDate('');
    onClear();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="funnel-search-container">
      

      <div className="funnel-filters">
        {/* <div className="filter-group">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by category..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyPress={handleKeyPress}
              className="funnel-search-input"
            />
          </div>
        </div> */}

        <div className="filter-group">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by shop..."
              value={shopname}
              onChange={(e) => setShopname(e.target.value)}
              onKeyPress={handleKeyPress}
              className="funnel-search-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <div className="date-inputs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-filter"
              placeholder="Start date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-filter"
              placeholder="End date"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button 
            onClick={handleSearch} 
            className="search-btn primary"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button 
            onClick={handleClear} 
            className="search-btn secondary"
            disabled={loading}
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchComponent;