import React, { useState, useEffect } from 'react';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null); // Holds the ID of the user being edited
  const [newPassword, setNewPassword] = useState(''); // Holds the new password input

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
    try {
      const response = await fetch(`/api/diraja/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) throw new Error('Failed to update password');

      // Update the users state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.user_id === userId ? { ...user, password: newPassword } : user
        )
      );

      // Exit edit mode
      setIsEditing(null);
    } catch (err) {
      console.error('Error updating password:', err);
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

      if (!response.ok) throw new Error('Failed to delete user');

      // Remove the deleted user from the state
      setUsers((prevUsers) => prevUsers.filter((user) => user.user_id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="single-sale-container">
      <div className="sale-details">
        <h1>All Users</h1>
        <table className="sale-details-table">
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
                      <button onClick={() => handleSaveClick(user.user_id)}>Save</button>
                      <button onClick={() => setIsEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditClick(user.user_id)}>Edit</button>
                      <button onClick={() => handleDeleteClick(user.user_id)}>Delete</button>
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
