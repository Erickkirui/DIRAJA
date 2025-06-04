import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import '../../Styles/sales.css';
import { isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        const params = {
          searchQuery: searchQuery,
          selectedDate: selectedDate,
          limit: itemsPerPage,
          page: currentPage,
        };

        if (searchQuery || selectedDate) {
          delete params.page;
          delete params.limit;
        }

        const response = await axios.get('/api/diraja/allsales', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params,
        });

        setSales(response.data.sales_data);
        setTotalSales(response.data.pagination.total_sales);
        setTotalPages(response.data.pagination.total_pages);
        setError('');
      } catch (err) {
        setError('Error fetching sales. Please try again.');
      }
    };

    fetchSales();
  }, [searchQuery, selectedDate, itemsPerPage, currentPage]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const timeout = setTimeout(() => {
      setSearchQuery(value);
    }, 3000);

    setDebounceTimeout(timeout);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCheckboxChange = (saleId) => {
    setSelectedSales(prevSelected =>
      prevSelected.includes(saleId)
        ? prevSelected.filter(id => id !== saleId)
        : [...prevSelected, saleId]
    );
  };

  const deleteSelectedSales = async () => {
    if (selectedSales.length === 0) {
      alert('No sales selected for deletion.');
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      alert('No access token found. Please log in.');
      return;
    }

    try {
      await Promise.all(
        selectedSales.map(async (saleId) => {
          await axios.delete(`/api/diraja/sale/${saleId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        })
      );

      setSales(prevSales => prevSales.filter(sale => !selectedSales.includes(sale.sale_id)));
      setSelectedSales([]);
      alert('Selected sales deleted successfully.');
    } catch (error) {
      alert('Error deleting selected sales. Please try again.');
    }
  };

  // Calculate total items for each sale
  const calculateTotalItems = (sale) => {
    return sale.sold_items.reduce((total, item) => total + item.quantity, 0);
  };

  // Calculate total amount for each sale
  const calculateTotalAmount = (sale) => {
    return sale.sold_items.reduce((total, item) => total + item.total_price, 0);
  };

  // Get first item name or display multiple items
  const getItemDisplay = (sale) => {
    if (sale.sold_items.length === 0) return 'No items';
    if (sale.sold_items.length === 1) return sale.sold_items[0].item_name;
    return `${sale.sold_items[0].item_name} +${sale.sold_items.length - 1} more`;
  };

  // Filter sales based on search query and selected date
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.shopname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.sold_items.some(item => 
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesDate = selectedDate
      ? isSameDay(new Date(sale.created_at), new Date(selectedDate))
      : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="sales-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by customer, shop, employee, or item"
          className="search-bar"
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredSales} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
        <button 
          className="delete-button" 
          onClick={deleteSelectedSales} 
          disabled={selectedSales.length === 0}
        >
          Delete Selected
        </button>
      </div>

      <table id="sales-table" className="sales-table" aria-label="Sales data">
        <thead>
          <tr>
            <th>Select</th>
            <th>Employee</th>
            <th>Customer</th>
            <th>Shop</th>
            <th>Items</th>
            <th>Total Items</th>
            <th>Total Amount (Ksh)</th>
            <th>Amount Paid (Ksh)</th>
            <th>Balance (Ksh)</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSales.includes(sale.sale_id)}
                    onChange={() => handleCheckboxChange(sale.sale_id)}
                  />
                </td>
                <td>{sale.username}</td>
                <td>{sale.customer_name}</td>
                <td>{sale.shopname}</td>
                <td>{getItemDisplay(sale)}</td>
                <td>{calculateTotalItems(sale)}</td>
                <td>{calculateTotalAmount(sale).toFixed(2)}</td>
                <td>{sale.total_amount_paid?.toFixed(2)}</td>
                <td>{sale.balance?.toFixed(2)}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                <td>
                  <Link to={`/sale/${sale.sale_id}`}>View Details</Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11">No sales found matching your criteria.</td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Sales;