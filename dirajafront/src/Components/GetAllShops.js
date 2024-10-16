import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/shops.css';


const Shops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token'); // Assuming the token is stored in localStorage
        
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }
        
        const response = await axios.get('/diraja/allshops', {
          headers: {
            Authorization: `Bearer ${accessToken}` // Passing the token in Authorization header
          }
        });

        setShops(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching shops');
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  if (loading) {
    return <p>Loading shops...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="shops-container">
      <h1>All Shops</h1>

      {/* Show error message if there is an error */}
      {error && <div className="error-message">{error}</div>}

      {/* Table for displaying all shops */}
      <table className="shops-table">
        <thead>
          <tr>
            <th>Shop ID</th>
            <th>Shop Name</th>
            <th>Employee</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {shops.length > 0 ? (
            shops.map((shop) => (
              <tr key={shop.shop_id}>
                <td>{shop.shop_id}</td>
                <td>{shop.shopname}</td>
                <td>
                  <div className="employee-info">
                    <div className="employee-icon">
                      {shop.employee.charAt(0).toUpperCase()}
                    </div>
                    <span className="employee-name">{shop.employee}</span>
                  </div>
                </td>
                <td>{shop.shopstatus}</td>
                <td>{new Date(shop.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No shops available</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Placeholder for pagination (optional) */}
      <div className="pagination">
        <button className="page-button">1</button>
        <button className="page-button">2</button>
        <button className="page-button">3</button>
      </div>
    </div>
  );
};

export default Shops;
