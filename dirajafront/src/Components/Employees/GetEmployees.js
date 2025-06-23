import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Download/ExportExcel';
import DownloadPDF from '../Download/DownloadPDF';
import UpdateEmployeeShop from './UpdateEmployeeShop';
import { Link } from 'react-router-dom';
import '../../Styles/employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showUpdateShop, setShowUpdateShop] = useState(false);
  const [showMeritForm, setShowMeritForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [meritPoints, setMeritPoints] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const [employeesRes, meritRes] = await Promise.all([
          axios.get('/api/diraja/allemployees', {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          axios.get('/api/diraja/allmeritpoints', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);

        setEmployees(employeesRes.data);
        setMeritPoints(meritRes.data);
      } catch (err) {
        setMessageType('error');
        setMessage('Error fetching data. Please try again.');
        console.error('Error:', err);
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
            axios.delete(`/api/diraja/employee/${id}`, {
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
        console.error('Error:', err);
      }
    } else if (selectedAction === 'change-shop') {
      setShowUpdateShop(true);
    }
  };

  const handleViewMerit = (employee) => {
    setSelectedEmployee(employee);
    setShowMeritForm(true);
    setMessage('');
  };

  const handleMeritSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const accessToken = localStorage.getItem('access_token');
      const selectedMerit = meritPoints.find(
        (merit) => merit.meritpoint_id === Number(formData.merit_id)
      );

      if (!selectedMerit) {
        throw new Error('Selected merit point not found');
      }

      const response = await axios.post(
        `/api/diraja/employee/${selectedEmployee.employee_id}/assign-merit`,
        {
          merit_id: selectedMerit.meritpoint_id,
          comment: formData.comment || ''
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.employee_id === selectedEmployee.employee_id
            ? {
                ...emp,
                merit_points:
                  response.data.employee?.current_merit_points || emp.merit_points
              }
            : emp
        )
      );

      setShowMeritForm(false);
      setSelectedEmployee(null);
      setMessageType('success');
      setMessage('Points assigned successfully!');
    } catch (error) {
      setMessageType('error');
      setMessage(
        error.response?.data?.message || error.message || 'Error assigning points'
      );
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
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

  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <Link className='add-button' to="/newmeritpoint">Add Merit points  </Link>
      </div>

      <table id="employees-table" className="employees-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={
                  selectedEmployees.length === employees.length &&
                  employees.length > 0
                }
              />
            </th>
            <th>ID</th>
            <th>Name</th>
            <th>Mail</th>
            <th>Shopname</th>
            <th>Role</th>
            <th>Status</th>
            <th>Merit Points</th>
            <th>Created at</th>
            <th>Actions</th>
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
                  <div className="employee-icon">
                    {getFirstLetter(employee.first_name)}
                  </div>
                  <span className="employee-name">
                    {getFirstName(employee.first_name)}
                  </span>
                </div>
              </td>
              <td>{employee.work_email}</td>
              <td>{employee.shop_name}</td>
              <td>{employee.role}</td>
              <td>{employee.account_status}</td>
              <td>{employee.merit_points || 0}</td>
              <td>{new Date(employee.created_at).toLocaleString()}</td>
              <td>
                <button
                  onClick={() => handleViewMerit(employee)}
                  className="view-merit-button"
                >
                  Assign Points
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from(
          { length: Math.ceil(filteredEmployees.length / itemsPerPage) },
          (_, i) => (
            <button
              key={i}
              className={`page-button ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          )
        )}
      </div>

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
            <button
              className="cancel-button"
              onClick={() => setShowUpdateShop(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showMeritForm && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowMeritForm(false)}>
          <div
            className="modal-content merit-form"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Assign Points to {selectedEmployee.first_name}</h2>
            <p>Current Merit Points: {selectedEmployee.merit_points || 0}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleMeritSubmit({
                  merit_id: formData.get('merit_id'),
                  comment: formData.get('comment')
                });
              }}
            >
              <select
                name="merit_id"
                required
                className="merit-select"
                disabled={isSubmitting}
              >
                <option value="">Select Merit/Demerit Reason</option>
                {meritPoints.map((merit) => (
                  <option
                    key={merit.meritpoint_id}
                    value={merit.meritpoint_id}
                  >
                    {merit.reason} ({merit.point > 0 ? '+' : ''}
                    {merit.point} points)
                  </option>
                ))}
              </select>

              <textarea
                name="comment"
                placeholder="Comment (optional)"
                className="merit-comment"
                disabled={isSubmitting}
              />

              <div className="merit-form-buttons">
                <button
                  type="submit"
                  className="submit-merit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Points'}
                </button>
                <button
                  type="button"
                  className="cancel-merit-button"
                  onClick={() => setShowMeritForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
