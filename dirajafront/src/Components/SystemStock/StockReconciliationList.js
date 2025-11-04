import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';

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

  // Fetch stock reconciliations
  const fetchReconciliations = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      const response = await axios.get('/api/diraja/stock-reconciliation', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setReconciliations(response.data.reconciliations || []);
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

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return typeof value === 'number' ? value.toFixed(3) : value;
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
      return { color: '#28a745', fontWeight: '600' }; // Green for positive
    } else if (difference < 0) {
      return { color: '#dc3545', fontWeight: '600' }; // Red for negative
    } else {
      return { color: '#6c757d', fontWeight: '600' }; // Gray for zero
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
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      // Update the reconciliation - you may need to adjust the API endpoint and payload
      const response = await axios.put(
        `/api/diraja/stock-reconciliation/${selectedReconciliation.id}`,
        {
          comment: 'resolved', // Update comment to "resolved"
          status: 'Solved', // Update status to "Solved"
          // Include other required fields if needed by your API
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Update local state
      setReconciliations(prevReconciliations =>
        prevReconciliations.map(item =>
          item.id === selectedReconciliation.id
            ? {
                ...item,
                comment: 'resolved',
                status: 'Solved'
              }
            : item
        )
      );

      // Close modal and reset states
      setShowResolveModal(false);
      setSelectedReconciliation(null);
      setResolveComment('');
      
      // Show success message
      alert(`Successfully resolved: ${selectedReconciliation.item}`);
      
    } catch (err) {
      console.error('Error resolving reconciliation:', err);
      setError('Error resolving reconciliation. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  const handleCloseModal = () => {
    setShowResolveModal(false);
    setSelectedReconciliation(null);
    setResolveComment('');
  };

  const columns = [
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
      header: 'Stock Value',
      key: 'stock_value',
      render: (reconciliation) => formatNumber(reconciliation.stock_value),
    },
    {
      header: 'Report Value',
      key: 'report_value',
      render: (reconciliation) => formatNumber(reconciliation.report_value),
    },
    {
      header: 'Difference',
      key: 'difference',
      render: (reconciliation) => (
        <span style={getDifferenceStyle(reconciliation.difference)}>
          {formatNumber(reconciliation.difference)}
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
      header: 'Created At',
      key: 'created_at',
      render: (reconciliation) => formatDate(reconciliation.created_at),
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
    return (
      reconciliation.item?.toLowerCase().includes(searchString) ||
      reconciliation.status?.toLowerCase().includes(searchString) ||
      reconciliation.comment?.toLowerCase().includes(searchString)
    );
  });

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

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search items, status, or comments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <GeneralTableLayout
        data={filteredReconciliations}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyMessage="No stock reconciliations found"
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Showing {filteredReconciliations.length} reconciliation(s)
      </div>

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
              <strong>Difference:</strong>{' '}
              <span style={getDifferenceStyle(selectedReconciliation.difference)}>
                {formatNumber(selectedReconciliation.difference)}
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
                placeholder="Add a comment (will be updated to 'resolved')"
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