import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/sales.css';
import { isSameDay } from 'date-fns';
import LoadingAnimation from './LoadingAnimation';
import { Link } from 'react-router-dom';

const Sales = () => {
  const [sales, setSales] = useState([]); // Original sales from API
  const [filteredSales, setFilteredSales] = useState([]); // Filtered results
  const [selectedSales, setSelectedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const backendItemsPerPage = 100; // Backend loads 100 per request
  const frontendItemsPerPage = 50; // Frontend shows 50 per page

  // Fetch sales data from API when the page changes
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        const response = await axios.get(`/api/diraja/allsales?page=${currentPage}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("API Sales Response:", response.data); // Debugging output
        setSales(response.data.sales || []);
        setFilteredSales(response.data.sales || []); // Default to all sales on load
        setTotalPages(response.data.total_pages);
        setError('');
      } catch (err) {
        console.error("Error fetching sales:", err);
        setSales([]);
        setFilteredSales([]);
        setError('Error fetching sales. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [currentPage]);

  // Filter sales when search query or date changes
  useEffect(() => {
    if (!searchQuery && !selectedDate) {
      setFilteredSales(sales); // Reset to full sales list if no filters
      return;
    }

    const searchTerm = searchQuery.toLowerCase().trim();
    const filtered = sales.filter((sale) => {
      const itemMatch = sale.item_name?.toLowerCase().includes(searchTerm) || false;
      const shopMatch = sale.shop_name?.toLowerCase().includes(searchTerm) || false;
      const customerMatch = sale.customer_name?.toLowerCase().includes(searchTerm) || false;
      const employeeMatch = sale.username?.toLowerCase().includes(searchTerm) || false;

      // Date filtering (ensure date format matches)
      const matchesDate = selectedDate
        ? isSameDay(new Date(sale.created_at), new Date(selectedDate))
        : true;

      return (itemMatch || shopMatch || customerMatch || employeeMatch) && matchesDate;
    });

    setFilteredSales(filtered);
  }, [searchQuery, selectedDate]); // Trigger filtering only when these values change

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

      setSales((prevSales) => prevSales.filter((sale) => !selectedSales.includes(sale.sale_id)));
      setSelectedSales([]);
      alert('Selected sales deleted successfully.');
    } catch (error) {
      alert('Error deleting selected sales. Please try again.');
    }
  };

  const getFirstName = (username) => username?.split(' ')[0] || '';
  const getFirstLetter = (username) => username?.charAt(0)?.toUpperCase() || '';

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationButtons = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`page-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  // Apply frontend pagination (50 items per page)
  const indexOfLastItem = currentPage * frontendItemsPerPage;
  const indexOfFirstItem = indexOfLastItem - frontendItemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="sales-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, customer's name, or employee"
          className="search-bar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <input
          type="date"
          className="date-picker"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="actions-container">
        <ExportExcel data={filteredSales} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
        <button className="delete-button" onClick={deleteSelectedSales} disabled={selectedSales.length === 0}>
          Delete Selected
        </button>
      </div>

      <table className="sales-table">
        <thead>
          <tr>
            <th>Select</th>
            <th>Employee</th>
            <th>Customer</th>
            <th>Shop</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Amount Paid</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.length > 0 ? (
            currentSales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>
                  <input type="checkbox" onChange={() => handleCheckboxChange(sale.sale_id)} />
                </td>
                <td>{sale.username}</td>
                <td>{sale.customer_name}</td>
                <td>{sale.shop_name || sale.shopname}</td>
                <td>{sale.item_name}</td>
                <td>{sale.quantity} {sale.metric}</td>
                <td>{sale.total_amount_paid}</td>
                <td>{new Date(sale.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">
                {searchQuery || selectedDate ? "No sales found for the search criteria." : "No sales available."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">{renderPaginationButtons()}</div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Sales;
