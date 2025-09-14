import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LoadingAnimation from '../LoadingAnimation';

const SalesLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]); // To store leaderboard data
  const [loading, setLoading] = useState(true); // To track loading state
  const [error, setError] = useState(''); // To store any error messages

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('api/diraja/leaderboard/employee', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        });

        setLeaderboard(response.data); // Set the leaderboard data in state
        setLoading(false); // Set loading to false once data is fetched
      } catch (err) {
        setError('Failed to fetch leaderboard data'); // Set error message if request fails
        setLoading(false); // Set loading to false if there's an error
      }
    };

    fetchLeaderboard(); // Fetch leaderboard data on component mount
  }, []);

  return (
    <div className="leaderboard-container">
      <h3>Employee Sales Leaderboard</h3>
      {loading ? (
        <p><LoadingAnimation /></p> // Show loading text while data is being fetched
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p> // Show error message if there was an issue fetching data
      ) : (
        <table className="employees-table">
          <thead>
            <tr>
              <th>Position</th> {/* Column for numbering */}
              <th>Employee Name</th>
              <th>Total Sales</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length > 0 ? (
              leaderboard.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td> {/* Display the row number */}
                  <td>{item.employee_name}</td>
                  <td>{item.total_sales}</td>
                  <td>{item.total_amount} ksh</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No leaderboard data available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalesLeaderboard;
