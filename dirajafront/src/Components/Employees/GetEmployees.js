import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel'
import DownloadPDF from '../Download/DownloadPDF';
import UpdateEmployeeShop from './UpdateEmployeeShop'; // Import the UpdateEmployeeShop component
import '../../Styles/employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showUpdateShop, setShowUpdateShop] = useState(false); // Modal visibility state
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allemployees', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setEmployees(response.data);
      } catch (err) {
        setError('Error fetching employees. Please try again.');
      }
    };

    fetchEmployees();
  }, []);

  const handleCheckboxChange = (employeeId) => {
    setSelectedEmployees((prevSelected) =>
      prevSelected.includes(employeeId)
        ? prevSelected.filter((id) => id !== employeeId)
        : [...prevSelected, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((employee) => employee.employee_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');

    if (selectedAction === 'delete') {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete the selected employees? This action cannot be undone."
      );

      if (!confirmDelete) {
        return; // Exit if the user cancels
      }

      try {
        await Promise.all(
          selectedEmployees.map((employeeId) =>
            axios.delete(`/api/diraja/employee/${employeeId}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            })
          )
        );
        setEmployees((prev) =>
          prev.filter((employee) => !selectedEmployees.includes(employee.employee_id))
        );
        setSelectedEmployees([]);
        setSelectedAction('');
      } catch (error) {
        console.error("Error deleting employees:", error);
      }
    } else if (selectedAction === 'change-shop') {
      setShowUpdateShop(true); // Show the UpdateEmployeeShop component as a popup
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearchTerm =
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.work_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      selectedDate === '' || new Date(employee.created_at).toISOString().split('T')[0] === selectedDate;

    return matchesSearchTerm && matchesDate;
  });

  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFirstLetter = (name) => {
    return name.charAt(0).toUpperCase();
  };

  const getFirstName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="employees-container">
      <input
        type="text"
        placeholder="Search by name, email, or role"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      {/* Single date picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />

      <div className="actions-container">
        <div className="actions">
          <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
            <option value="">With selected, choose an action</option>
            <option value="delete">Delete</option>
            <option value="change-shop">Change Shop</option>
          </select>
          <button onClick={handleAction} className="action-button">Apply</button>
        </div>

        {/* Export to Excel and PDF */}
        <ExportExcel data={employees} fileName="EmployeesData" />
        <DownloadPDF tableId="employees-table" fileName="EmployeesData" />
      </div>

      <table id="employees-table" className="employees-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedEmployees.length === employees.length}
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Mail</th>
            <th>Shopname</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created at</th>
          </tr>
        </thead>
        <tbody>
          {currentEmployees.map((employee) => (
            <tr key={employee.employee_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedEmployees.includes(employee.employee_id)}
                  onChange={() => handleCheckboxChange(employee.employee_id)}
                />
              </td>
              <td>{employee.employee_id}</td>
              <td>
                <div className="employee-info">
                  <div className="employee-icon">{getFirstLetter(employee.first_name)}</div>
                  <a href={`/employee/${employee.employee_id}`} className="employee-name-link">
                    <span className="employee-name">{getFirstName(employee.first_name)}</span>
                  </a>
                </div>
              </td>
              <td>{employee.work_email}</td>
              <td>{employee.shop_name}</td>
              <td>{employee.role}</td>
              <td>{employee.account_status}</td>
              <td>{new Date(employee.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredEmployees.length / itemsPerPage) }, (_, index) => (
          <button
            key={index}
            className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Show the UpdateEmployeeShop component as a popup */}
      {showUpdateShop && (
        <div className="modal-overlay" onClick={() => setShowUpdateShop(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <UpdateEmployeeShop
              selectedEmployees={selectedEmployees}
              onUpdate={() => {
                setShowUpdateShop(false); // Close the modal after update
              }}
            />
            {/* Cancel Button */}
            <button className="cancel-button" onClick={() => setShowUpdateShop(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
