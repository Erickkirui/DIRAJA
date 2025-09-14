import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ExportExcel from '../../Components/Download/ExportExcel';
import DownloadPDF from '../../Components/Download/DownloadPDF';
import '../../Styles/expenses.css';

const CashDeposits = () => {
  const [deposits, setDeposits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDeposits, setSelectedDeposits] = useState([]);
  
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('api/diraja/cashdeposits', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setDeposits(response.data);
      } catch (err) {
        setError('Error fetching cash deposits. Please try again.');
      }
    };

    fetchDeposits();
  }, []);

  const handleCheckboxChange = (depositId) => {
    setSelectedDeposits((prevSelected) =>
      prevSelected.includes(depositId)
        ? prevSelected.filter((id) => id !== depositId)
        : [...prevSelected, depositId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDeposits(
      selectedDeposits.length === deposits.length ? [] : deposits.map((dep) => dep.deposit_id)
    );
  };

  const handleAction = async () => {
    if (selectedAction === 'delete') {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete the selected deposits? This action cannot be undone."
      );
      if (!confirmDelete) return;

      const accessToken = localStorage.getItem('access_token');
      try {
        await Promise.all(
          selectedDeposits.map((depositId) =>
            axios.delete(`api/cashdeposits/${depositId}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          )
        );
        setDeposits((prev) => prev.filter((dep) => !selectedDeposits.includes(dep.deposit_id)));
        setSelectedDeposits([]);
        setSelectedAction('');
      } catch (error) {
        setError('Error deleting deposits. Please try again.');
      }
    }
  };

  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearchTerm =
      deposit.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.transaction_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      selectedDate === '' ||
      new Date(deposit.created_at).toLocaleDateString('en-CA') === selectedDate;

    return matchesSearchTerm && matchesDate;
  });

  const currentDeposits = filteredDeposits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDeposits.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getFirstLetter = (username) => username.charAt(0).toUpperCase();
  const getFirstName = (username) => username.split(' ')[0];

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="expenses-container">
      <input
        type="text"
        placeholder="Search by employee name, shop name, or transaction code"
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
        {/* <div className="actions">
          <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
            <option value="">With selected, choose an action</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleAction} className="action-button">Apply</button>
        </div> */}

        <ExportExcel data={deposits} fileName="CashDepositsData" />
        <DownloadPDF tableId="deposits-table" fileName="CashDepositsData" />
      </div>

      <table id="deposits-table" className="expenses-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedDeposits.length === deposits.length && deposits.length > 0}
              />
            </th>
            <th>Employee</th>
            <th>Shop Name</th>
            <th>Amount (Ksh)</th>
            <th>Deductions (Ksh)</th>
            <th>Reason for Deductions</th>
            <th>Transaction Code</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentDeposits.map((deposit) => (
            <tr key={deposit.deposit_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedDeposits.includes(deposit.deposit_id)}
                  onChange={() => handleCheckboxChange(deposit.deposit_id)}
                />
              </td>
              <td>
                <div className="employee-info">
                  <div className="employee-icon">{getFirstLetter(deposit.username)}</div>
                  <span className="employee-name">{getFirstName(deposit.username)}</span>
                </div>
              </td>
              <td>{deposit.shop_name}</td>
              <td>{deposit.amount}</td>
              <td>{deposit.deductions || 'N/A'}</td>
              <td>{deposit.reason || 'N/A'}</td>
              <td>{deposit.transaction_code}</td>
              <td>{new Date(deposit.created_at).toLocaleDateString('en-CA')}</td>
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

export default CashDeposits;