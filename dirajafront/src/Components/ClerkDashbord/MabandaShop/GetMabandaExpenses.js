import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../../Download/ExportExcel';
import DownloadPDF from '../../Download/DownloadPDF';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('api/diraja/getmabandaexpense', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setExpenses(response.data);
      } catch (err) {
        setError('Error fetching expenses. Please try again.');
      }
    };

    fetchExpenses();
  }, []);

  const filteredExpenses = expenses.filter((expense) => {
    const itemName = expense.description ? expense.description.toLowerCase() : "";
    const userName = expense.username ? expense.username.toLowerCase() : "";

    const matchesSearch =
      itemName.includes(searchQuery.toLowerCase()) ||
      userName.includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(expense.expense_date).toISOString().split('T')[0] === selectedDate
      : true;

    return matchesSearch && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  return (
    <div className="purchases-container">
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by item "
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

      <div className='actions-container'>
        <ExportExcel data={filteredExpenses} fileName="SalesData" />
        <DownloadPDF tableId="sales-table" fileName="SalesData" />
      </div>

      {filteredExpenses.length > 0 ? (
        <>
          <table id="sales-table" className="purchases-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Total Price (Ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={`${expense.description}-${expense.expense_date}`}>
                  <td>{expense.description}</td>
                  <td>{expense.amount}</td>
                  <td>{new Date(expense.expense_date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(',', '')}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No expense found.</p>
      )}
    </div>
  );
};

export default Expenses;
