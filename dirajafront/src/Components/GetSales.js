import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/sales.css';
import { isSameDay } from 'date-fns';
import LoadingAnimation from './LoadingAnimation';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allsales', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setSales(response.data);
        setError('');
      } catch (err) {
        if (err.response?.status === 404) {
          setSales([]);
          setError('No sales found.');
        } else {
          setError('Error fetching sales. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

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

  const getFirstName = (username) => username?.split(' ')[0] || '';
  const getFirstLetter = (username) => username?.charAt(0)?.toUpperCase() || '';

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const renderPaginationButtons = () => {
    const range = 3;
    const pages = [];
    for (let i = Math.max(1, currentPage - range); i <= Math.min(totalPages, currentPage + range); i++) {
      pages.push(i);
    }
    return pages.map((page) => (
      <button
        key={page}
        className={`page-button ${currentPage === page ? 'active' : ''}`}
        onClick={() => handlePageChange(page)}
      >
        {page}
      </button>
    ));
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

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="sales-container">
      {/* Search and Date Filter  for sales
      */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item, shop, customer's name, or employee"
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
            <th>Unit Price (ksh)</th>
            <th>Amount Paid (ksh)</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.length > 0 ? (
            currentSales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSales.includes(sale.sale_id)}
                    onChange={() => handleCheckboxChange(sale.sale_id)}
                  />
                </td>
                <td>
                  <div className="employee-info">
                    <div className="employee-icon">{getFirstLetter(sale.username)}</div>
                    <span className="employee-name">{getFirstName(sale.username)}</span>
                  </div>
                </td>
                <td>{sale.customer_name}</td>
                <td>{sale.shopname}</td>
                <td>{sale.item_name}</td>
                <td>{sale.quantity} {sale.metric}</td>
                <td>{sale.unit_price}</td>
                <td>{sale.total_amount_paid}</td>

                <td>{new Date(sale.created_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '')}</td>
                <td>
                  <a href={`/sale/${sale.sale_id}`}>View more</a>
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

      {/* Pagination */}
      <div className="pagination">{renderPaginationButtons()}</div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Sales;
