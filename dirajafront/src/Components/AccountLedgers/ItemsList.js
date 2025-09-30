import React, { useEffect, useState } from 'react';
import GeneralTableLayout from '../GeneralTableLayout';
import CreateItem from './CreateItems';

function ItemsList() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const fetchItems = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setMessageType('error');
      setMessage('Access token is missing. Please login.');
      return;
    }

    try {
      const response = await fetch('/api/diraja/created-items-list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (response.ok) {
        setData(result.items || []);
      } else {
        setMessageType('error');
        setMessage(result.message || 'Failed to fetch items.');
      }
    } catch (error) {
      setMessageType('error');
      setMessage('An error occurred while fetching items.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemAdded = (newItem) => {
    setData((prev) => [...prev, newItem]);
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Item Name' },
    { key: 'type', header: 'Item Type' },
    {
      key: 'accounts',
      header: 'Linked Accounts',
      render: (row) => {
        if (row.type === 'Inventory') {
          return [
            row.purchase_account?.name,
            row.sales_account?.name,
            row.cost_of_sales_account?.name,
          ]
            .filter(Boolean)
            .join(', ');
        } else {
          return row.gl_account?.name || '—';
        }
      },
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        alignItems: 'flex-start',
      }}
    >
      {/* Left: Add Form */}
      <div style={{ flex: '1', maxWidth: '400px' }}>
        <CreateItem onItemAdded={handleItemAdded} />

        {message && (
          <div
            style={{
              margin: '10px 0',
              color: messageType === 'error' ? 'red' : 'green',
            }}
          >
            {messageType === 'success' ? '✅ Success: ' : '❌ Error: '}
            {message}
          </div>
        )}
      </div>

      {/* Right: Table */}
      <div style={{ flex: '2' }}>
        <GeneralTableLayout columns={columns} data={currentItems} />

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '10px',
              flexWrap: 'wrap',
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: page === currentPage ? '#1890ff' : '#f0f0f0',
                  color: page === currentPage ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemsList;
