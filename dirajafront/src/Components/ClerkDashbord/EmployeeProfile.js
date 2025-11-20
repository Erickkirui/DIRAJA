import React, { useState, useEffect } from 'react';
import GeneralTableLayout from '../GeneralTableLayout';
import '../../Styles/employees.css'

function EmployeeProfile() {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        
        // Get employee ID from localStorage
        const user_id = localStorage.getItem('users_id');
        
        if (!user_id) {
          throw new Error('User not found in localStorage');
        }

        const response = await fetch(`/api/diraja/employees-merit/${user_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Add any required authentication headers here
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employee data: ${response.status}`);
        }

        const data = await response.json();
        setEmployeeData(data);
        
      } catch (err) {
        setError(err.message);
        console.error('Error fetching employee data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  // Get first letter for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Define columns for the ledger table
  const ledgerColumns = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => <span className="ledger-date">{formatDate(item.date)}</span>
    },
    {
      key: 'reason',
      header: 'Reason'
    },
    {
      key: 'point_value',
      header: 'Points',
      render: (item) => (
        <span className={`point-value ${item.point_value >= 0 ? 'positive' : 'negative'}`}>
          {item.point_value >= 0 ? '+' : ''}{item.point_value}
        </span>
      )
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="employee-profile">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading employee data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="employee-profile">
        <div className="error-state">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  // No data state
  if (!employeeData) {
    return (
      <div className="employee-profile">
        <div className="no-data-state">
          <h3>No Employee Data Found</h3>
          <p>Unable to load employee profile information.</p>
        </div>
      </div>
    );
  }

  const { employee, ledger_history } = employeeData;

  return (
    <div className="employee-profile">
      {/* Employee Header */}
      <div className="employee-header">
  <div className="employee-banner">

    {/* Avatar with Initial */}
    <div className="employee-photo-wrapper">
      <div className="employee-initial">
        {employee.name.charAt(0).toUpperCase()}
      </div>
    </div>
  </div>
  <div className="employee-details">
      <h1 className="employee-name">{employee.name}</h1>
    </div>
</div>

      {/* Points Display */}
      <div className="points-card">
  <div className="points-circle">
    <svg className="progress-ring" width="60" height="60">
      <circle
        className="progress-ring-bg"
        strokeWidth="6"
        cx="30"
        cy="30"
        r="24"
      />
      <circle
        className="progress-ring-prog"
        strokeWidth="6"
        cx="30"
        cy="30"
        r="24"
        style={{
          strokeDasharray: `${2 * Math.PI * 24}px`,
          strokeDashoffset: `${
            (1 - employee.current_merit_points / 100) *
            (2 * Math.PI * 24)
          }px`
        }}
      />
    </svg>

    <div className="points-icon">
      👍
    </div>
  </div>

  <div className="points-info">
    <span className="points-label-small">Your points</span>
    <div className="points-value-row">
      <span className="points-current">{employee.current_merit_points}</span>
      <span className="points-max">/100</span>
    </div>
  </div>

  <div className="points-arrow">›</div>
</div>


      {/* Ledger History */}
      <div className="ledger-section">
        <h2>Ledger History</h2>
        {ledger_history && ledger_history.length > 0 ? (
          <GeneralTableLayout
            data={ledger_history}
            columns={ledgerColumns}
          />
        ) : (
          <div className="no-ledger-data">
            <p>No ledger history available.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeProfile;