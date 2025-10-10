import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import GeneralTableLayout from '../GeneralTableLayout';

function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSupplier = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      const response = await axios.get(`/api/diraja/suppliers/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSupplier(response.data.supplier);
    } catch (error) {
      console.error('Failed to fetch supplier details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!supplier) return <p>Supplier not found.</p>;

  const transactionColumns = [
    { header: 'Transaction ID', key: 'history_id' },
    { header: 'Item Bought', key: 'item_bought' },
    { header: 'Amount Received', key: 'amount_received' },
    { header: 'Transaction Date', key: 'transaction_date' },
  ];

  return (
    <div style={{ padding: 20 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '6px 12px',
          marginBottom: 16,
          backgroundColor: '#e5e7eb',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>

      <h2 style={{ marginBottom: 12 }}>{supplier.supplier_name}</h2>

      <div style={{ marginBottom: 20 }}>
        <p><strong>Location:</strong> {supplier.supplier_location}</p>
        <p><strong>Email:</strong> {supplier.email}</p>
        <p><strong>Phone:</strong> {supplier.phone_number}</p>
        <p><strong>Total Amount Received:</strong> {supplier.total_amount_received}</p>
        <p><strong>Items Sold:</strong> {supplier.items_sold?.join(', ')}</p>
      </div>

      <h3 style={{ marginBottom: 10 }}>Transaction History</h3>
      <GeneralTableLayout
        data={supplier.history || []}
        columns={transactionColumns}
      />
    </div>
  );
}

export default SupplierDetails;
