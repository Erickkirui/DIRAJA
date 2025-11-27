import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faEdit, faUser, faEnvelope, faKey, faShield } from '@fortawesome/free-solid-svg-icons';
import Permissions from './Permission';
import '../../Styles/SingleUser.css'; // We'll create this CSS file

const SingleUser = ({ userId, onClose, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: ''
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/diraja/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch user');

      const userData = await response.json();
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        password: '',
        role: userData.role || ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
    
    if (formData.password && !passwordRegex.test(formData.password)) {
      alert('Password must be at least 8 characters long, contain one uppercase letter, one digit, and one special character.');
      return;
    }

    try {
      const updateData = { 
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      
      // Only include password if it's been changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/diraja/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
      if (onUpdate) onUpdate(updatedUser);
      
      alert('User updated successfully!');
    } catch (err) {
      alert(`Error updating user: ${err.message}`);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role
      });
    }
    setIsEditing(false);
  };

  if (!userId) return null;

  if (loading) return (
    <div className="single-user-overlay">
      <div className="single-user-panel">
        <div className="loading">Loading user details...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="single-user-overlay">
      <div className="single-user-panel">
        <div className="error">Error: {error}</div>
      </div>
    </div>
  );

  return (
    <div className="single-user-overlay">
      <div className="single-user-panel">
        {/* Header */}
        <div className="user-panel-header">
          <h2>User Details</h2>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* User Info Section */}
        <div className="user-info-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faUser} className="section-icon" />
            <h3>User Information</h3>
            {!isEditing && (
              <button 
                className="edit-btn"
                onClick={() => setIsEditing(true)}
              >
                <FontAwesomeIcon icon={faEdit} /> Edit
              </button>
            )}
          </div>

          <div className="info-grid">
            

            <div className="info-item">
              <label>Username</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              ) : (
                <div className="info-value">{user.username}</div>
              )}
            </div>

            <div className="info-item">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="edit-input"
                />
              ) : (
                <div className="info-value">{user.email}</div>
              )}
            </div>
            <Permissions userId={userId} />

            <div className="info-item">
              <label>Role</label>
              {isEditing ? (
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="edit-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              ) : (
                <div className="info-value role-badge">{user.role}</div>
              )}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="user-info-section">
          <div className="section-header">
            <FontAwesomeIcon icon={faKey} className="section-icon" />
            <h3>Security</h3>
          </div>

          <div className="info-grid">
            <div className="info-item full-width">
              <label>Password</label>
              {isEditing ? (
                <div className="password-edit">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="edit-input"
                  />
                  <small className="password-hint">
                    Password must have at least 8 characters, one uppercase letter, one digit, and one special character.
                  </small>
                </div>
              ) : (
                <div className="info-value password-masked">••••••••</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="action-buttons">
            <button className="save-btn" onClick={handleSave}>
              <FontAwesomeIcon icon={faSave} /> Save Changes
            </button>
            <button className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleUser;