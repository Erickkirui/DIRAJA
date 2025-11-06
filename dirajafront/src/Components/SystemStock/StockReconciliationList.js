import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  resolveReconciliation, 
  fetchStockItems, 
  processQuantityDisplay, 
  processDifferenceDisplay 
} from"./ResolveStock"


const StockReconciliationList = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveComment, setResolveComment] = useState('');
  const [resolving, setResolving] = useState(false);
  const [stockItems, setStockItems] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Memoized versions of the display functions
  const memoizedProcessQuantityDisplay = useCallback(processQuantityDisplay, []);
  const memoizedProcessDifferenceDisplay = useCallback(processDifferenceDisplay, []);

  // Fetch stock reconciliations
  const fetchReconciliations = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      // Fetch both stock items and reconciliations in parallel
      const [items, reconciliationsResponse] = await Promise.all([
        fetchStockItems(),
        axios.get('/api/diraja/stock-reconciliation', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      ]);

      setStockItems(items);

      const rawReconciliations = reconciliationsResponse.data.reconciliations || [];
      
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stock reconciliations:', err);
      setError('Error fetching stock reconciliations. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, []);

  // Reset to first page when search term or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

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

  const handleReconciliationAction = (reconciliation) => {
    setSelectedReconciliation(reconciliation);
    setResolveComment(reconciliation.comment || '');
    setShowResolveModal(true);
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

  const handleDateFilterChange = (field, value) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
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
      render: (reconciliation) => (reconciliation.shopname),
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

  const filteredReconciliations = reconciliations.filter((reconciliation) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch = 
      reconciliation.item?.toLowerCase().includes(searchString) ||
      reconciliation.shopname?.toLowerCase().includes(searchString) ||
      reconciliation.status?.toLowerCase().includes(searchString) ||
      reconciliation.comment?.toLowerCase().includes(searchString);

    // Date filter logic
    const reconciliationDate = new Date(reconciliation.created_at);
    let matchesDate = true;

    if (dateFilter.startDate) {
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (reconciliationDate < startDate) {
        matchesDate = false;
      }
    }

    if (dateFilter.endDate) {
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (reconciliationDate > endDate) {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  // Pagination calculations
  const totalItems = filteredReconciliations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredReconciliations.slice(startIndex, endIndex);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" style={{ padding: '5px' }}>
            ...
          </span>
        );
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            backgroundColor: currentPage === i ? '#007bff' : 'white',
            color: currentPage === i ? 'white' : 'black',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" style={{ padding: '5px' }}>
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            backgroundColor: 'white',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        <div>Loading stock reconciliations...</div>
      </div>
    );
  }

  return (
    <div className="stock-reconciliation-container">
      <h1>Stock reconciliation</h1>
      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid red',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {/* Search and Date Filter Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Search:
            </label>
            <input
              type="text"
              placeholder="Search items, status, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                From Date:
              </label>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                To Date:
              </label>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            
            <button
              onClick={clearDateFilter}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                height: '36px'
              }}
            >
              Clear Dates
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              {columns.map(column => (
                <th 
                  key={column.key}
                  style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    borderBottom: '2px solid #dee2e6',
                    fontWeight: '600'
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((reconciliation, index) => (
                <tr 
                  key={reconciliation.id || index}
                  style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}
                >
                  {columns.map(column => (
                    <td 
                      key={column.key}
                      style={{ 
                        padding: '12px', 
                        verticalAlign: 'top'
                      }}
                    >
                      {column.render ? column.render(reconciliation) : reconciliation[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    color: '#6c757d' 
                  }}
                >
                  No stock reconciliations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Items Per Page Selector - Moved Below Table */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label htmlFor="itemsPerPage" style={{ fontSize: '14px', fontWeight: '500' }}>
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: '14px', color: '#666' }}>
            entries per page
          </span>
        </div>

        <div style={{ fontSize: '14px', color: '#666' }}>
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          {(dateFilter.startDate || dateFilter.endDate) && ' (filtered)'}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginTop: '20px',
          padding: '10px 0'
        }}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white',
                color: currentPage === 1 ? '#6c757d' : '#007bff',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              Previous
            </button>
            
            {renderPaginationButtons()}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white',
                color: currentPage === totalPages ? '#6c757d' : '#007bff',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedReconciliation && (
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
      )}
    </div>
  );
};

export default StockReconciliationList;