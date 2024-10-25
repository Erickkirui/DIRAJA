import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CountEmployees = () => {
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await axios.get('/diraja/totalemployees', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setTotalEmployees(response.data["total employees"]);
      } catch (error) {
        console.error('Error fetching employee count:', error);
        setError('Error fetching employee count');
      }
    };

    fetchEmployeeCount();
  }, []);

  return (
    <div>
      <h2>Total Employees</h2>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>{totalEmployees !== null ? ` ${totalEmployees}` : 'Loading...'}</p>
      )}
    </div>
  );
};

export default CountEmployees;
