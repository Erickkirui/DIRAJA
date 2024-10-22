import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allexpenses', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });

        setExpenses(response.data); // Store the fetched expenses
      } catch (err) {
        setError('Error fetching expenses. Please try again.');
      }
    };

    fetchExpenses(); // Fetch expenses when component loads
  }, []);

  const getFirstName = (username) => {
    return username.split(' ')[0]; // Return only the first name
  };

  const getFirstLetter = (username) => {
    return username.charAt(0).toUpperCase(); // Return the first letter capitalized
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Change the current page
  };

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentExpenses = expenses.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(expenses.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="expenses-container">
      
      {expenses.length > 0 ? (
        <>
          <table className="expenses-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th> {/* Display Username */}
                <th>Shop Name</th> {/* Display Shop Name */}
                <th>Item</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Total Price(ksh)</th>
                <th>Amount Paid(ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentExpenses.map((expense) => (
                <tr key={expense.expense_id}>
                  <td>{expense.expense_id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="employee-icon">{getFirstLetter(expense.username)}</div>
                      <span className="employee-name">{getFirstName(expense.username)}</span>
                    </div>
                  </td>
                  <td>{expense.shop_name}</td>
                  <td>{expense.item}</td>
                  <td>{expense.description}</td>
                  <td>{expense.quantity}</td>
                  <td>{expense.totalPrice}</td>
                  <td>{expense.amountPaid}</td>
                  <td>{new Date(expense.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
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
        <p>No expenses found.</p>
      )}
    </div>
  );
};

export default Expenses;
