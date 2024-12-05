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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get(' /api/diraja/allshops', {


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

      


          axios.delete(` /api/diraja/shop/${shopId}`, {


            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setShops((prev) => prev.filter((shop) => !selectedShops.includes(shop.shop_id)));
      setSelectedShops([]);
      setSelectedAction('');
    } else if (selectedAction === 'edit') {
      if (selectedShops.length !== 1) {
        alert('Please select exactly one shop to edit.');
        return;
      }

      const selectedShop = shops.find((shop) => shop.shop_id === selectedShops[0]);
      setEditData(selectedShop); // Pre-fill form with selected shop's data
      setIsEditModalOpen(true); // Open the modal for editing
    }
  };

  const handleEditSubmit = async () => {
    const accessToken = localStorage.getItem('access_token');
    try {
      await axios.put(`/api/diraja/shop/${editData.shop_id}`, editData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setShops((prev) =>
        prev.map((shop) =>
          shop.shop_id === editData.shop_id ? { ...shop, ...editData } : shop
        )
      );
      alert('Shop updated successfully!');
      setIsEditModalOpen(false);
      setSelectedShops([]);
      setSelectedAction('');
    } catch (err) {
      alert('Error updating shop');
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
            <option value="edit">Edit</option>
          </select>
          <button onClick={handleAction} className="action-button">
            Apply
          </button>
        </div>
        <ExportExcel data={shops} fileName="ShopsData" />
        <DownloadPDF tableId="shops-table" fileName="ShopsData" />
      </div>

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
            <th>Location</th>
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
                <td>{shop.location}</td>
                <td>{shop.shopstatus}</td>
                <td>{new Date(shop.created_at).toLocaleDateString()}</td>
                <td>
                  <a href="https://drive.google.com/drive/folders/168rAjIvTJebWYt1MYqR2du0MIQJdFHZw?usp=sharing" target="_blank" rel="noopener noreferrer">
                    Shop images
                  </a>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No shops available</td>
            </tr>
          )}
        </tbody>
      </table>

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

      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Shop</h2>
            <form>
              <label>Shop Name:</label>
              <input
                type="text"
                value={editData.shopname || ''}
                onChange={(e) => setEditData({ ...editData, shopname: e.target.value })}
              />
              <label>Location:</label>
              <input
                type="text"
                value={editData.location || ''}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              />
              <label>Status:</label>
              <select
                value={editData.shopstatus || ''}
                onChange={(e) => setEditData({ ...editData, shopstatus: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

               <label>Employee incharge:</label>
               <input
                 type="text"
                 value={editData.employee || ''}
                 onChange={(e) => setEditData({ ...editData, employee: e.target.value })}
               />       
              <button type="button" onClick={handleEditSubmit}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shops;
