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

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allcustomers', {
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

  const handleEditClick = (customer) => {
    setEditingCustomer(customer.customer_id);
    setUpdatedName(customer.customer_name);
    setUpdatedNumber(customer.customer_number);
  };

  const handleEditSave = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken || !editingCustomer) return;

    try {
      await axios.put(`/api/diraja/customers/${editingCustomer}`, {
        customer_name: updatedName,
        customer_number: updatedNumber,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setCustomers((prevCustomers) =>
        prevCustomers.map((customer) =>
          customer.customer_id === editingCustomer
            ? { ...customer, customer_name: updatedName, customer_number: updatedNumber }
            : customer
        )
      );
      setEditingCustomer(null);
      setUpdatedName('');
      setUpdatedNumber('');
    } catch (err) {
      setError('Error updating customer. Please try again.');
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');

    if (selectedAction === 'edit' && selectedCustomers.length === 1) {
      const customerToEdit = customers.find((customer) => customer.customer_id === selectedCustomers[0]);
      if (customerToEdit) {
        handleEditClick(customerToEdit);
      }
    } else if (selectedAction === 'delete') {
      await Promise.all(
        selectedCustomers.map((customerId) =>
          axios.delete(`/api/diraja/customers/${customerId}`, {
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
    const matchesSearch =
      customer.customer_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = selectedDate
      ? new Date(customer.created_at).toLocaleDateString() === new Date(selectedDate).toLocaleDateString()
      : true;

    return matchesSearch && matchesDate;
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
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by name, number, or shop"
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
        <div className="actions">
          <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
            <option value="">With selected, choose an action</option>
            <option value="edit">Edit</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleAction} className="action-button">
            Apply
          </button>
        </div>
        <ExportExcel data={customers} fileName="CustomersData" />
        <DownloadPDF tableId="customers-table" fileName="CustomersData" />
      </div>

      {filteredCustomers.length > 0 ? (
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
                  <td>
                    {editingCustomer === customer.customer_id ? (
                      <input
                        type="text"
                        value={updatedName}
                        onChange={(e) => setUpdatedName(e.target.value)}
                      />
                    ) : (
                      customer.customer_name
                    )}
                  </td>
                  <td>
                    {editingCustomer === customer.customer_id ? (
                      <input
                        type="text"
                        value={updatedNumber}
                        onChange={(e) => setUpdatedNumber(e.target.value)}
                      />
                    ) : (
                      customer.customer_number
                    )}
                  </td>
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
