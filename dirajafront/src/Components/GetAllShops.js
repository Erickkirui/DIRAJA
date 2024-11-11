import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel'; // Correct path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Correct path
import '../Styles/shops.css';

const Shops = () => {
  const [shops, setShops] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shopsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedShops, setSelectedShops] = useState([]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }
        const response = await axios.get('/api/diraja/allshops', {
          headers: { Authorization: `Bearer ${accessToken}` },
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

  const handleCheckboxChange = (shopId) => {
    setSelectedShops((prevSelected) =>
      prevSelected.includes(shopId)
        ? prevSelected.filter((id) => id !== shopId)
        : [...prevSelected, shopId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShops.length === shops.length) {
      setSelectedShops([]);
    } else {
      setSelectedShops(shops.map((shop) => shop.shop_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (selectedAction === 'delete') {
      await Promise.all(
        selectedShops.map((shopId) =>
          axios.delete(`/api/diraja/shop/${shopId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setShops((prev) => prev.filter((shop) => !selectedShops.includes(shop.shop_id)));
      setSelectedShops([]);
      setSelectedAction('');
    }
  };

  // Filtering shops based on search term and date
  const filteredShops = shops.filter((shop) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      shop.shopname.toLowerCase().includes(searchString) ||
      shop.employee.toLowerCase().includes(searchString);
    const matchesDate =
      selectedDate === '' || new Date(shop.created_at).toISOString().split('T')[0] === selectedDate;
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = filteredShops.slice(indexOfFirstShop, indexOfLastShop);

  const totalPages = Math.ceil(filteredShops.length / shopsPerPage);

  if (loading) {
    return <p>Loading shops...</p>;
  }

  return (
    <div className="shops-container">
     

      <input
        type="text"
        placeholder="Search by shop name or employee"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />
      <div className='actions-container'>
      <div className="actions">
        <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
          <option value="">With selected, choose an action</option>
          <option value="delete">Delete</option>
        </select>
        <button onClick={handleAction} className="action-button">
          Apply
        </button>
      </div>
       {/* Export to Excel/PDF functionality */}
       
        <ExportExcel data={shops} fileName="ShopsData" />
        <DownloadPDF tableId="shops-table" fileName="ShopsData" />
     

      </div>
     

      {/* Display error message */}
      {error && <div className="error-message">{error}</div>}

      <table id="shops-table" className="shops-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedShops.length === shops.length}
              />
            </th>
            <th>ID</th>
            <th>Employee</th>
            <th>Shop Name</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {currentShops.length > 0 ? (
            currentShops.map((shop) => (
              <tr key={shop.shop_id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedShops.includes(shop.shop_id)}
                    onChange={() => handleCheckboxChange(shop.shop_id)}
                  />
                </td>
                <td>{shop.shop_id}</td>
                <td>
                  <div className="employee-info">
                    <div className="employee-icon">
                      {shop.employee.charAt(0).toUpperCase()}
                    </div>
                    <span className="employee-name">{shop.employee}</span>
                  </div>
                </td>
                <td>{shop.shopname}</td>
                <td>{shop.shopstatus}</td>
                <td>{new Date(shop.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No shops available</td>
            </tr>
          )}
        </tbody>
      </table>

      

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;
