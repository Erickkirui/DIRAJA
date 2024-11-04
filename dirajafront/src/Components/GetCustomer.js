import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel'; // Correct import path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Correct import path
import '../Styles/customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allcustomers', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setCustomers(response.data);
      } catch (err) {
        setError('Error fetching customers. Please try again.');
      }
    };

    fetchCustomers();
  }, []);

  const handleCheckboxChange = (customerId) => {
    setSelectedCustomers((prevSelected) =>
      prevSelected.includes(customerId)
        ? prevSelected.filter((id) => id !== customerId)
        : [...prevSelected, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map((customer) => customer.customer_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');

    if (selectedAction === 'delete') {
      await Promise.all(
        selectedCustomers.map((customerId) =>
          axios.delete(`/diraja/allcustomers/${customerId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setCustomers((prev) =>
        prev.filter((customer) => !selectedCustomers.includes(customer.customer_id))
      );
      setSelectedCustomers([]);
      setSelectedAction('');
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      customer.customer_name.toLowerCase().includes(searchString) ||
      customer.customer_number.toLowerCase().includes(searchString) ||
      customer.shop_id.toLowerCase().includes(searchString);

    const matchesDateRange =
      selectedDate === '' || new Date(customer.created_at).toISOString().split('T')[0] === selectedDate;

    return matchesSearch && matchesDateRange;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="customers-container">


      <input
        type="text"
        placeholder="Search by name, number, or shop"
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
      <div className='actions-container' >
      <div className="actions">
        <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
          <option value="">With selected, choose an action</option>
          <option value="delete">Delete</option>
        </select>
        <button onClick={handleAction} className="action-button">
          Apply
        </button>
      </div>
        <ExportExcel data={customers} fileName="CustomersData" />
        <DownloadPDF tableId="customers-table" fileName="CustomersData" />


      </div>

 

      {customers.length > 0 ? (
        <>
          <table id="customers-table" className="customers-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedCustomers.length === customers.length}
                  />
                </th>
                <th>ID</th>
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
              {currentCustomers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.customer_id)}
                      onChange={() => handleCheckboxChange(customer.customer_id)}
                    />
                  </td>
                  <td>{customer.customer_id}</td>
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
        <p>No customers found.</p>
      )}
    </div>
  );
};

export default Customers;
