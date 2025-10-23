import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import CreditorActions from './CreditorAction'; // Import the CreditorActions component

const CreditorsList = () => {
  const [creditors, setCreditors] = useState([]);
  const [shops, setShops] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedCreditor, setSelectedCreditor] = useState(null);
  const [showCreditorModal, setShowCreditorModal] = useState(false);

  // Fetch shops to map shop IDs to shop names
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Handle different response formats
        let shopList = [];
        if (Array.isArray(response.data)) {
          shopList = response.data;
        } else if (response.data && Array.isArray(response.data.shops)) {
          shopList = response.data.shops;
        } else if (response.data && Array.isArray(response.data.data)) {
          shopList = response.data.data;
        }

        setShops(shopList);
      } catch (err) {
        console.error('Error fetching shops:', err);
        setError('Error fetching shops data.');
      }
    };

    fetchShops();
  }, []);

  // Fetch creditors
  const fetchCreditors = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setError('No access token found, please log in.');
        return;
      }

      const response = await axios.get('/api/diraja/creditors', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setCreditors(response.data.creditors || response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching creditors:', err);
      setError('Error fetching creditors. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditors();
  }, []);

  // Helper function to get shop name from ID
  const getShopName = (shopId) => {
    const shop = shops.find(s => 
      s.shops_id === shopId || s.id === shopId || s.shop_id === shopId
    );
    return shop ? (shop.name || shop.shop_name || `Shop ${shopId}`) : 'Unknown Shop';
  };

  // Format currency for display in KSH
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'KSh 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  // Handle edit button click
  const handleEditClick = (creditor) => {
    setSelectedCreditor(creditor);
    setShowCreditorModal(true);
  };

  // Handle creditor update
  const handleCreditorUpdated = () => {
    fetchCreditors(); // Refresh the creditor list
    setShowCreditorModal(false);
  };

  // Handle creditor deletion
  const handleCreditorDeleted = () => {
    fetchCreditors(); // Refresh the creditor list
    setShowCreditorModal(false);
  };

  // Filter creditors based on search term
  const filteredCreditors = creditors.filter(creditor => {
    const searchString = searchTerm.toLowerCase();
    return (
      creditor.name.toLowerCase().includes(searchString) ||
      getShopName(creditor.shop_id).toLowerCase().includes(searchString) ||
      creditor.total_credit?.toString().includes(searchString) ||
      creditor.credit_amount?.toString().includes(searchString)
    );
  });

  // Define table columns
  const columns = [
    {
      header: 'Creditor Name',
      key: 'name',
      render: (creditor) => (
        <div style={{ fontWeight: 'bold' }}>
          {creditor.name}
        </div>
      ),
    },
    {
      header: 'Shop',
      key: 'shop_id',
      render: (creditor) => getShopName(creditor.shop_id),
    },
    {
      header: 'Total Credit',
      key: 'total_credit',
      render: (creditor) => (
        <span style={{ 
          color: creditor.total_credit > 0 ? '#d4edda' : '#f8d7da',
          fontWeight: 'bold' 
        }}>
          {formatCurrency(creditor.total_credit)}
        </span>
      ),
    },
    {
      header: 'Current Credit',
      key: 'credit_amount',
      render: (creditor) => (
        <span style={{ 
          color: creditor.credit_amount > 0 ? '#dc3545' : '#28a745',
          fontWeight: 'bold' 
        }}>
          {formatCurrency(creditor.credit_amount)}
        </span>
      ),
    },
    {
      header: 'Credit Status',
      key: 'status',
      render: (creditor) => {
        const status = creditor.credit_amount > 0 ? 'Outstanding' : 
                      creditor.credit_amount < 0 ? 'Credit Balance' : 'Settled';
        const color = creditor.credit_amount > 0 ? '#fff3cd' : 
                     creditor.credit_amount < 0 ? '#d4edda' : '#e2e3e5';
        const textColor = creditor.credit_amount > 0 ? '#856404' : 
                         creditor.credit_amount < 0 ? '#155724' : '#383d41';
        
        return (
          <span
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: color,
              color: textColor,
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (creditor) => (
        <button
          onClick={() => handleEditClick(creditor)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          Edit
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        <div>Loading creditors...</div>
      </div>
    );
  }

  return (
    <div className="creditors-container" style={{ padding: '20px' }}>
      <h2>Creditors Management</h2>
      
      {error && (
        <div 
          style={{ 
            color: 'red', 
            marginBottom: '20px', 
            padding: '10px', 
            border: '1px solid red',
            borderRadius: '4px'
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search creditors, shops, or amounts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>

      <GeneralTableLayout
        data={filteredCreditors}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        emptyMessage="No creditors found"
      />

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Showing {filteredCreditors.length} creditor(s) • 
        Total Outstanding: {formatCurrency(filteredCreditors.reduce((sum, c) => sum + (c.credit_amount || 0), 0))}
      </div>

      {/* Creditor Actions Modal */}
      {selectedCreditor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: showCreditorModal ? 'flex' : 'none',
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
              onClick={() => setShowCreditorModal(false)}
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
              Edit Creditor
            </h3>
            
            <CreditorActions
              creditor={selectedCreditor}
              onCreditorUpdated={handleCreditorUpdated}
              onCreditorDeleted={handleCreditorDeleted}
              shops={shops}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditorsList;