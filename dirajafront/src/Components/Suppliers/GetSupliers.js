import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';

function GetSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const columns = [
    { header: 'ID', key: 'supplier_id' },
    { header: 'Name', key: 'supplier_name' },
    { header: 'Location', key: 'supplier_location' },
    { header: 'Email', key: 'email' },
    { header: 'Phone Number', key: 'phone_number' },
    { header: 'Total Received', key: 'total_amount_received' },
  ];

  return (
    <div>
     
      {loading ? (
        <p>Loading...</p>
      ) : (
        <GeneralTableLayout
          data={suppliers}
          columns={columns}
        />
      )}
    </div>
  );
}

export default GetSuppliers;
