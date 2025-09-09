import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaginationTable from '../../PaginationTable';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';

function UnpaidSales({ searchQuery = '', selectedDate = '' }) {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUnpaidSales = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Login required');
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

      const resp = await axios.get('https://kulima.co.ke/api/diraja/unpaidsales', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const salesArray = Array.isArray(resp.data.sales_data) ? resp.data.sales_data : [];

      setData(salesArray);
      setTotalCount(resp.data.total_sales || salesArray.length);
      setTotalPages(resp.data.total_pages || 1);

      // Reset to first page on filter
      if ((searchQuery || selectedDate) && currentPage !== 1) {
        setCurrentPage(1);
      }

    } catch (err) {
      console.error('Error fetching unpaid sales:', err);
      setError(err.response?.data?.error || 'Failed to fetch unpaid sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidSales();
  }, [searchQuery, selectedDate, currentPage, itemsPerPage]);

  const getFirstName = (username) => username?.split(' ')[0] || '';
  const getFirstLetter = (username) => username?.charAt(0)?.toUpperCase() || '';

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
    {
      header: 'Employee',
      key: 'username',
      render: (item) => (
        <div className="employee-info flex items-center gap-2">
          <div className="employee-icon bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
            {getFirstLetter(item.username)}
          </div>
          <span className="employee-name">{getFirstName(item.username)}</span>
        </div>
      ),
    },
    { header: 'Customer', key: 'customer_name' },
    { header: 'Shop', key: 'shopname' },
    {
      header: 'Item(s)',
      key: 'sold_items',
      render: (item) => (
        <div>
          {item.sold_items.map((sold, idx) => (
            <div key={idx}>
              {sold.item_name} ({sold.quantity} {sold.metric})
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Balance (KES)',
      key: 'balance',
      render: (item) => `KES ${item.balance}`,
    },
    { header: 'Status', key: 'status' },
    {
      header: 'View',
      key: 'sale_id',
      render: (item) => (
        <a href={`/sale/${item.sale_id}`} className="text-blue-600 hover:underline">
          View
        </a>
      ),
    },
  ];

  if (error) return <div className="text-red-600">{error}</div>;
  if (loading && currentPage === 1) return <div>Loading unpaid sales...</div>;
  if (!loading && data.length === 0) return <div>No unpaid sales found.</div>;

  return (
    <div className="p-4">
      <div className="actions-container">
        <ExportExcel data={data} fileName="UnpaidSalesData" />
        <DownloadPDF tableId="pagination-table" fileName="UnpaidSalesData" />
      </div>

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
    </div>
  );
}

export default UnpaidSales;
