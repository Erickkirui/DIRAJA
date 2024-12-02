// SingleEmployee.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you're using React Router for navigation
import '../Styles/singleemployee.css';

const SingleEmployee = () => {
  const { employee_id } = useParams(); // Get the employee ID from the URL
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Function to fetch employee details
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/api/diraja/employee/${employee_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`, // Assuming token is stored in localStorage
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch employee data');
        }

        const data = await response.json();
        setEmployee(data); // Set employee data
      } catch (err) {
        setError(err.message); // Handle error
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchEmployee();
  }, [employee_id]);

  const handleEditClick = () => {
    setIsEditing(true);
    setFormData(employee); // Initialize form data with the current employee details
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/diraja/employee/${employee_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update employee');

      const data = await response.json();
      setEmployee({ ...employee, ...formData });
      setIsEditing(false);
      alert(data.message || 'Employee updated successfully');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Loading employee details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {employee ? (
        <>
          {!isEditing ? (
            <div>
              <h2>Employee Details</h2>
              <p><strong>Employee ID:</strong> {employee.employee_id}</p>
              <p><strong>First Name:</strong> {employee.first_name}</p>
              <p><strong>Middle Name:</strong> {employee.middle_name}</p>
              <p><strong>Surname:</strong> {employee.surname}</p>
              <p><strong>Phone Number:</strong> {employee.phone_number}</p>
              <p><strong>Work Email:</strong> {employee.work_email}</p>
              <p><strong>Account Status:</strong> {employee.account_status}</p>
              <p><strong>Shop ID:</strong> {employee.shop_id}</p>
              <p><strong>Role:</strong> {employee.role}</p>
              <p><strong>Personal Email:</strong> {employee.personal_email}</p>
              <p><strong>Designation:</strong> {employee.designation}</p>
              <p><strong>Date of Birth:</strong> {new Date(employee.date_of_birth).toLocaleDateString()}</p>
              <p><strong>National ID Number:</strong> {employee.national_id_number}</p>
              <p><strong>KRA PIN:</strong> {employee.kra_pin}</p>
              <p><strong>Monthly Gross Salary:</strong> {employee.monthly_gross_salary}</p>
              <p><strong>Payment Method:</strong> {employee.payment_method}</p>
              <p><strong>Bank Account Number:</strong> {employee.bank_account_number}</p>
              <p><strong>Bank Name:</strong> {employee.bank_name}</p>
              <p><strong>Department:</strong> {employee.department}</p>
              <p><strong>Starting Date:</strong> {new Date(employee.starting_date).toLocaleDateString()}</p>
              <p><strong>Contract Termination Date:</strong> {employee.contract_termination_date ? new Date(employee.contract_termination_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Contract Renewal Date:</strong> {employee.contract_renewal_date ? new Date(employee.contract_renewal_date).toLocaleDateString() : 'N/A'}</p>
              <button onClick={handleEditClick}>Edit Employee</button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
  <h2>Edit Employee</h2>
  
  <div className="form-group">
    <label htmlFor="first_name">First Name:</label>
    <input
      type="text"
      id="first_name"
      name="first_name"
      value={formData.first_name || ''}
      onChange={handleInputChange}
    />
  </div>
  
  <div className="form-group">
    <label htmlFor="middle_name">Middle Name:</label>
    <input
      type="text"
      id="middle_name"
      name="middle_name"
      value={formData.middle_name || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="surname">Surname:</label>
    <input
      type="text"
      id="surname"
      name="surname"
      value={formData.surname || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="phone_number">Phone Number:</label>
    <input
      type="text"
      id="phone_number"
      name="phone_number"
      value={formData.phone_number || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="work_email">Work Email:</label>
    <input
      type="email"
      id="work_email"
      name="work_email"
      value={formData.work_email || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="account_status">Account Status:</label>
    <select
      id="account_status"
      name="account_status"
      value={formData.account_status || employee.account_status || ''}
      onChange={handleInputChange}
    >
      <option value="">Select Status</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  </div>

  <div className="form-group">
    <label htmlFor="role">Role:</label>
    <input
      type="text"
      id="role"
      name="role"
      value={formData.role || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="personal_email">Personal Email:</label>
    <input
      type="email"
      id="personal_email"
      name="personal_email"
      value={formData.personal_email || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="designation">Designation:</label>
    <input
      type="text"
      id="designation"
      name="designation"
      value={formData.designation || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="date_of_birth">Date of Birth:</label>
    <input
      type="date"
      id="date_of_birth"
      name="date_of_birth"
      value={formData.date_of_birth || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="national_id_number">National ID Number:</label>
    <input
      type="text"
      id="national_id_number"
      name="national_id_number"
      value={formData.national_id_number || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="kra_pin">KRA PIN:</label>
    <input
      type="text"
      id="kra_pin"
      name="kra_pin"
      value={formData.kra_pin || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="monthly_gross_salary">Monthly Gross Salary:</label>
    <input
      type="text"
      id="monthly_gross_salary"
      name="monthly_gross_salary"
      value={formData.monthly_gross_salary || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="payment_method">Payment Method:</label>
    <input
      type="text"
      id="payment_method"
      name="payment_method"
      value={formData.payment_method || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="bank_account_number">Bank Account Number:</label>
    <input
      type="text"
      id="bank_account_number"
      name="bank_account_number"
      value={formData.bank_account_number || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="bank_name">Bank Name:</label>
    <input
      type="text"
      id="bank_name"
      name="bank_name"
      value={formData.bank_name || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="department">Department:</label>
    <input
      type="text"
      id="department"
      name="department"
      value={formData.department || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="starting_date">Starting Date:</label>
    <input
      type="date"
      id="starting_date"
      name="starting_date"
      value={formData.starting_date || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="contract_termination_date">Contract Termination Date:</label>
    <input
      type="date"
      id="contract_termination_date"
      name="contract_termination_date"
      value={formData.contract_termination_date || ''}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="contract_renewal_date">Contract Renewal Date:</label>
    <input
      type="date"
      id="contract_renewal_date"
      name="contract_renewal_date"
      value={formData.contract_renewal_date || ''}
      onChange={handleInputChange}
    />
  </div>

  <button type="submit">Save Changes</button>
</form>

          )}
        </>
      ) : (
        <p>No employee details found.</p>
      )}
    </div>
  );
};

export default SingleEmployee;
