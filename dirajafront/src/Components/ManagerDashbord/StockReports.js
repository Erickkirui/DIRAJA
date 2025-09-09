import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../../Styles/expenses.css';
import GeneralTableLayout from '../GeneralTableLayout'; // ✅ make sure this path is correct

const StockReports = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const params = {};

        if (selectedDate) {
          params.date = selectedDate;
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/stock-reports', {
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

  const columns = [
    { header: 'Shop', key: 'shop_name' },
    { header: 'User', key: 'user_name' },
    {
      header: 'Items Preview',
      key: 'report',
      render: (item) =>
        item.report
          ? Object.entries(item.report)
              .slice(0, 2)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ') + '...'
          : 'No data'
    },
    { header: 'Comment', key: 'comment' },
    {
      header: 'Date',
      key: 'reported_at',
      render: (item) => new Date(item.reported_at).toLocaleString('en-KE')
    },
    {
      header: 'Action',
      key: 'action',
      render: (item) => (
        <Link to={`/stockreport/${item.id}`} className="view-more-link">
          View More
        </Link>
      )
    }
  ];

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

      <GeneralTableLayout
        data={filteredReports}
        columns={columns}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
};

export default StockReports;
