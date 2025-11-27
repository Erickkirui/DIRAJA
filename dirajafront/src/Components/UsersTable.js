import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Stack, Alert } from '@mui/material';
import { faPen, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import GeneralTableLayout from './GeneralTableLayout';
import SingleUser from './Settings/SingleUser';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [selectedUserId, setSelectedUserId] = useState(null); // Add this state

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('api/diraja/allusers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch users');

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleEditClick = (userId) => {
    setIsEditing(userId);
    setNewPassword('');
  };

  const handleSaveClick = async (userId) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessageType('error');
      setMessage(
        'Password must be at least 8 characters long, contain one uppercase letter, one digit, and one special character.'
      );
      return;
    }

    try {
      const response = await fetch(`api/diraja/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update password');
      }

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, password: newPassword } : user
        )
      );

      setIsEditing(null);
      setMessageType('success');
      setMessage('Password updated successfully.');
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    }
  };

  const handleDeleteClick = async (userId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this user?');
    if (!confirmDelete) return;

    try {
      const response = await fetch(`api/diraja/user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user.user_id !== userId));

      setMessageType('success');
      setMessage('User deleted successfully.');
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    }
  };

  // Define columns for the GeneralTableLayout
  const columns = [
   
    {
      header: 'Username',
      key: 'username',
    },
    {
      header: 'Email',
      key: 'email',
    },
    {
      header: 'Password',
      key: 'password',
      render: (user) => {
        if (isEditing === user.user_id) {
          return (
            <div>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '4px' }}
              />
              <small style={{ color: 'gray', fontSize: '0.8rem', display: 'block' }}>
                Password must have at least 8 characters, one uppercase letter, one digit, and one special character.
              </small>
            </div>
          );
        }
        return '********';
      },
    },
    {
      header: 'Role',
      key: 'role',
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (user) => {
        if (isEditing === user.user_id) {
          return (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="editeInventory" 
                onClick={() => handleSaveClick(user.user_id)}
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <FontAwesomeIcon icon={faSave} /> Save
              </button>
              <button 
                className="editeInventory" 
                onClick={() => setIsEditing(null)}
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="editeInventory" 
              onClick={() => setSelectedUserId(user.user_id)}
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <FontAwesomeIcon icon={faPen} /> Edit
            </button>
            <button 
              className="editeInventory" 
              onClick={() => handleDeleteClick(user.user_id)}
              style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      {message && (
        <Stack sx={{ marginBottom: 2 }}>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <div className="sale-details">
        <h1>All Users</h1>
        <GeneralTableLayout
          data={users}
          columns={columns}
          // You can optionally pass onEdit and onDelete handlers if needed
          // onEdit={(user) => handleEditClick(user.user_id)}
          // onDelete={(user) => handleDeleteClick(user.user_id)}
        />
      </div>

      {/* Single User Panel */}
      {selectedUserId && (
        <SingleUser
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdate={(updatedUser) => {
            // Update the user in the table
            setUsers(prev => prev.map(user => 
              user.user_id === updatedUser.user_id ? updatedUser : user
            ));
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default UsersTable;