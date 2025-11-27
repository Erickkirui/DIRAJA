import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightToBracket } from '@fortawesome/free-solid-svg-icons';
import "../Styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUserPermissions = async (userId, accessToken) => {
    try {
      const response = await axios.get(`/api/diraja/permissions/user/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        const userPermissions = response.data.permissions;
        // Store permissions in localStorage
        localStorage.setItem('user_permissions', JSON.stringify(userPermissions));
        return userPermissions;
      } else {
        console.error('Failed to fetch permissions:', response.status);
        return {};
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return {};
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('api/diraja/login', { email, password });

      const { access_token, refresh_token, username, users_id, role, shop_id, report_status, designation } = response.data;

      // Store the basic data in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('username', username);
      localStorage.setItem('users_id', users_id);
      localStorage.setItem('role', role);
      localStorage.setItem('report_status', report_status);
      
      if (shop_id) {
        localStorage.setItem('shop_id', shop_id);
      }
      if (designation) {
        localStorage.setItem('designation', designation);
      }

      // Fetch and store user permissions
      const userPermissions = await fetchUserPermissions(users_id, access_token);
      localStorage.setItem('user_permissions', JSON.stringify(userPermissions));

      // Reset the form and clear any previous errors
      setEmail('');
      setPassword('');
      setError('');

      // Determine redirect path based on role and permissions
      let redirectPath = '/';
      
      if (role === 'manager') {
        // Check if user has Dashboard permission
        if (userPermissions.Dashboard === false) {
          redirectPath = '/allinventory';
        } else {
          redirectPath = '/';
        }
      } else if (role === 'clerk') {
        redirectPath = '/clerk';
      } else if (role === 'procurement') {
        redirectPath = '/procurement';
      }

      // Redirect to the determined path
      window.location.href = redirectPath;

    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Account Login</h2>

      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleLogin} className="login-form">
        <label>Email</label>
        <input
          type="email"
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input-field"
        />

        <label>Password</label>
        <div className="password-container">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-field"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="show-hide-button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" className="submit-button">
          <span>Login</span>
          <FontAwesomeIcon icon={faRightToBracket} size="0x" />
        </button>
      </form>
    </div>
  );
};

export default Login;