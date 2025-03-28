import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import '../../Styles/sales.css';
import { isSameDay } from 'date-fns';
import LoadingAnimation from '../LoadingAnimation';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25); // Default items per page
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Set loading to false by default
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [totalSales, setTotalSales] = useState(0); // State to hold the total number of sales
  const [totalPages, setTotalPages] = useState(0); // State to hold the total number of pages
  const [debounceTimeout, setDebounceTimeout] = useState(null); // Timeout for debouncing

  // Fetch sales data with pagination and filters (search query and selected date)
  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        // Prepare the parameters for the API call
        const params = {
          searchQuery: searchQuery,
          selectedDate: selectedDate,
          limit: itemsPerPage,
          page: currentPage, // Send the current page number to the backend
        };

        // If either searchQuery or selectedDate is set, we do not need pagination
        if (searchQuery || selectedDate) {
          // Remove pagination parameters (page and limit) if search or date filter is applied
          delete params.page;
          delete params.limit;
        }

        const response = await axios.get('/api/diraja/allsales', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: params, // Send parameters without pagination if needed
        });

        setSales(response.data.sales_data);
        setTotalSales(response.data.total_sales);
        setTotalPages(response.data.total_pages); // Update total pages based on backend response
        setError('');
      } catch (err) {
        setError('Error fetching sales. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [searchQuery, selectedDate, itemsPerPage, currentPage]); // Re-run when searchQuery, selectedDate, currentPage, or itemsPerPage changes

  // Handle search input change with debouncing
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear the previous timeout (if any)
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new timeout to delay the API call by 3 seconds (3000ms)
    const timeout = setTimeout(() => {
      setSearchQuery(value);  // Update search query after 3 seconds
    }, 3000); // 3-second delay

    setDebounceTimeout(timeout);
  };

  // Handle date change
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date); // Set selected date
  };

  const handleCheckboxChange = (saleId) => {
    setSelectedSales((prevSelected) =>
      prevSelected.includes(saleId)
        ? prevSelected.filter((id) => id !== saleId)
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

      // Remove deleted sales from the state
      setSales((prevSales) => prevSales.filter((sale) => !selectedSales.includes(sale.sale_id)));
      setSelectedSales([]);
      alert('Selected sales deleted successfully.');
    } catch (error) {
      alert('Error deleting selected sales. Please try again.');
    }
  };

  // Filter sales based on search query and selected date
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.shopname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? isSameDay(new Date(sale.created_at), new Date(selectedDate))
      : true;

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="sales-container">
      {/* Search and Date Filter for sales */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, customer's name, or employee"
          className="search-bar"
          value={searchQuery}
          onChange={handleSearchChange} // Use the debounced search handler
        />

        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={handleDateChange} // Set the selected date for filtering
        />
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredSales} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
        <button className="delete-button" onClick={deleteSelectedSales} disabled={selectedSales.length === 0}>
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
            <th>Item</th>
            <th>Quantity</th>
            <th>Amount Paid (ksh)</th>
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
                <td>{sale.item_name}</td>
                <td>{sale.quantity}</td>
                <td>{sale.total_amount_paid}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>

                <td>
                  <a href={`/sale/${sale.sale_id}`}>View more</a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9">No sales found matching your criteria.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Sales;
