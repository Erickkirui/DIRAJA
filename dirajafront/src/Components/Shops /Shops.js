// src/components/AddShop.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../../Styles/shops.css";

const AddShop = () => {
  const [shopname, setShopname] = useState('');
  const [location, setLocation] = useState('');
  const [employee, setEmployee] = useState('');
  const [shopstatus, setShopstatus] = useState('active');
  const [message, setMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('api/diraja/allemployees', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setEmployees(response.data);
      } catch (error) {
        setMessage('Error fetching employees.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setMessage('You are not authenticated');
      return;
    }

    try {
      // Find the selected employee to get their full name
      const selectedEmployee = employees.find(emp => 
        `${emp.first_name} ${emp.middle_name}` === employee
      );

      const response = await axios.post(
        'api/diraja/newshop',
        {
          shopname,
          location,
          employee: selectedEmployee ? 
                   `${selectedEmployee.first_name} ${selectedEmployee.middle_name}` : 
                   employee,
          shopstatus,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
        }
      );

      if (response.status === 201) {
        setMessage('Shop added successfully');
        setShopname('');
        setLocation('');
        setEmployee('');
        setShopstatus('active');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className='add-shop-container'>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder='Enter shop name'
          id="shopname"
          value={shopname}
          onChange={(e) => setShopname(e.target.value)}
          required
        />
        
        <select
          id="employee"
          value={employee}
          onChange={(e) => setEmployee(e.target.value)}
          required
          disabled={isLoading}
        >
          <option value="">Select Employee Incharge</option>
          {employees.map((emp) => (
            <option 
              key={emp.employee_id} 
              value={`${emp.first_name} ${emp.middle_name}`}
            >
              {emp.first_name} {emp.middle_name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder='Shop location'
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
      
        <select
          id="shopstatus"
          value={shopstatus}
          onChange={(e) => setShopstatus(e.target.value)}
          required
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Add Shop'}
        </button>
      </form>
      {message && <p className='message'>{message}</p>}
    </div>
  );
};

export default AddShop;