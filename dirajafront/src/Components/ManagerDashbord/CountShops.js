import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faStore } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import '../../Styles/dashbord.css'

const CountShops = () => {
  const [totalShops, setTotalShops] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShopCount = async () => {
      try {
        const response = await axios.get('http://16.171.22.129/diraja/totalshops', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setTotalShops(response.data["total shops"]);
      } catch (error) {
        console.error('Error fetching shop count:', error);
        setError('Error fetching shop count');
      }
    };

    fetchShopCount();
  }, []);

  return (
    <div className='metrix-container'>
       <FontAwesomeIcon  className="metric-icon" icon={faStore} size="1x"  />
      <h5>Number of Shops</h5>
      {error ? (
        <p>{error}</p>
      ) : (
        <h1>{totalShops !== null ? ` ${totalShops}` : 'Loading...'}</h1>
      )}
      <Link to="/allshops">View Shops</Link>
    </div>
  );
};

export default CountShops;
