import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import LoadingAnimation from '../LoadingAnimation';

const CashAtHand = () => {
  const [cashAmount, setCashAmount] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchCashAtHand = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const userName = localStorage.getItem('username');
        const shopId = localStorage.getItem('shop_id');

        if (!accessToken || !userName || !shopId) {
          setError('No access token or required IDs found, please log in.');
          setIsLoading(false);
          return;
        }

        const res = await axios.get(`https://kulima.co.ke/api/diraja/cashsaleperuser/${userName}/${shopId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        setCashAmount(res.data.total_cash_sales);
        setLastUpdated(new Date().toLocaleTimeString());
        setError('');
      } catch (err) {
        setError('Error fetching cash at hand');
        setCashAmount(null);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchCashAtHand();

    // Refresh every 5 minutes to keep data current
    const interval = setInterval(fetchCashAtHand, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="metrix-container">
      <div className="metric-top">
        <FontAwesomeIcon className="metric-icon" icon={faCashRegister} size="1x" />
        <div className="controls">
          <small>Updated: {lastUpdated}</small>
        </div>
      </div>

      <p>Cash at Hand</p>

      {isLoading ? (
        <LoadingAnimation />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <h1>{cashAmount !== null ? cashAmount : 'Ksh 0.00'}</h1>
      )}

      {/* <div className="metric-actions">
        <Link to="/shopsales" className="btn-link">View Sales</Link>
        <Link to="/cashdeposit" className="btn-link">Make Deposit</Link>
      </div> */}
    </div>
  );
};

export default CashAtHand;