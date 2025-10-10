import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import { useNavigate } from 'react-router-dom';

function GetSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSuppliers = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get('/api/diraja/all-suppliers', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSuppliers(response.data.suppliers || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleViewDetails = (supplier_id) => {
    navigate(`/suppliers/${supplier_id}`);
  };

  const columns = [
    { header: 'Name', key: 'supplier_name' },
    { header: 'Location', key: 'supplier_location' },
    { header: 'Email', key: 'email' },
    { header: 'Phone Number', key: 'phone_number' },
    { header: 'Total Received', key: 'total_amount_received' },
    {
      header: 'Action',
      key: 'action',
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row.supplier_id)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          View 
        </button>
      ),
    },
  ];

  return (
    <div>
     
      {loading ? (
        <p>Loading...</p>
      ) : (
        <GeneralTableLayout data={suppliers} columns={columns} />
      )}
    </div>
  );
}

export default GetSuppliers;
