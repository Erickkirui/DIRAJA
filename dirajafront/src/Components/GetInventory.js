import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel'; // Correct import path
import DownloadPDF from '../Components/Download/DownloadPDF'; // Correct import path
import '../Styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const itemsPerPage = 50;

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
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setInventory(response.data);
      } catch (err) {
        setError('Error fetching inventory. Please try again.');
      }
    };

    fetchInventory();
  }, []);

  const handleCheckboxChange = (inventoryId) => {
    setSelectedInventory((prevSelected) =>
      prevSelected.includes(inventoryId)
        ? prevSelected.filter((id) => id !== inventoryId)
        : [...prevSelected, inventoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedInventory.length === inventory.length) {
      setSelectedInventory([]);
    } else {
      setSelectedInventory(inventory.map((inventory) => inventory.inventory_id));
    }
  };

  const handleAction = async () => {
    const accessToken = localStorage.getItem('access_token');

    if (selectedAction === 'delete') {
      await Promise.all(
        selectedInventory.map((inventoryId) =>
          axios.delete(`/diraja/inventory/${inventoryId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
        )
      );
      setInventory((prev) =>
        prev.filter((inventory) => !selectedInventory.includes(inventory.inventory_id))
      );
      setSelectedInventory([]);
      setSelectedAction('');
    }
  };

  // Filter inventory based on the search query and date range
  const filteredInventory = inventory.filter((inventoryItem) => {
    const searchString = searchTerm.toLowerCase();
    const matchesSearch =
      inventoryItem.itemname.toLowerCase().includes(searchString) ||
      inventoryItem.batchnumber.toLowerCase().includes(searchString) ||
      inventoryItem.note.toLowerCase().includes(searchString);

    const matchesDateRange =
      selectedDate === '' || new Date(inventoryItem.created_at).toISOString().split('T')[0] === selectedDate;

    return matchesSearch && matchesDateRange;
  });

  const currentInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="inventory-container">
      <div className="actions">
        <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
          <option value="">With selected, choose an action</option>
          <option value="delete">Delete</option>
        </select>
        <button onClick={handleAction} className="action-button">Apply</button>
      </div>

      <input
        type="text"
        placeholder="Search by item, batch number, or note"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="date-picker"
      />
      
      <table className="inventory-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedInventory.length === inventory.length}
              />
            </th>
            <th>ID</th>
            <th>Item</th>
            <th>Batch No</th>
            <th>Initial Quantity</th>
            <th>Remaining Quantity</th>
            <th>Unit Cost (Ksh)</th>
            <th>Total Cost (Ksh)</th>
            <th>Amount Paid (Ksh)</th>
            <th>Balance (Ksh)</th>
            <th>Comments</th>
            <th>Unit Price (Ksh)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {currentInventory.map((inventoryItem) => (
            <tr key={inventoryItem.inventory_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedInventory.includes(inventoryItem.inventory_id)}
                  onChange={() => handleCheckboxChange(inventoryItem.inventory_id)}
                />
              </td>
              <td>{inventoryItem.inventory_id}</td>
              <td>{inventoryItem.itemname}</td>
              <td>{inventoryItem.batchnumber}</td>
              <td>{inventoryItem.initial_quantity} {inventoryItem.metric}</td>
              <td>{inventoryItem.remaining_quantity} {inventoryItem.metric}</td>
              <td>{inventoryItem.unitCost}</td>
              <td>{inventoryItem.totalCost}</td>
              <td>{inventoryItem.amountPaid}</td>
              <td>{inventoryItem.balance}</td>
              <td>{inventoryItem.note}</td>
              <td>{inventoryItem.unitPrice}</td>
              <td>{new Date(inventoryItem.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="export-buttons">
        <ExportExcel data={inventory} fileName="InventoryData" />
        <DownloadPDF tableId="inventory-table" fileName="InventoryData" />
      </div>

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
    </div>
  );
};

export default Inventory;
