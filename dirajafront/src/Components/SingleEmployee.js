// SingleEmployee.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Assuming you're using React Router for navigation
import '../Styles/singleemployee.css';


const SingleEmployee = () => {
  const { employee_id } = useParams(); // Get the employee ID from the URL
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch employee details
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`/diraja/singleemployee/${employee_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}` // Assuming token is stored in localStorage
          }
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

  if (loading) {
    return <div>Loading employee details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {employee ? (
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
        </div>
      ) : (
        <p>No employee details found.</p>
      )}
    </div>
  );
};

export default SingleEmployee;
