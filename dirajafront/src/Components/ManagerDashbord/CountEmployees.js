import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import '../../Styles/dashbord.css'
import { Link } from 'react-router-dom';

const CountEmployees = () => {
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      try {
        const response = await axios.get('/api/diraja/totalemployees', {
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
    <div className='metrix-container'>
      <FontAwesomeIcon  className="metric-icon" icon={faPeopleGroup} size="1x"  />
      <h5>Number of Employees</h5>
      {error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalEmployees !== null ? ` ${totalEmployees}` : 'Loading...'}</h1>
      )}
      <Link to="/allemployees">View Employees</Link>
    </div>
  );
};

export default CountEmployees;
