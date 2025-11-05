import React, { useEffect, useState, useCallback } from 'react';
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
  const [stockItems, setStockItems] = useState([]);

  // List of items that should always use "kg" as metric
  const kgItems = [
    "boneless breast", "thighs", "drumstick", "big legs", "backbone", 
    "liver", "gizzard", "neck", "feet", "wings", "broiler"
  ];
  
  // Format numbers: no decimals if whole, else show up to 3 decimals
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return Number(value) % 1 === 0 ? Number(value).toString() : Number(value).toFixed(3);
  };

  // Process quantity display with proper negative number handling
  const processQuantityDisplay = useCallback((itemname, quantity, metric, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming metric
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(quantity)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(quantity)} ${metric || "pcs"}`;
    }

    // Kgs stay as kgs
    if (metric && metric.toLowerCase() === "kgs") {
      return `${formatNumber(quantity)} kgs`;
    }

    // Handle negative quantities properly
    const isNegative = quantity < 0;
    const absoluteQuantity = Math.abs(quantity);

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(absoluteQuantity / itemInfo.pack_quantity);
      const pieces = absoluteQuantity % itemInfo.pack_quantity;
      const formatted = trays > 0
        ? `${formatNumber(trays)} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
          }`
        : `${formatNumber(pieces)} pcs`;
      return isNegative ? `-${formatted}` : formatted;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(absoluteQuantity / itemInfo.pack_quantity);
      const pieces = absoluteQuantity % itemInfo.pack_quantity;
      const formatted = packets > 0
        ? `${formatNumber(packets)} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
          }`
        : `${formatNumber(pieces)} pcs`;
      return isNegative ? `-${formatted}` : formatted;
    }

    // Fallback
    return `${formatNumber(quantity)} ${metric || "pcs"}`;
  }, []);

  // Special function for difference display that handles negative pack quantities correctly
  const processDifferenceDisplay = useCallback((itemname, difference, metric, items) => {
    const itemInfo = items.find((item) => item.item_name === itemname);

    // Always use kg for specific items regardless of incoming metric
    const shouldUseKg = kgItems.some(kgItem => 
      itemname.toLowerCase().includes(kgItem.toLowerCase())
    );

    if (shouldUseKg) {
      return `${formatNumber(difference)} kg`;
    }

    if (!itemInfo) {
      return `${formatNumber(difference)} ${metric || "pcs"}`;
    }

    // Kgs stay as kgs
    if (metric && metric.toLowerCase() === "kgs") {
      return `${formatNumber(difference)} kgs`;
    }

    // Handle negative differences with pack quantities
    const isNegative = difference < 0;
    const absoluteDifference = Math.abs(difference);

    // Eggs → trays + pieces
    const isEggs = itemInfo.item_name.toLowerCase().includes("egg");
    if (isEggs && itemInfo.pack_quantity > 0) {
      const trays = Math.floor(absoluteDifference / itemInfo.pack_quantity);
      const pieces = absoluteDifference % itemInfo.pack_quantity;
      const formatted = trays > 0
        ? `${formatNumber(trays)} tray${trays !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} eggs` : ""
          }`
        : `${formatNumber(pieces)} eggs`;
      return isNegative ? `-${formatted}` : formatted;
    }

    // Other items with pack quantity → pkts + pcs
    if (itemInfo.pack_quantity > 0) {
      const packets = Math.floor(absoluteDifference / itemInfo.pack_quantity);
      const pieces = absoluteDifference % itemInfo.pack_quantity;
      const formatted = packets > 0
        ? `${formatNumber(packets)} pkt${packets !== 1 ? "s" : ""}${
            pieces > 0 ? `, ${formatNumber(pieces)} pcs` : ""
          }`
        : `${formatNumber(pieces)} pcs`;
      return isNegative ? `-${formatted}` : formatted;
    }

    // Fallback
    return `${formatNumber(difference)} ${metric || "pcs"}`;
  }, []);

  // Fetch stock items for proper metric conversion
  const fetchStockItems = async () => {
    try {
      const response = await axios.get("api/diraja/stockitems", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      return response.data.stock_items || [];
    } catch (err) {
      console.error("Error fetching stock items:", err);
      return [];
    }
  };

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
        formattedStockValue: processQuantityDisplay(
          reconciliation.item,
          reconciliation.stock_value,
          reconciliation.metric,
          items
        ),
        formattedReportValue: processQuantityDisplay(
          reconciliation.item,
          reconciliation.report_value,
          reconciliation.metric,
          items
        ),
        // Use special function for difference to handle negative numbers correctly
        formattedDifference: processDifferenceDisplay(
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
      return { color: '#8850f1', fontWeight: 'normal' }; // Green for positive
    } else if (difference < 0) {
      return { color: '#dc3545', fontWeight: 'normal' }; // Red for negative
    } else {
      return { color: '#6c757d', fontWeight: 'normal' }; // Gray for zero
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

      // Update the reconciliation - FIXED: Use resolveComment instead of selectedReconciliation.comment
      const response = await axios.put(
        `/api/diraja/stock-reconciliation/${selectedReconciliation.id}`,
        {
          comment: resolveComment, // Use the comment from textarea input
          status: 'Solved',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Update local state - FIXED: Use resolveComment here as well
      setReconciliations(prevReconciliations =>
        prevReconciliations.map(item =>
          item.id === selectedReconciliation.id
            ? {
                ...item,
                comment: resolveComment, // Use the comment from textarea input
                status: 'Solved',
                formattedStockValue: processQuantityDisplay(
                  item.item,
                  item.stock_value,
                  item.metric,
                  stockItems
                ),
                formattedReportValue: processQuantityDisplay(
                  item.item,
                  item.report_value,
                  item.metric,
                  stockItems
                ),
                formattedDifference: processDifferenceDisplay(
                  item.item,
                  item.difference,
                  item.metric,
                  stockItems
                )
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