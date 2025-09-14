import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import '../../Styles/dashbord.css';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';


const CountEmployees = () => {
  const [totalEmployees, setTotalEmployees] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Track loading state

  useEffect(() => {
    const fetchEmployeeCount = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await axios.get('api/diraja/totalemployees', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });

        // Simulate a 3-second delay
        setTimeout(() => {
          setTotalEmployees(response.data['total employees']);
          setIsLoading(false); // Stop loading
        }, 3000);
      } catch (error) {
        console.error('Error fetching employee count:', error);
        setError('Error fetching employee count');
        setIsLoading(false); // Stop loading even on error
      }
    };

    fetchEmployeeCount();
  }, []);

  return (
    <div className='metrix-container'>
      <FontAwesomeIcon className="metric-icon" icon={faPeopleGroup} size="1x" />
      <p>Number of Employees</p>
      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalEmployees !== null ? `${totalEmployees}` : 'Loading...'}</h1>
      )}
      <Link to="/allemployees">View Employees</Link>
    </div>
  );
};

export default CountEmployees;
