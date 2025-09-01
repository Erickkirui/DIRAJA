import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaginationTable from '../../PaginationTable';
import LoadingAnimation from '../LoadingAnimation';

const ShopSales = () => {
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 50;

  const fetchSales = async (page = 1, search = '', date = '') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const shopId = localStorage.getItem('shop_id');
      if (!token || !shopId) {
        setError('Missing token or shop ID.');
        return;
      }

      const response = await axios.get(`https://kulima.co.ke/api/diraja/sales/shop/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page,
          limit: itemsPerPage,
          search: search,
          date: date
        }
      });

      if (response.data.sales) {
        setSales(response.data.sales);
        setTotalCount(response.data.total_sales);
        setTotalPages(response.data.total_pages);
      } else {
        setError('Invalid data format from server.');
      }
    } catch (err) {
      setError('Error fetching shop sales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(currentPage, searchQuery, selectedDate);
  }, [currentPage, searchQuery, selectedDate]);

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

      // Refresh the current page after deletion
      fetchSales(currentPage, searchQuery, selectedDate);
      alert('Sale deleted successfully.');
    } catch (error) {
      console.error('Error deleting sale:', error);
      alert('Failed to delete the sale. Please try again.');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const columns = [
    {
      header: 'Date',
      key: 'created_at',
      render: sale => {
        const date = new Date(sale.created_at);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      },
    },
    {
      header: 'Items',
      key: 'items',
      render: sale =>
        Array.isArray(sale.items)
          ? sale.items.map(item => (
              <div key={`${item.item_name}-${item.BatchNumber}`} className="mb-1">
                {item.item_name} × {item.quantity} {item.metric} — Ksh {item.total_price}
              </div>
            ))
          : 'No items',
    },
    // {
    //   header: 'Customer',
    //   key: 'customer_name',
    //   render: sale => sale.customer_name || 'Walk-in',
    // },
    {
      header: 'Total Paid',
      key: 'total_amount_paid',
      render: sale => `Ksh ${sale.total_amount_paid?.toFixed(2) || '0.00'}`,
    },
    // {
    //   header: 'Status',
    //   key: 'status',
    //   render: sale => (
    //     <span className={`status-badge ${sale.status}`}>
    //       {sale.status.replace('_', ' ')}
    //     </span>
    //   ),
    // },
    // {
    //   header: 'Actions',
    //   key: 'actions',
    //   render: sale => (
    //     <button 
    //       className="delete-btn"
    //       onClick={() => handleDeleteSale(sale.sale_id)}
    //     >
    //       Delete
    //     </button>
    //   ),
    // },
  ];

  if (loading) {
    return (
      <div className="full-screen-loader">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!loading && sales.length === 0) {
    return <div>No sales found.</div>;
  }

  return (
    <div className="sales-container">
      {/* Filters */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item or customer"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <PaginationTable
        data={sales}
        columns={columns}
        pagination={{
          currentPage,
          setCurrentPage: handlePageChange,
          itemsPerPage,
          setItemsPerPage: () => {}, // optional
          totalCount,
          totalPages,
        }}
      />
    </div>
  );
};

export default ShopSales;