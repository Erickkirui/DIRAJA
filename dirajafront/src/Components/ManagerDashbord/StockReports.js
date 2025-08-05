import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../Styles/expenses.css';

const StockReports = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 50;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const params = {};

        if (selectedDate) {
          params.date = selectedDate;
        }

        const response = await axios.get('/api/diraja/stock-reports', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        });

        setReports(response.data.reports || []);
      } catch (err) {
        setError('Failed to fetch stock reports. Please try again.');
      }
    };

    fetchReports();
  }, [selectedDate]);

  const filteredReports = reports.filter((report) => {
    const matchSearch =
      report.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.comment?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="expenses-container">
      <input
        type="text"
        placeholder="Search by shop name, username, or comment"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />

      <table id="stock-reports-table" className="expenses-table">
        <thead>
          <tr>
            <th>Shop</th>
            <th>User</th>
            <th>Items Preview</th>
            <th>Comment</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report) => (
            <tr key={report.id}>
              <td>{report.shop_name}</td>
              <td>{report.user_name}</td>
              <td>
                {report.report
                  ? Object.entries(report.report)
                      .slice(0, 2)
                      .map(([item, qty]) => `${item}: ${qty}`)
                      .join(', ') + '...'
                  : 'No data'}
              </td>
              <td>{report.comment}</td>
              <td>{new Date(report.reported_at).toLocaleString('en-KE')}</td>
              <td>
                <Link to={`/stockreport/${report.id}`} className="view-more-link">
                  View More
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="pagination-button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StockReports;
