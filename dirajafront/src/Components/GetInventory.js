import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/allinventories', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });

        setInventory(response.data); // Store the fetched inventory
      } catch (err) {
        setError('Error fetching inventory. Please try again.');
      }
    };

    fetchInventory(); // Fetch inventory when component loads
  }, []);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Change the current page
  };

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInventory = inventory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(inventory.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="inventory-container">
    
      {inventory.length > 0 ? (
        <>
          <table className="inventory-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item </th> 
                <th>Initial quantity</th> 
                <th>Remaining quantity</th>
                <th>Unit cost</th>
                <th>Total cost(ksh)</th>
                <th>Amount paid(ksh)</th>
                {/* <th>Balance(ksh)</th> */}
                <th>Unit price(ksh)</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {currentInventory.map((inventory) => (
                <tr key={inventory.inventory_id}>
                  <td>{inventory.inventory_id}</td>
                  <td>{inventory.itemname}</td>
                  <td>{inventory.initial_quantity} {inventory.metric}</td>
                  <td>{inventory.quantity} {inventory.metric}</td>
                  <td>{inventory.unitCost}</td>
                  <td>{inventory.totalCost}</td>
                  <td>{inventory.amountPaid}</td>
                  <td>{inventory.unitPrice}</td>
                  <td>{new Date(inventory.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p>No inventory found.</p>
      )}
    </div>
  );
};

export default Inventory;
