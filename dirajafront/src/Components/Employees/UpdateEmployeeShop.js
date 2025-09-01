import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Snackbar, SnackbarContent } from '@mui/material'; // Import Material-UI components

const UpdateEmployeeShop = ({ selectedEmployees, onUpdate }) => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // State to handle message
  const [messageType, setMessageType] = useState(''); // State to handle message type (success/error)

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          alert('No access token found, please log in.');
          return;
        }

        const response = await axios.get('https://kulima.co.ke/api/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setShops(response.data);
      } catch (error) {
        console.error('Error fetching shops:', error);
        setMessageType('error');
        setMessage('Failed to load shops. Please try again.');
        setTimeout(() => setMessage(''), 6000); // Clear the message after 3 seconds
      }
    };

    fetchShops();
  }, []);

  const handleUpdateShop = async () => {
    if (!selectedShop || selectedEmployees.length === 0) {
      setMessageType('error');
      setMessage('Please select a shop and at least one employee.');
      setTimeout(() => setMessage(''), 6000); // Clear the message after 3 seconds
      return;
    }

    setLoading(true);
    const accessToken = localStorage.getItem('access_token');

    try {
      await Promise.all(
        selectedEmployees.map((employeeId) =>
          axios.put(`https://kulima.co.ke/api/diraja/update-shop/${employeeId}`,
            { shop_id: selectedShop },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          )
        )
      );
      setMessageType('success');
      setMessage('Shop updated successfully!');
      setTimeout(() => setMessage(''), 3000); // Clear the message after 3 seconds
      onUpdate();
    } catch (error) {
      console.error('Error updating shop:', error);
      setMessageType('error');
      setMessage('Failed to update shop. Please try again.');
      setTimeout(() => setMessage(''), 3000); // Clear the message after 3 seconds
    }
    setLoading(false);
  };

  return (
    <div className="update-employee-shop">
      <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)}>
        <option value="">Select a Shop</option>
        {shops.map((shop) => (
          <option key={shop.shop_id} value={shop.shop_id}>{shop.shopname}</option>
        ))}
      </select>
      <button onClick={handleUpdateShop} disabled={loading}>
        {loading ? 'Updating...' : 'Change Shop'}
      </button>

      {/* Snackbar for showing success or error messages */}
      <Snackbar
        open={message !== ''}
        autoHideDuration={3000}
        onClose={() => setMessage('')}
      >
        <SnackbarContent
          message={message}
          style={{
            backgroundColor: messageType === 'success' ? 'green' : 'red',
            color: 'white',
          }}
        />
      </Snackbar>
    </div>
  );
};

export default UpdateEmployeeShop;
