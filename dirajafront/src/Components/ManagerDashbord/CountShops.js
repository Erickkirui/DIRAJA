import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CountShops = () => {
  const [totalShops, setTotalShops] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShopCount = async () => {
      try {
        const response = await axios.get('/diraja/totalshops', {
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
    <div>
      <h2>Total Shops</h2>
      {error ? (
        <p>{error}</p>
      ) : (
        <p>{totalShops !== null ? ` ${totalShops}` : 'Loading...'}</p>
      )}
    </div>
  );
};

export default CountShops;
