import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import { isSameDay } from 'date-fns';
import LoadingAnimation from '../LoadingAnimation';

const CreditHistory = () => {
  const [creditSales, setCreditSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchCreditHistory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found. Please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/credit-history', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setCreditSales(response.data || []);
        setError('');
      } catch (err) {
        if (err.response?.status === 404) {
          setCreditSales([]);
          setError('No credit sales found.');
        } else {
          setError('Error fetching credit history. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCreditHistory();
  }, []);

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

  // Filter credit sales based on search query and selected date
  const filteredSales = creditSales.filter((sale) => {
    const matchesSearch =
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.status.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? isSameDay(new Date(sale.sale_created_at), new Date(selectedDate))
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
    
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by customer name or status"
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
        <ExportExcel data={filteredSales} fileName="CreditHistoryData" />
        <DownloadPDF tableId="credit-history-table" fileName="CreditHistoryData" />
      </div>

      <table id="credit-history-table" className="sales-table" aria-label="Credit History data">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Total Price (ksh)</th>
            <th>Balance (ksh)</th>
            <th>Status</th>
            <th>Sale Created At</th>
            <th>Payments</th>
          </tr>
        </thead>
        <tbody>
          {currentSales.length > 0 ? (
            currentSales.map((sale) => (
              <tr key={sale.sale_id}>
                <td>{sale.customer_name}</td>
                <td>{sale.total_price}</td>
                <td>{sale.balance}</td>
                <td>{sale.status}</td>
                <td>{sale.sale_created_at}</td>
                <td>
                  <ul>
                    {sale.mismatched_payments.map((payment, index) => (
                      <li key={index}>
                        {payment.payment_method}: {payment.amount_paid} ksh on {payment.payment_created_at}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No credit history found matching your criteria.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">{renderPaginationButtons()}</div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CreditHistory;
