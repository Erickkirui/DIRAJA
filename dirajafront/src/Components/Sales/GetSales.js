import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaginationTable from '../../PaginationTable';

function Sales({ searchQuery = '', selectedDate = '' }) {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSales = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Log in required');
      setLoading(false);
      return;
    }

    try {
      const params = {
        searchQuery,
        selectedDate,
        limit: itemsPerPage,
        page: currentPage,
      };

      const resp = await axios.get('/api/diraja/allsales', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const salesArray = Array.isArray(resp.data.sales_data)
        ? resp.data.sales_data
        : [];

      setData(salesArray);
      setTotalCount(resp.data.total_sales || salesArray.length);
      setTotalPages(resp.data.total_pages || 1);

      // Reset to page 1 if we're doing a search or date filter
      if ((searchQuery || selectedDate) && currentPage !== 1) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.response?.data?.error || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [searchQuery, selectedDate, currentPage, itemsPerPage]);

  const handleDeleteSale = async (saleId) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this sale?')) return;

    try {
      await axios.delete(`/api/diraja/sale/${saleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setData((prevData) => prevData.filter((sale) => sale.sale_id !== saleId));
      alert('Sale deleted successfully.');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete the sale. Please try again.');
    }
  };

  const columns = [
    {
      header: 'Date',
      key: 'created_at',
      render: item => {
        const date = new Date(item.created_at);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    { header: 'Clerk', key: 'username' },
    { header: 'Shop', key: 'shopname' },
    {
      header: 'Items',
      key: 'sold_items',
      render: item =>
        Array.isArray(item.sold_items)
          ? item.sold_items.map(si => (
              <div key={si.batch_number}>
                {si.item_name} × {si.quantity} {si.metric} — KES {si.total_price}
              </div>
            ))
          : 'No items',
    },
    {
      header: 'Total Paid',
      key: 'total_amount_paid',
      render: i => `KES ${i.total_amount_paid}`,
    },
    { header: 'Status', key: 'status' },
    { header: 'Customer', key: 'customer_name' },
    {
  header: 'Action',
  key: 'sale_id',
  render: item => (
    <span
      className="text-red-600 cursor-pointer hover:underline"
      onClick={() => handleDeleteSale(item.sale_id)}
    >
      Delete
    </span>
  ),
},
{
  header: 'View',
  key: 'view',
  render: item => (
    <a
      href={`/sale/${item.sale_id}`}
      className="text-blue-600 hover:underline"
    >
      View 
    </a>
  ),
},


   

  ];

  if (error) return <div className="error">{error}</div>;
  if (loading && currentPage === 1) return <div>Loading...</div>;
  if (!loading && data.length === 0) return <div>No sales found.</div>;

  return (
    <PaginationTable
      data={data}
      columns={columns}
      pagination={{
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalCount,
        totalPages,
      }}
    />
  );
}

export default Sales;
