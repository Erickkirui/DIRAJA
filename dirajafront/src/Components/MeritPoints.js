import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import GeneralTableLayout from './GeneralTableLayout';
import '../Styles/employees.css';

const MeritPointsTable = () => {
  const [meritPoints, setMeritPoints] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMeritPoints = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allmeritpoints', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setMeritPoints(response.data);
      } catch (err) {
        console.error('Error fetching merit points:', err);
        setError('Failed to load merit points.');
      }
    };

    fetchMeritPoints();
  }, []);

  const columns = [
    { header: 'No', key: 'id' },
    { header: 'Reason', key: 'reason' },
    { header: 'Points', key: 'point' },
  ];

  return (
    <div className="page-container">
      <div className="header-row">
        <h2>Merit & Demerit Points Records</h2>
        <Link className="add-button" to="/newmeritpoint">
          New merit/demerit points
        </Link>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <GeneralTableLayout data={meritPoints} columns={columns} />
    </div>
  );
};

export default MeritPointsTable;
