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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/diraja/login', { email, password });

      const { access_token, refresh_token, username, role, shop_id } = response.data;

      // Store the data in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      if (shop_id) {
        localStorage.setItem('shop_id', shop_id);
      }

      // Reset the form and clear any previous errors
      setEmail('');
      setPassword('');
      setError('');

      // Redirect based on the user's role
      if (role === 'manager') {
        window.location.href = '/';
      } else if (role === 'clerk') {
        window.location.href = '/clerkDashboard';
      }
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
          <FontAwesomeIcon  icon={faRightToBracket} size="0x" />
        </button>
      </form>
    </div>
  );
};

export default Login;
