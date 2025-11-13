import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  resolveReconciliation, 
  fetchStockItems, 
  processQuantityDisplay, 
  processDifferenceDisplay 
} from "./ResolveStock";
import PaginationTable from '../../PaginationTable';
import SearchComponent from './SearchComponent';
import '../../Styles/expenses.css';

const StockReconciliationList = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    searchQuery: '',
    shopname: '',
    item_name: '',
    status: '',
    start_date: '',
    end_date: '',
  });
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveComment, setResolveComment] = useState('');
  const [resolving, setResolving] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const resolveModalRef = useRef(null);

  // Memoized versions of the display functions
  const memoizedProcessQuantityDisplay = useCallback(processQuantityDisplay, []);
  const memoizedProcessDifferenceDisplay = useCallback(processDifferenceDisplay, []);

  // Fetch stock reconciliations
  const fetchReconciliations = async (page = currentPage, perPage = itemsPerPage, searchFilters = filters) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      // Build params object, only include non-empty filters
      const params = {
        page,
        per_page: perPage,
        ...searchFilters
      };

      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      // Fetch both stock items and reconciliations in parallel
      const [items, reconciliationsResponse] = await Promise.all([
        fetchStockItems(),
        axios.get('/api/diraja/stock-reconciliation', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        })
      ]);

      setStockItems(items);

      const responseData = reconciliationsResponse.data;
      const rawReconciliations = responseData.reconciliations || [];
      
      // Process reconciliations to format quantities properly
      const processedReconciliations = rawReconciliations.map(reconciliation => ({
        ...reconciliation,
        formattedStockValue: memoizedProcessQuantityDisplay(
          reconciliation.item,
          reconciliation.stock_value,
          reconciliation.metric,
          items
        ),
        formattedReportValue: memoizedProcessQuantityDisplay(
          reconciliation.item,
          reconciliation.report_value,
          reconciliation.metric,
          items
        ),
        // Use special function for difference to handle negative numbers correctly
        formattedDifference: memoizedProcessDifferenceDisplay(
          reconciliation.item,
          reconciliation.difference,
          reconciliation.metric,
          items
        )
      }));

      setReconciliations(processedReconciliations);
      setCurrentPage(responseData.pagination?.page || 1);
      setTotalPages(responseData.pagination?.total_pages || 1);
      setTotalCount(responseData.pagination?.total_items || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock reconciliations:', err);
      setError('Error fetching stock reconciliations. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, [currentPage, itemsPerPage]);

  const handleSearch = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchReconciliations(1, itemsPerPage, newFilters);
  };

  const handleClearSearch = () => {
    const emptyFilters = {
      searchQuery: '',
      shopname: '',
      item_name: '',
      status: '',
      start_date: '',
      end_date: '',
    };
    setFilters(emptyFilters);
    setCurrentPage(1);
    fetchReconciliations(1, itemsPerPage, emptyFilters);
  };

  const handleReconciliationAction = (reconciliation) => {
    setSelectedReconciliation(reconciliation);
    setResolveComment(reconciliation.comment || '');
    setShowResolveModal(true);
    resolveModalRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResolve = async () => {
    if (!selectedReconciliation) return;

    setResolving(true);
    try {
      const updatedReconciliation = await resolveReconciliation(
        selectedReconciliation,
        resolveComment,
        stockItems,
        memoizedProcessQuantityDisplay,
        memoizedProcessDifferenceDisplay
      );

      setReconciliations(prevReconciliations =>
        prevReconciliations.map(item =>
          item.id === selectedReconciliation.id
            ? updatedReconciliation
            : item
        )
      );
      
      setShowResolveModal(false);
      setSelectedReconciliation(null);
      setResolveComment('');
      alert(`Successfully resolved: ${selectedReconciliation.item}`);
      
    } catch (err) {
      console.error('Error resolving reconciliation:', err);
      setError(err.message);
    } finally {
      setResolving(false);
    }
  };

  const handleCloseModal = () => {
    setShowResolveModal(false);
    setSelectedReconciliation(null);
    setResolveComment('');
  };

  // === Status Cell Styles ===
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'solved':
        return { 
          backgroundColor: '#37674c', 
          dotColor: '#46a171' 
        };
      case 'unsolved':
        return { 
          backgroundColor: '#934b45', 
          dotColor: '#852118' 
        };
      default:
        return { 
          backgroundColor: '#6c757d', 
          dotColor: '#d1d5db' 
        };
    }
  };

  // === Difference Cell Styles ===
  const getDifferenceStyle = (difference) => {
    if (difference > 0) {
      return { color: '#8850f1', fontWeight: 'normal' };
    } else if (difference < 0) {
      return { color: '#dc3545', fontWeight: 'normal' };
    } else {
      return { color: '#6c757d', fontWeight: 'normal' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      header: 'Created At',
      key: 'created_at',
      render: (reconciliation) => formatDate(reconciliation.created_at),
    },
    {
      header: 'Shop',
      key: 'shopname',
      render: (reconciliation) => reconciliation.shopname,
    },
    {
      header: 'Item Name',
      key: 'item',
      render: (reconciliation) => (
        <div style={{ maxWidth: '200px', wordWrap: 'break-word' }}>
          {reconciliation.item}
        </div>
      ),
    },
    {
      header: 'System Value',
      key: 'stock_value',
      render: (reconciliation) => (
        <div style={{ fontFamily: 'monospace' }}>
          {reconciliation.formattedStockValue}
        </div>
      ),
    },
    {
      header: 'Report Value',
      key: 'report_value',
      render: (reconciliation) => (
        <div style={{ fontFamily: 'monospace' }}>
          {reconciliation.formattedReportValue}
        </div>
      ),
    },
    {
      header: 'Difference',
      key: 'difference',
      render: (reconciliation) => (
        <span 
          style={getDifferenceStyle(reconciliation.difference)}
          className="difference-value"
        >
          {reconciliation.formattedDifference}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (reconciliation) => {
        const { backgroundColor, dotColor } = getStatusStyle(reconciliation.status);
        
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor,
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: dotColor,
              }}
            ></span>
            {reconciliation.status}
          </span>
        );
      },
    },
    {
      header: 'Comment',
      key: 'comment',
      render: (reconciliation) => (
        <div style={{ maxWidth: '150px', wordWrap: 'break-word', fontSize: '12px' }}>
          {reconciliation.comment}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (reconciliation) => (
        <button
          onClick={() => handleReconciliationAction(reconciliation)}
          disabled={reconciliation.status === 'Solved'}
          style={{
            padding: '6px 12px',
            backgroundColor: reconciliation.status === 'Solved' ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: reconciliation.status === 'Solved' ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            opacity: reconciliation.status === 'Solved' ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (reconciliation.status !== 'Solved') {
              e.target.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseOut={(e) => {
            if (reconciliation.status !== 'Solved') {
              e.target.style.backgroundColor = '#007bff';
            }
          }}
        >
          {reconciliation.status === 'Solved' ? 'Resolved' : 'Resolve'}
        </button>
      ),
    },
  ];

  // Pagination object for PaginationTable
  const pagination = {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalCount,
    totalPages,
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="stock-reconciliation-container">
      <h1>Stock Reconciliation</h1>

      {/* 🔍 Search Component */}
      <SearchComponent 
        onSearch={handleSearch}
        onClear={handleClearSearch}
        loading={loading}
        searchPlaceholder="Search items, shops, status, or comments..."
        filterConfig={[
          { key: 'shopname', label: 'Shop Name', type: 'text' },
          { key: 'item_name', label: 'Item Name', type: 'text' },
          { 
            key: 'status', 
            label: 'Status', 
            type: 'select',
            options: [
              { value: '', label: 'All Status' },
              { value: 'Solved', label: 'Solved' },
              { value: 'Unsolved', label: 'Unsolved' }
            ]
          },
          { key: 'start_date', label: 'Start Date', type: 'date' },
          { key: 'end_date', label: 'End Date', type: 'date' }
        ]}
      />

      {/* 📊 Table */}
      {loading ? (
        <div className="loading-message">Loading stock reconciliations...</div>
      ) : (
        <PaginationTable
          data={reconciliations}
          columns={columns}
          pagination={pagination}
          tableId="stock-reconciliation-table"
        />
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedReconciliation && (
        <div ref={resolveModalRef}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
              }}
            >
              <button
                onClick={handleCloseModal}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ×
              </button>

              <h3 style={{ marginBottom: '20px', color: '#333' }}>
                Resolve Reconciliation
              </h3>

              <div style={{ marginBottom: '15px' }}>
                <strong>Item:</strong> {selectedReconciliation.item}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong>Stock Value:</strong>{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {selectedReconciliation.formattedStockValue}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong>Report Value:</strong>{' '}
                <span style={{ fontFamily: 'monospace' }}>
                  {selectedReconciliation.formattedReportValue}
                </span>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <strong>Difference:</strong>{' '}
                <span 
                  style={getDifferenceStyle(selectedReconciliation.difference)}
                  className="difference-value"
                >
                  {selectedReconciliation.formattedDifference}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Comment:
                </label>
                <textarea
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                  placeholder="Add a comment explaining the resolution"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCloseModal}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: resolving ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: resolving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {resolving ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockReconciliationList;