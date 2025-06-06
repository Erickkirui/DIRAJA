import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PaginationTable from '../../PaginationTable';
import LoadingAnimation from '../LoadingAnimation';

const EmployeeSales = () => {
  const [salesData, setSalesData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const userName = localStorage.getItem('username');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !userName || !shopId) {
          setError('No access token or required IDs found, please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/api/diraja/sales/${userName}/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.data) {
          setSalesData(response.data);
        } else {
          setError('Unexpected data format received.');
        }
      } catch (err) {
        console.error('Error fetching sales:', err);
        setError('Error fetching sales. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Flattened and filtered data
  const flattenSalesWithItems = () => {
    if (!salesData?.sales) return [];

    return salesData.sales.flatMap(sale => {
      return sale.items.map(item => ({
        ...item,
        sale_id: sale.sale_id,
        created_at: sale.created_at,
        customer_name: sale.customer_name,
        status: sale.status,
        payment_methods: sale.payment_methods,
        total_amount_paid: sale.total_amount_paid,
        shop_name: sale.shop_name,
        username: sale.username,
      }));
    });
  };

  const filteredSales = flattenSalesWithItems().filter(item => {
    const matchesSearch = item.item_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate
      ? new Date(item.created_at).toLocaleDateString('en-CA') === selectedDate
      : true;
    return matchesSearch && matchesDate;
  });

  const sortedSales = [...filteredSales].sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  );

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);
  const paginatedItems = sortedSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by item"
          className="border rounded px-3 py-2 w-full"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={selectedDate}
          onChange={e => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <PaginationTable
        data={paginatedItems}
        columns={columns}
        pagination={{
          currentPage,
          setCurrentPage,
          itemsPerPage,
          setItemsPerPage,
          totalCount: sortedSales.length,
          totalPages,
        }}
      />
    </div>
  );
};

export default EmployeeSales;
