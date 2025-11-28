import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "../Styles/UserDisplay.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

const UserDisplay = () => {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const shopId = localStorage.getItem('shop_id')
  const userId = localStorage.getItem('user_id')


  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    

    
    if (!storedUsername || !storedRole) {
      navigate('/login');
    } else {
      setUsername(storedUsername);
      setRole(storedRole);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  const handleMenuClick = () => {
    setShowDropdown(false); // Close dropdown when a menu item is clicked
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!username || !role) {
    return null;
  }

  const firstLetter = username.charAt(0).toUpperCase();
  const dropdownIcon = showDropdown ? faChevronUp : faChevronDown;

  return (
    <div className="user-display">
      <div className="circle">{firstLetter}</div>
      <div className="user-info">
        <p className="username">{username} <span>({role})</span></p>
      </div>
      <div className={`dropdown-container ${showDropdown ? 'active' : ''}`} ref={dropdownRef}>
        <FontAwesomeIcon 
          onClick={toggleDropdown} 
          className="dropdown-button" 
          icon={dropdownIcon} 
          size="1x" 
        />
        {showDropdown && (
          <div className="dropdown-menu">
            {role === 'clerk' && <Link to="/clerk" onClick={handleMenuClick}>Home</Link>}
            {role === 'clerk' && <Link to="/profile" onClick={handleMenuClick}>Profile</Link>}
            {/* Items visible only to clerks of a specific shop */}
            {role === 'clerk' && shopId === "12" && (
              <>
                <Link to="/mabandastocks" onClick={handleMenuClick}>View Stock</Link>
                <Link to="/mabandaexpenses" onClick={handleMenuClick}>view Expenses</Link>
                <Link to="/mabandapurchases" onClick={handleMenuClick}>view Purchases</Link>

              </>
            )}

            { /* Items visible only to user ID 3 */ }
            {userId === "3" && (
              <>
                  <Link to="/mabandaexpense" onClick={handleMenuClick}>Add Mabanda Expense</Link>
                  <Link to="/mabandapurchase" onClick={handleMenuClick}>Add Mabanda Purchases</Link>
              </>
            )}
            {/* {(username === "External Auditor" || username === 'Leo' || username === 'Dancan') && (
              <>
                  <Link to="/allsales" onClick={handleMenuClick}>View Sales</Link>
              </>
            )} */}

            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDisplay;
