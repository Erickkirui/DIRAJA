import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaginationTable from '../../PaginationTable';
import SalesFilters from './SalesFilters';

function Sales() {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

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
        status: statusFilter,
        shop_id: shopFilter,
        sort_by: sortField,
        sort_order: sortDirection,
        limit: itemsPerPage,
        page: currentPage,
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const resp = await axios.get('https://kulima.co.ke/api/diraja/allsales', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const salesArray = Array.isArray(resp.data.sales_data)
        ? resp.data.sales_data
        : [];

      setData(salesArray);
      setTotalCount(resp.data.total_sales || salesArray.length);
      setTotalPages(resp.data.total_pages || 1);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err.response?.data?.error || 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [searchQuery, selectedDate, statusFilter, shopFilter, sortField, sortDirection, currentPage, itemsPerPage]);

  const handleDeleteSale = async (saleId) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this sale?')) return;

    try {
      await axios.delete(`https://kulima.co.ke/api/diraja/sale/${saleId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setData((prevData) => prevData.filter((sale) => sale.sale_id !== saleId));
      setTotalCount(prev => prev - 1);
      alert('Sale deleted successfully.');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete the sale. Please try again.');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setStatusFilter('');
    setShopFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    setCurrentPage(1);
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
      render: i => `KES ${i.total_amount_paid.toLocaleString()}`,
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

  return (
    <div>
      <SalesFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        sortField={sortField}
        setSortField={setSortField}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        shopFilter={shopFilter}
        setShopFilter={setShopFilter}
        onResetFilters={resetFilters}
      />

      {error && <div className="error p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading && currentPage === 1 ? (
        <div className="p-4 text-center">Loading...</div>
      ) : !loading && data.length === 0 ? (
        <div className="p-4 text-center">No sales found.</div>
      ) : (
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
      )}
    </div>
  );
}

export default Sales;
