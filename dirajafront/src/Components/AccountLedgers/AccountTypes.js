import React, { useEffect, useState } from 'react';
import AddAccountType from './AddAccountType';
import TableComponent from './TableComponent'; // adjust path as needed
import { Alert, Stack } from '@mui/material';

function AccountTypes() {
  const [accountTypes, setAccountTypes] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    const fetchAccountTypes = async () => {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setMessageType('error');
        setMessage('Authentication required');
        return;
      }

      try {
        const response = await fetch('/api/diraja/account-types/all', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAccountTypes(data);
        } else {
          const errorData = await response.json();
          setMessageType('error');
          setMessage(errorData.message || 'Failed to fetch account types');
        }
      } catch (err) {
        setMessageType('error');
        setMessage('Something went wrong');
        console.error(err);
      }
    };

    fetchAccountTypes();
  }, []);

  const tableColumns = ['ID', 'Name', 'Type'];

  return (
    <div>
      <AddAccountType />

      {message && (
        <Stack sx={{ my: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <h2 className="mt-4 mb-2">Account Types</h2>
      <TableComponent columns={tableColumns} data={accountTypes} />
    </div>
  );
}

export default AccountTypes;
