import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/shopStock.css';

const ShopStock = () => {
  const [stock, setShopStock] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // Current page state
  const [error, setError] = useState('');
  const itemsPerPage = 50; // Items per page

  useEffect(() => {
    const fetchShopStock = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');

        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/diraja/shopstock', {
          headers: {
            Authorization: `Bearer ${accessToken}`  // Use access token
          }
        });
        const stock = Array.isArray(response.data) ? response.data : [];
        setShopStock(stock); // Store the fetched stock
      } catch (err) {
        setError('Error fetching stock. Please try again.');
      }
    };

    fetchShopStock(); // Fetch expenses when component loads
  }, []);



  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber); // Change the current page
  };

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentShopStock = stock.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(stock.length / itemsPerPage);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="stock-container">
      
      {stock.length > 0 ? (
        <>
          <table className="stock-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Shop</th> {/* Display Username */}
                <th>Item</th> {/* Display Shop Name */}
                <th>Batch</th>
                <th>Quantity</th>
                <th>Total cost(ksh)</th>
                <th>Unit price(ksh)</th>
              </tr>
            </thead>
            <tbody>
              {currentShopStock.map((stock) => (
                <tr key={stock.stock_id}>
                  <td>{stock.stock_id}</td>
                  <td>{stock.shop_name}</td>
                  <td>{stock.item_name}</td>
                  <td>{stock.batchnumber}</td>
                  <td>{stock.quantity} {stock.metric}</td>
                  <td>{stock.total_cost}</td>
                  <td>{stock.unit_Price}</td>
                  {/* <td>{new Date(expense.created_at).toLocaleString()}</td> */}
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
        <p>No stock found.</p>
      )}
    </div>
  );
};

export default ShopStock;
