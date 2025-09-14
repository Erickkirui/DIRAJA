import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import '../../Styles/dashbord.css';
import LoadingAnimation from '../LoadingAnimation';


const CountShops = () => {
  const [totalShops, setTotalShops] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShopCount = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.get('api/diraja/totalshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        // Simulate a 3-second delay
        setTimeout(() => {
          setTotalShops(response.data['total shops']);
          setLoading(false); // Stop loading
        }, 3000);
      } catch (error) {
        console.error('Error fetching shop count:', error);
        setError('Error fetching shop count');
        setLoading(false); // Stop loading even on error
      }
    };

    fetchShopCount();
  }, []);

  return (
    <div className="metrix-container">
      <FontAwesomeIcon className="metric-icon" icon={faStore} size="1x" />
      <p>Number of Shops</p>
      {loading ? (
        <LoadingAnimation /> // Show the loading animation while loading
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalShops !== null ? ` ${totalShops}` : 'No data available'}</h1>
      )}
      <Link to="/allshops">View Shops</Link>
    </div>
  );
};

export default CountShops;
