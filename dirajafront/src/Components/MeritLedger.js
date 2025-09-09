import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingAnimation from './LoadingAnimation';

const MeritLedger = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchMeritLedger = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          setLoading(false);
          return;
        }

        const params = {};
        if (employeeFilter) {
          params.employee_id = employeeFilter;
        }

        const response = await axios.get('api/diraja/meritledger', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params
        });

        setLedgerEntries(response.data.entries || []);
      } catch (err) {
        setError('Error fetching merit ledger. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeritLedger();
  }, [employeeFilter]);

  const getFirstName = (fullName) => {
    return fullName.split(' ')[0];
  };

  const getFirstLetter = (fullName) => {
    return fullName.charAt(0).toUpperCase();
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const filteredEntries = ledgerEntries
    .filter((entry) => {
      const matchesSearch =
        entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.comment?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = selectedDate
        ? new Date(entry.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
        : true;

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const handleEmployeeFilterChange = (e) => {
    const value = e.target.value;
    setEmployeeFilter(value === '' ? '' : parseInt(value));
    setCurrentPage(1);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="transfers-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by employee, reason, or comment"
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

        <input
          type="number"
          placeholder="Filter by Employee ID"
          className="employee-filter"
          value={employeeFilter}
          onChange={handleEmployeeFilterChange}
          min="1"
        />
      </div>


      {loading ? (
        <LoadingAnimation />
      ) : filteredEntries.length > 0 ? (
        <>
          <table id="merit-ledger-table" className="transfers-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Reason</th>
                <th>Points Change</th>
                <th>Resulting Points</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentEntries.map((entry) => (
                <tr key={entry.ledger_id}>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(entry.employee_name)}</div>
                      <span className="employee-name">
                        {getFirstName(entry.employee_name)} (ID: {entry.employee_id})
                      </span>
                    </div>
                  </td>
                  <td>{entry.reason}</td>
                  <td className={entry.point_change >= 0 ? 'positive-points' : 'negative-points'}>
                    {entry.point_change >= 0 ? '+' : ''}{entry.point_change}
                  </td>
                  <td>{entry.resulting_points}</td>
                  <td>{entry.comment || 'N/A'}</td>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No merit ledger entries found.</p>
      )}
    </div>
  );
};

export default MeritLedger;