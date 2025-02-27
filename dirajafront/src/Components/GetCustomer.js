import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import '../Styles/customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedNumber, setUpdatedNumber] = useState('');
  const itemsPerPage = 50;
  const maxPageButtons = 4;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }
        const response = await axios.get('/api/diraja/allcustomers', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setCustomers(response.data);
      } catch (err) {
        setError('Error fetching customers. Please try again.');
      }
    };
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate ? new Date(customer.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const getPageNumbers = () => {
    let start = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="customers-container">
      <div className="filter-container">
        <input type="text" placeholder="Search by name, number, or shop" className="search-bar" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <input type="date" className="date-picker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>

      <div className="actions-container">
        <ExportExcel data={customers} fileName="CustomersData" />
        <DownloadPDF tableId="customers-table" fileName="CustomersData" />
      </div>

      {filteredCustomers.length > 0 ? (
        <>
          <table id="customers-table" className="customers-table">
            <thead>
              <tr>
                {/* <th>ID</th> */}
                <th>Name</th>
                <th>Mobile no.</th>
                <th>Shop</th>
                <th>Item</th>
                <th>Amount Paid (Ksh)</th>
                <th>Payment method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map(customer => (
                <tr key={customer.customer_id}>
                  {/* <td>{customer.customer_id}</td> */}
                  <td>{customer.customer_name}</td>
                  <td>{customer.customer_number}</td>
                  <td>{customer.shop_id}</td>
                  <td>{customer.item}</td>
                  <td>{customer.amount_paid}</td>
                  <td>{customer.payment_method}</td>
                  <td>{new Date(customer.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            {currentPage > 1 && <button onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>}
            {getPageNumbers().map(number => (
              <button key={number} className={`page-button ${currentPage === number ? 'active' : ''}`} onClick={() => setCurrentPage(number)}>
                {number}
              </button>
            ))}
            {currentPage < totalPages && <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>}
          </div>
        </>
      ) : (
        <p>No customers found.</p>
      )}
    </div>
  );
};

export default Customers;
