import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GeneralTableLayout from '../GeneralTableLayout';
import { Alert, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../../Styles/employees.css';
import { Link } from 'react-router-dom';


const MeritRecords = () => {
  const [ledgerData, setLedgerData] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // for navigation

  useEffect(() => {
    const fetchMeritLedger = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('https://kulima.co.ke/api/diraja/meritledger', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setLedgerData(response.data.merit_ledger || []);
        setMessageType('success');
        console.log(response.data.entries);
      } catch (error) {
        console.error('Error fetching merit ledger:', error);
        setMessageType('error');
        setMessage(
          error.response?.data?.message || 'Failed to load merit records'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMeritLedger();
  }, []);

  const columns = [
    { header: 'Ledger No', key: 'meritledger_id' },
    { header: 'Employee Name', key: 'employee_name' },
    { header: 'Points awarded', key: 'merit_point' },
    { header: 'Merit Reason', key: 'merit_reason' },
    { header: 'Comment', key: 'comment' },
    {
      header: 'Date',
      key: 'created_at',
      render: (entry) => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    },
    { header: 'Resulting Points', key: 'resulting_points' }
  ];

  return (
    <div className="employees-container">
      <h2>Merit Records</h2>

      {/* Action Buttons */}
      <div className="actions-container" >
        
        <Link className='add-button' to="/meritpoints">Manage merit points</Link>

        <Link className='add-button' to="/assignmeritpoint">Assign merit points</Link>
      </div>

      {/* Alert message */}
      {message && (
        <Stack sx={{ mb: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      {/* Table or loading */}
      {loading ? (
        <p>Loading merit records...</p>
      ) : (
        <GeneralTableLayout data={ledgerData} columns={columns} />
      )}
    </div>
  );
};

export default MeritRecords;
