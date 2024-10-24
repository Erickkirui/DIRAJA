import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // If using react-router
import "../Styles/UserDisplay.css"; // Your CSS file for styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faChevronDown } from '@fortawesome/free-solid-svg-icons';

const UserDisplay = () => {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedRole = localStorage.getItem('role');
    setUsername(storedUsername);
    setRole(storedRole);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
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

  return (
    <div className="user-display">
      <div className="circle">{firstLetter}</div>
      <div className="user-info">
        <p className="username">{username} <span>({role})</span></p>
      </div>
      <div className={`dropdown-container ${showDropdown ? 'active' : ''}`} ref={dropdownRef}>
        <FontAwesomeIcon onClick={toggleDropdown} className="dropdown-button" icon={faChevronDown} size="1x"  />
        <div className="dropdown-menu">
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default UserDisplay;
