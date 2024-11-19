import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ExportExcel from '../Components/Download/ExportExcel';
import DownloadPDF from '../Components/Download/DownloadPDF';
import DistributeInventoryModal from '../Components/DistributeInventoryModal';
import UpdateInventory from './updateInventory';
import '../Styles/inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInventoryId, setEditingInventoryId] = useState(null); // Track editing inventory
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('No access token found, please log in.');
          return;
        }

        const response = await axios.get('/api/diraja/allinventories', {
          headers: { Authorization: `Bearer ${accessToken}` },
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
    setSelectedInventory(
      selectedInventory.length === inventory.length ? [] : inventory.map((inv) => inv.inventory_id)
    );
  };

  const handleAction = () => {
    if (selectedAction === 'distribute') {
      setShowModal(true);
    } else if (selectedAction === 'delete') {
      handleDelete();
    }
  };

  const handleDelete = async () => {
    const accessToken = localStorage.getItem('access_token');
    await Promise.all(
      selectedInventory.map((inventoryId) =>
        axios.delete(`/api/diraja/inventory/${inventoryId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
    );
    setInventory((prev) => prev.filter((inv) => !selectedInventory.includes(inv.inventory_id)));
    setSelectedInventory([]);
    setSelectedAction('');
  };

  const handleDistributeSuccess = () => {
    setSelectedInventory([]);
    setSelectedAction('');
  };

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

  const handleEditClick = (inventoryId) => {
    setEditingInventoryId(inventoryId); // Set editing inventory
  };

  return (
    <div className="inventory-container">
      {/* Display Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Action Selection and Buttons */}
      <input
        type="text"
        placeholder="Search by item, batch number, or note"
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

      <div className="actions-container">
        <div className="actions">
          <select onChange={(e) => setSelectedAction(e.target.value)} value={selectedAction}>
            <option value="">With selected, choose an action</option>
            <option value="distribute">Distribute</option>
            <option value="delete">Delete</option>
          </select>
          <button onClick={handleAction} className="action-button">Apply</button>
        </div>

        {/* Export Buttons */}
        <ExportExcel data={inventory} fileName="InventoryData" />
        <DownloadPDF tableId="inventory-table" fileName="InventoryData" />
      </div>

      {/* Distribute Inventory Modal */}
      {showModal && (
        <DistributeInventoryModal
          selectedInventory={selectedInventory}
          inventory={inventory}
          onClose={() => setShowModal(false)}
          onDistributeSuccess={handleDistributeSuccess}
        />
      )}

      {/* Update Inventory Modal */}
      {editingInventoryId && (
        <UpdateInventory
          inventoryId={editingInventoryId}
          onClose={() => setEditingInventoryId(null)} // Close the modal
          onUpdateSuccess={() => setEditingInventoryId(null)} // Refresh inventory on update
        />
      )}

      {/* Inventory Table */}
      <table id="inventory-table" className="inventory-table">
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
            <th>Actions</th>
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
              <td>{new Date(inventoryItem.created_at).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEditClick(inventoryItem.inventory_id)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={currentPage === pageNumber ? 'active' : ''}
          >
            {pageNumber}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
