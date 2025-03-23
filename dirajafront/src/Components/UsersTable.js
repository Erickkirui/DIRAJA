import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Stack, Alert } from '@mui/material'; // Import the necessary components
import { faPen, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null); // Holds the ID of the user being edited
  const [newPassword, setNewPassword] = useState(''); // Holds the new password input
  const [message, setMessage] = useState(''); // State for success/error message
  const [messageType, setMessageType] = useState('success'); // Type for the message (success or error)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/diraja/allusers', {
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
    setIsEditing(userId); // Set the user ID being edited
    setNewPassword(''); // Reset the password input
  };

  const handleSaveClick = async (userId) => {
    // Check if password meets the requirements
    const passwordRegex = /[A-Z]/; // Check if password contains at least one capital letter
    if (newPassword.length < 8 || !passwordRegex.test(newPassword)) {
      setMessageType('error');
      setMessage('Password must be at least 8 characters long and contain at least one capital letter.');
      return; // Prevent saving if password doesn't meet requirements
    }

    try {
      const response = await fetch(`/api/diraja/user/${userId}`, {
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

      // Update the users state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, password: newPassword } : user
        )
      );

      // Exit edit mode and show success message
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
      const response = await fetch(`/api/diraja/user/${userId}`, {
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

      // Remove the deleted user from the state
      setUsers((prevUsers) => prevUsers.filter((user) => user.user_id !== userId));

      // Show success message
      setMessageType('success');
      setMessage('User deleted successfully.');
    } catch (err) {
      setMessageType('error');
      setMessage(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      {message && (
        <Stack>
          <Alert severity={messageType} variant="outlined">
            {message}
          </Alert>
        </Stack>
      )}

      <div className="sale-details">
        <h1>All Users</h1>
        <table className="employees-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Password</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.user_id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {isEditing === user.user_id ? (
                    <input
                      value={newPassword} // Shows the typed password
                      onChange={(e) => setNewPassword(e.target.value)} // Updates state as the user types
                      placeholder="Enter new password"
                    />
                  ) : (
                    '********'
                  )}
                </td>
                <td>{user.role}</td>
                <td>
                  {isEditing === user.user_id ? (
                    <>
                      <button className="editeInventory" onClick={() => handleSaveClick(user.user_id)}>
                        <FontAwesomeIcon icon={faSave} /> Save
                      </button>
                      <button  className="editeInventory" onClick={() => setIsEditing(null)}>
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button  className="editeInventory" onClick={() => handleEditClick(user.user_id)}>
                        <FontAwesomeIcon icon={faPen} /> Edit
                      </button>
                      
                      <button className="editeInventory" onClick={() => handleDeleteClick(user.user_id)}>
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </button>
                    </>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
