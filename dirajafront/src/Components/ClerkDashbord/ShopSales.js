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
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const shopId = localStorage.getItem('shop_id');
        if (!token || !shopId) {
          setError('Missing token or shop ID.');
          return;
        }

        const response = await axios.get(`/api/diraja/sales/shop/${shopId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data.sales)) {
          setSales(response.data.sales);
        } else {
          setError('Invalid data format from server.');
        }
      } catch (err) {
        setError('Error fetching shop sales.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const flattenSalesWithItems = () => {
    return sales.flatMap(sale =>
      sale.items.map(item => ({
        ...item,
        sale_id: sale.sale_id,
        created_at: sale.created_at,
        customer_name: sale.customer_name,
        status: sale.status,
        payment_methods: sale.payment_methods,
        total_amount_paid: sale.total_amount_paid,
      }))
    );
  };

  const filteredSales = flattenSalesWithItems().filter(item => {
    const itemName = item.item_name?.toLowerCase() || '';
    const matchesSearch = itemName.includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate
      ? new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate
      : true;
    return matchesSearch && matchesDate;
  });

  const sortedSales = [...filteredSales].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const currentItems = sortedSales.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

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
    { header: 'Item Name', key: 'item_name' },
    {
      header: 'Quantity',
      key: 'quantity',
      render: item => `${item.quantity} ${item.metric}`,
    },
    {
      header: 'Total',
      key: 'total_price',
      render: item => `Ksh ${item.total_price.toFixed(2)}`,
    },
    
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

  return (
    <div className="sales-container">
      {/* Filters */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item"
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
        data={currentItems}
        columns={columns}
        pagination={{
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage: () => {}, // optional
          totalCount: sortedSales.length,
          totalPages,
        }}
      />
    </div>
  );
};

export default ShopSales;
