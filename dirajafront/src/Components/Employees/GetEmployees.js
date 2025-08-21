import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import UpdateEmployeeShop from './UpdateEmployeeShop';
import GeneralTableLayout from '../GeneralTableLayout';
import { Link } from 'react-router-dom';
import '../../Styles/employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showUpdateShop, setShowUpdateShop] = useState(false);
  const [meritPoints, setMeritPoints] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const [employeesRes, meritRes] = await Promise.all([
          axios.get('https://kulima.co.ke/api/diraja/allemployees', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          axios.get('https://kulima.co.ke/api/diraja/allmeritpoints', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);

        setEmployees(employeesRes.data);
        setMeritPoints(meritRes.data);
      } catch (err) {
        setMessageType('error');
        setMessage('Error fetching data. Please try again.');
      }
    };

    fetchData();
  }, []);

  const handleCheckboxChange = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.employee_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return;

    if (selectedAction === 'delete') {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete the selected employees? This action cannot be undone."
      );
      if (!confirmDelete) return;

      try {
        await Promise.all(
          selectedEmployees.map((id) =>
            axios.delete(`https://kulima.co.ke/api/diraja/employee/${id}`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
          )
        );
        setEmployees((prev) =>
          prev.filter((e) => !selectedEmployees.includes(e.employee_id))
        );
        setSelectedEmployees([]);
        setSelectedAction('');
        setMessageType('success');
        setMessage('Selected employees deleted successfully');
      } catch (err) {
        setMessageType('error');
        setMessage('Error deleting employees');
      }
    } else if (selectedAction === 'change-shop') {
      setShowUpdateShop(true);
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.work_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchDate =
      !selectedDate ||
      new Date(e.created_at).toISOString().split('T')[0] === selectedDate;

    return matchSearch && matchDate;
  });

  const getFirstLetter = (name) => name?.charAt(0)?.toUpperCase() || '';
  const getFirstName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1) : '';

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="employees-container">
      {message && <div className={`message ${messageType}`}>{message}</div>}

      <input
        type="text"
        placeholder="Search by name, email, or role"
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

      <div className="actions-container">
        <div className="actions">
          <select
            onChange={(e) => setSelectedAction(e.target.value)}
            value={selectedAction}
          >
            <option value="">With selected, choose an action</option>
            <option value="delete">Delete</option>
            <option value="change-shop">Change Shop</option>
          </select>
          <button onClick={handleAction} className="action-button">
            Apply
          </button>
        </div>

        <ExportExcel data={employees} fileName="EmployeesData" />
        <DownloadPDF tableId="employees-table" fileName="EmployeesData" />
      </div>

      <GeneralTableLayout
        data={filteredEmployees}
        columns={[
          {
            header: (
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  selectedEmployees.length === employees.length &&
                  employees.length > 0
                }
              />
            ),
            render: (employee) => (
              <input
                type="checkbox"
                checked={selectedEmployees.includes(employee.employee_id)}
                onChange={() => handleCheckboxChange(employee.employee_id)}
              />
            ),
          },
          { header: 'ID', key: 'employee_id' },
          {
            header: 'Name',
            render: (employee) => (
              <div className="employee-info">
                <div className="employee-icon">
                  {getFirstLetter(employee.first_name)}
                </div>
                <span className="employee-name">
                  {getFirstName(employee.first_name)}
                </span>
              </div>
            ),
          },
          { header: 'Mail', key: 'work_email' },
          { header: 'Shopname', key: 'shop_name' },
          { header: 'Role', key: 'role' },
          { header: 'Status', key: 'account_status' },
          { header: 'Merit Points', key: 'merit_points' },
          {
              header: 'Last merit update',
              key: 'merit_points_updated_at',
              render: (entry) => {
                if (!entry.merit_points_updated_at) return '';  // ✅ check for null or undefined

                const date = new Date(entry.merit_points_updated_at);
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            },

          {
            header: 'Created at',
            render: (employee) =>
              new Date(employee.created_at).toLocaleString(),
          },
        ]}
      />

      {showUpdateShop && (
        <div className="modal-overlay" onClick={() => setShowUpdateShop(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <UpdateEmployeeShop
              selectedEmployees={selectedEmployees}
              onUpdate={() => {
                setShowUpdateShop(false);
                setMessageType('success');
                setMessage('Shop updated successfully');
              }}
            />
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
