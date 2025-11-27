import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShield, faSave, faCheck } from '@fortawesome/free-solid-svg-icons';


const Permissions = ({ userId }) => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Define all available permissions with their display names
  const permissionFields = [
    { key: 'Dashboard', label: 'Dashboard' },
    { key: 'Stock', label: 'Stock' },
    { key: 'Sales', label: 'Sales' },
    { key: 'Sales_analytics', label: 'Sales Analytics' },
    { key: 'Expenses', label: 'Expenses' },
    { key: 'Mabanda_Farm', label: 'Mabanda Farm' },
    { key: 'Shops', label: 'Shops' },
    { key: 'Employess', label: 'Employees' },
    { key: 'Suppliers', label: 'Suppliers' },
    { key: 'Creditors', label: 'Creditors' },
    { key: 'Task_manager', label: 'Task Manager' },
    { key: 'Accounting', label: 'Accounting' }
  ];

  useEffect(() => {
    if (userId) {
      fetchPermissions();
    }
  }, [userId]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        // If permissions not found, create default permissions
        if (response.status === 404) {
          await createDefaultPermissions();
          return;
        }
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setPermissions(data.permissions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPermissions = async () => {
    try {
      const defaultPermissions = {
        Dashboard: false,
        Stock: false,
        Sales: false,
        Sales_analytics: false,
        Expenses: false,
        Mabanda_Farm: false,
        Shops: false,
        Employess: false,
        Suppliers: false,
        Creditors: false,
        Task_manager: false,
        Accounting: false
      };

      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(defaultPermissions),
      });

      if (!response.ok) throw new Error('Failed to create permissions');

      const data = await response.json();
      setPermissions(data.permissions);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePermissionChange = (permissionKey) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: !prev[permissionKey]
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setMessage('');

      const response = await fetch(`/api/diraja/permissions/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(permissions),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update permissions');
      }

      setMessage('Permissions updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    const allTrue = {};
    permissionFields.forEach(field => {
      allTrue[field.key] = true;
    });
    setPermissions(allTrue);
  };

  const handleSelectNone = () => {
    const allFalse = {};
    permissionFields.forEach(field => {
      allFalse[field.key] = false;
    });
    setPermissions(allFalse);
  };

  if (loading) return <div className="permissions-loading">Loading permissions...</div>;
  if (error) return <div className="permissions-error">Error: {error}</div>;
  if (!permissions) return <div className="permissions-error">No permissions found</div>;

  return (
    <div className="permissions-section">
      <div className="section-header">
        <FontAwesomeIcon icon={faShield} className="section-icon" />
        <h3>User Permissions</h3>
        <div className="permission-actions">
          <button 
            className="select-all-btn" 
            onClick={handleSelectAll}
            disabled={saving}
          >
            Select All
          </button>
          <button 
            className="select-none-btn" 
            onClick={handleSelectNone}
            disabled={saving}
          >
            Select None
          </button>
        </div>
      </div>

      {message && (
        <div className={`permission-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="permissions-grid">
        {permissionFields.map((field) => (
          <div key={field.key} className="permission-item">
            <label className="permission-checkbox">
              <input
                type="checkbox"
                checked={permissions[field.key] || false}
                onChange={() => handlePermissionChange(field.key)}
                disabled={saving}
              />
              <span className="checkmark"></span>
              <span className="permission-label">{field.label}</span>
            </label>
          </div>
        ))}
      </div>

      <div className="permissions-actions">
        <button 
          className="save-permissions-btn" 
          onClick={handleSavePermissions}
          disabled={saving}
        >
          {saving ? (
            <>
              <FontAwesomeIcon icon={faCheck} /> Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} /> Save Permissions
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Permissions;