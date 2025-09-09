import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Alert, Stack } from '@mui/material';

const AssignMerit = () => {
  const [formData, setFormData] = useState({
    employee_id: '',
    merit_id: '',
    comment: ''
  });

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [merits, setMerits] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get('api/diraja/allemployees', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setEmployees(response.data);
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching employees.');
      }
    };

    fetchEmployees();
  }, []);

  // Fetch merit points
  useEffect(() => {
    const fetchMerits = async () => {
      try {
        const response = await axios.get('api/diraja/allmeritpoints', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setMerits(response.data);
      } catch (error) {
        setMessageType('error');
        setMessage('Error fetching merit points.');
      }
    };

    fetchMerits();
  }, []);

  // Handle change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'employee_id') {
      const selected = employees.find(emp => emp.employee_id.toString() === value);
      setSelectedEmployee(selected || null);
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await axios.post(
        `api/diraja/employee/${formData.employee_id}/assign-merit`,
        {
          merit_id: formData.merit_id,
          comment: formData.comment
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        }
      );

      setMessage('Merit assigned successfully.');
      setMessageType('success');
      setFormData({ employee_id: '', merit_id: '', comment: '' });
      setSelectedEmployee(null);
    } catch (error) {
      setMessageType('error');
      setMessage('Error assigning merit: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      
      <h1>Assign Merit</h1>
      <form onSubmit={handleSubmit} className="clerk-sale">
        {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

        {/* Employee Dropdown */}
        <select
          name="employee_id"
          value={formData.employee_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.employee_id} value={emp.employee_id}>
              {emp.first_name} {emp.middle_name}
            </option>
          ))}
        </select>

        {/* Display shop name and merit points */}
        {selectedEmployee && (
          <div style={{ marginBottom: '1rem' }}>
            <div><strong>Shop:</strong> {selectedEmployee.shop_name || 'N/A'}</div>
            <div><strong>Merit Points:</strong> {selectedEmployee.merit_points}</div>
          </div>
        )}

        {/* Merit Dropdown */}
        <select
          name="merit_id"
          value={formData.merit_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Merit</option>
          {merits.map((merit) => (
            <option key={merit.id} value={merit.id}>
              {merit.reason} ({merit.point})
            </option>
          ))}
        </select>

        <input
          type="text"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          placeholder="Comment(Optional)"
        />

        <button type="submit" className="add-sale-button" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Assign Merit'}
        </button>
      </form>
    </div>
  );
};

export default AssignMerit;
