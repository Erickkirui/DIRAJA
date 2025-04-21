import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allexpenses', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Sort expenses by 'created_at' in descending order
        const sortedExpenses = response.data.sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at);
        });

        setExpenses(sortedExpenses);
      } catch (err) {
        setError('Error fetching expenses. Please try again.');
      }
    };

    fetchExpenses();
  }, []);

  const handleCheckboxChange = (expenseId) => {
    setSelectedExpenses((prevSelected) =>
      prevSelected.includes(expenseId)
        ? prevSelected.filter((id) => id !== expenseId)
        : [...prevSelected, expenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === expenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(expenses.map((expense) => expense.expense_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');

    if (selectedAction === 'delete') {
      await Promise.all(
        selectedExpenses.map((expenseId) =>
          axios.delete(`/api/diraja/expense/${expenseId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setExpenses((prev) =>
        prev.filter((expense) => !selectedExpenses.includes(expense.expense_id))
      );
      setSelectedExpenses([]);
      setSelectedAction('');
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearchTerm =
      expense.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      selectedDate === '' ||
      new Date(expense.created_at).toLocaleDateString('en-CA') === selectedDate;

    return matchesSearchTerm && matchesDate;
  });

  const currentExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFirstLetter = (username) => username.charAt(0).toUpperCase();
  const getFirstName = (username) => username.split(' ')[0];

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="expenses-container">
      <input
        type="text"
        placeholder="Search by employee name, shop name, or item"
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
      
      <div className='actions-container'>
        <div className="actions">
          <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
            <option value="">With selected, choose an action</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleAction} className="action-button">Apply</button>
        </div>

        <ExportExcel data={expenses} fileName="ExpensesData" />
        <DownloadPDF tableId="expenses-table" fileName="ExpensesData" />
        <Link to="/mabandaexpensesmanager" className='mabandabutton'>View Mabanda Expenses</Link>
      </div>

      <table id="expenses-table" className="expenses-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedExpenses.length === expenses.length}
              />
            </th>
            <th>Employee</th>
            <th>Shop Name</th>
            <th>Item</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount Paid (Ksh)</th>
            <th>Payment Ref</th>
            <th>From</th>
            <th>Comments</th>
            <th>Paid To</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentExpenses.map((expense) => (
            <tr key={expense.expense_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedExpenses.includes(expense.expense_id)}
                  onChange={() => handleCheckboxChange(expense.expense_id)}
                />
              </td>
              <td>
                <div className="employee-info">
                  <div className="employee-icon">{getFirstLetter(expense.username)}</div>
                  <span className="employee-name">{getFirstName(expense.username)}</span>
                </div>
              </td>
              <td>{expense.shop_name}</td>
              <td>{expense.item}</td>
              <td>{expense.category}</td>
              <td>{expense.description}</td>
              <td>{expense.amountPaid}</td>
              <td>{expense.paymentRef}</td>
              <td>{expense.source}</td>
              <td>{expense.comments}</td>
              <td>{expense.paidTo}</td>
              <td>{new Date(expense.created_at).toLocaleDateString('en-CA')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredExpenses.length / itemsPerPage) }, (_, index) => (
          <button
            key={index}
            className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Expenses;
